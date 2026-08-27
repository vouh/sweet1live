"""What happens to an order once Stripe says the money moved.

Everything in here is idempotent: Stripe delivers webhooks at least once, and
the customer also lands on the success page, which polls the same order. Both
paths funnel through `mark_order_paid`, so it must be safe to run twice.
"""

from datetime import datetime

from sqlmodel import Session, select

from app.config import settings
from app.inventory import release_seats, settle_seats
from app.models import (
    Event,
    Order,
    OrderItem,
    OrderItemPublic,
    OrderPublic,
    Room,
    RoomBooking,
    RoomBookingPublic,
    Ticket,
    TicketPublic,
    TicketType,
)


def _items(db: Session, order: Order) -> list[OrderItem]:
    return list(db.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all())


def mint_tickets(db: Session, order: Order) -> list[Ticket]:
    """Issue one Ticket row per seat bought. No-op if already issued."""
    existing = db.exec(select(Ticket).where(Ticket.order_id == order.id)).all()
    if existing:
        return list(existing)

    tickets: list[Ticket] = []
    for item in _items(db, order):
        if item.ticket_type_id is None or order.event_id is None:
            continue
        for _ in range(item.quantity):
            ticket = Ticket(
                order_id=order.id,
                event_id=order.event_id,
                ticket_type_id=item.ticket_type_id,
                holder_name=order.customer_name,
            )
            db.add(ticket)
            tickets.append(ticket)
    return tickets


def mark_order_paid(db: Session, order: Order, payment_intent_id: str | None = None) -> Order:
    if payment_intent_id and not order.stripe_payment_intent_id:
        order.stripe_payment_intent_id = payment_intent_id

    if order.status == "paid":
        # Already fulfilled — a duplicate webhook or a success-page poll.
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    if order.status in ("refunded", "cancelled"):
        # Do not resurrect an order somebody has already unwound.
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    if order.status == "expired":
        # The sweeper released the seats but the customer paid anyway. Take the
        # seats back out of the pool so the count stays honest; if that pushes
        # the event over capacity the door team sees it in the oversold report.
        from app.inventory import reserve_seats  # local import avoids a cycle

        try:
            reserve_seats(db, [(i.ticket_type_id, i.quantity) for i in _items(db, order) if i.ticket_type_id])
        except Exception:  # noqa: BLE001 - oversell is better than losing a paid order
            pass

    order.status = "paid"
    order.paid_at = datetime.utcnow()

    if order.kind == "tickets":
        settle_seats(db, order)
        mint_tickets(db, order)
    elif order.kind == "room_deposit" and order.room_booking_id:
        booking = db.get(RoomBooking, order.room_booking_id)
        if booking and booking.status != "cancelled":
            booking.status = "confirmed"
            booking.confirmed_at = datetime.utcnow()
            db.add(booking)

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def mark_order_cancelled(db: Session, order: Order, new_status: str = "cancelled") -> Order:
    """Abandoned or expired checkout — put the inventory back."""
    if order.status != "pending":
        return order

    if order.kind == "tickets":
        release_seats(db, order)
    elif order.kind == "room_deposit" and order.room_booking_id:
        booking = db.get(RoomBooking, order.room_booking_id)
        if booking and booking.status == "pending_payment":
            booking.status = new_status if new_status == "expired" else "cancelled"
            db.add(booking)

    order.status = new_status
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def mark_order_refunded(db: Session, order: Order) -> Order:
    """Refund cleared: void the tickets and return the seats to sale."""
    if order.status == "refunded":
        return order

    if order.status == "paid" and order.kind == "tickets":
        for ticket in db.exec(select(Ticket).where(Ticket.order_id == order.id)).all():
            ticket.status = "void"
            db.add(ticket)
        for item in _items(db, order):
            if item.ticket_type_id is None:
                continue
            ticket_type = db.get(TicketType, item.ticket_type_id)
            if ticket_type:
                ticket_type.quantity_sold = max(0, ticket_type.quantity_sold - item.quantity)
                db.add(ticket_type)

    if order.kind == "room_deposit" and order.room_booking_id:
        booking = db.get(RoomBooking, order.room_booking_id)
        if booking:
            booking.status = "cancelled"
            db.add(booking)

    order.status = "refunded"
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


# ---------------------------------------------------------------------
# Serialisation
# ---------------------------------------------------------------------


def serialize_ticket(db: Session, ticket: Ticket) -> TicketPublic:
    event = db.get(Event, ticket.event_id)
    ticket_type = db.get(TicketType, ticket.ticket_type_id)
    room = db.get(Room, event.room_id) if event else None
    return TicketPublic(
        id=ticket.id,
        code=ticket.code,
        status=ticket.status,
        holder_name=ticket.holder_name,
        ticket_type_name=ticket_type.name if ticket_type else "Ticket",
        event_title=event.title if event else "",
        event_slug=event.slug if event else "",
        room_name=room.name if room else "",
        starts_at=event.starts_at if event else datetime.utcnow(),
        doors_at=event.doors_at if event else None,
    )


def serialize_order(db: Session, order: Order) -> OrderPublic:
    tickets = db.exec(select(Ticket).where(Ticket.order_id == order.id)).all()
    return OrderPublic(
        id=order.id,
        reference=order.reference,
        status=order.status,
        kind=order.kind,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        subtotal_pence=order.subtotal_pence,
        currency=order.currency,
        created_at=order.created_at,
        paid_at=order.paid_at,
        items=[
            OrderItemPublic(
                description=item.description,
                quantity=item.quantity,
                unit_price_pence=item.unit_price_pence,
            )
            for item in _items(db, order)
        ],
        tickets=[serialize_ticket(db, ticket) for ticket in tickets],
    )


def serialize_booking(db: Session, booking: RoomBooking) -> RoomBookingPublic:
    room = db.get(Room, booking.room_id)
    return RoomBookingPublic(
        id=booking.id,
        reference=booking.reference,
        room_id=booking.room_id,
        room_name=room.name if room else "",
        room_slug=room.slug if room else "",
        name=booking.name,
        email=booking.email,
        party_size=booking.party_size,
        date=booking.date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        event_type=booking.event_type,
        status=booking.status,
        deposit_pence=booking.deposit_pence,
        currency=settings.currency,
        notes=booking.notes,
        created_at=booking.created_at,
    )
