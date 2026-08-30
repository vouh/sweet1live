from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.auth import get_optional_user
from app.config import settings
from app.database import get_db
from app.inventory import hold_expiry, reserve_seats
from app.models import (
    CheckoutSessionResponse,
    Event,
    FoodCheckoutRequest,
    MenuItem,
    Order,
    OrderItem,
    TicketCheckoutRequest,
    TicketType,
    User,
)
from app.routers.menus import COLLECTION_COURSES
from app.payments import LineItem, create_checkout_for_order
from app.rate_limit import client_ip, enforce_rate_limit

router = APIRouter(prefix="/checkout", tags=["checkout"])


def _enforce_checkout_rate_limit(request: Request) -> None:
    enforce_rate_limit(f"checkout-ip:{client_ip(request)}", limit=30, window_seconds=15 * 60)


@router.post("/tickets", response_model=CheckoutSessionResponse, status_code=201)
def checkout_tickets(
    request: Request,
    payload: TicketCheckoutRequest,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    _enforce_checkout_rate_limit(request)
    """Hold the seats, open an order, and hand back a Stripe Checkout URL.

    Prices come from the database, never from the request — the client only
    chooses which ticket type and how many.
    """
    event = db.exec(select(Event).where(Event.slug == payload.event_slug)).first()
    if event is None or event.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.starts_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This event has already taken place.",
        )

    # Collapse duplicate lines so "2 + 3 of the same tier" checks the per-order
    # cap against 5, not twice against 3.
    merged: dict[str, int] = {}
    for line in payload.lines:
        merged[line.ticket_type_id] = merged.get(line.ticket_type_id, 0) + line.quantity

    # Reject cross-event ids before taking any hold.
    owned = {
        ticket_type.id
        for ticket_type in db.exec(
            select(TicketType).where(TicketType.event_id == event.id)
        ).all()
    }
    if not set(merged) <= owned:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Ticket type does not belong to this event.",
        )

    reserved = reserve_seats(db, list(merged.items()))

    subtotal = sum(ticket_type.price_pence * quantity for ticket_type, quantity in reserved)

    order = Order(
        user_id=user.id if user else None,
        customer_name=payload.customer_name.strip(),
        customer_email=payload.customer_email.lower(),
        kind="tickets",
        subtotal_pence=subtotal,
        currency=settings.currency,
        event_id=event.id,
        expires_at=hold_expiry(),
    )
    db.add(order)
    db.flush()  # need order.id for the items, same transaction as the hold

    for ticket_type, quantity in reserved:
        db.add(
            OrderItem(
                order_id=order.id,
                ticket_type_id=ticket_type.id,
                description=f"{event.title} — {ticket_type.name}",
                quantity=quantity,
                unit_price_pence=ticket_type.price_pence,
            )
        )

    # One commit: the seats are only held if the order exists, and vice versa.
    db.commit()
    db.refresh(order)

    return create_checkout_for_order(
        db,
        order,
        [
            LineItem(
                name=f"{event.title} — {ticket_type.name}",
                description=f"{event.starts_at.strftime('%a %d %b %Y · %H:%M')}",
                amount_pence=ticket_type.price_pence,
                quantity=quantity,
            )
            for ticket_type, quantity in reserved
        ],
    )


@router.post("/collection", response_model=CheckoutSessionResponse, status_code=201)
def checkout_collection(
    request: Request,
    payload: FoodCheckoutRequest,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    _enforce_checkout_rate_limit(request)
    """Open a collection order and hand back a Stripe Checkout URL.

    Only Small Plates and Mains are eligible — prices always come from the DB.
    """
    merged: dict[str, int] = {}
    for line in payload.lines:
        merged[line.menu_item_id] = merged.get(line.menu_item_id, 0) + line.quantity

    resolved: list[tuple[MenuItem, int]] = []
    for menu_item_id, quantity in merged.items():
        item = db.get(MenuItem, menu_item_id)
        if item is None or not item.is_active or item.course not in COLLECTION_COURSES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="One or more dishes are not available for collection.",
            )
        if item.price_pence <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="This item cannot be ordered online.",
            )
        resolved.append((item, quantity))

    subtotal = sum(item.price_pence * quantity for item, quantity in resolved)

    order = Order(
        user_id=user.id if user else None,
        customer_name=payload.customer_name.strip(),
        customer_email=payload.customer_email.lower(),
        kind="food_collection",
        subtotal_pence=subtotal,
        currency=settings.currency,
        expires_at=hold_expiry(),
    )
    db.add(order)
    db.flush()

    pickup = payload.pickup_time.strip()
    for item, quantity in resolved:
        db.add(
            OrderItem(
                order_id=order.id,
                menu_item_id=item.id,
                description=f"{item.name} · collection {pickup}",
                quantity=quantity,
                unit_price_pence=item.price_pence,
            )
        )

    db.commit()
    db.refresh(order)

    return create_checkout_for_order(
        db,
        order,
        [
            LineItem(
                name=item.name,
                description=f"Collection at {pickup}",
                amount_pence=item.price_pence,
                quantity=quantity,
            )
            for item, quantity in resolved
        ],
    )
