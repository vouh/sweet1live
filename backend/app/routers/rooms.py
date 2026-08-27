from datetime import date as date_type, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.auth import get_optional_user
from app.config import settings
from app.database import get_db
from app.fulfilment import serialize_booking
from app.inventory import SLOT_WINDOWS, assert_room_slot_free, hold_expiry, room_availability, window_for_start
from app.models import (
    CheckoutSessionResponse,
    Order,
    OrderItem,
    Room,
    RoomAvailability,
    RoomBooking,
    RoomBookingCreate,
    RoomBookingPublic,
    RoomPublic,
    User,
)
from app.payments import LineItem, create_checkout_for_order

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _public(room: Room) -> RoomPublic:
    return RoomPublic(
        id=room.id,
        slug=room.slug,
        name=room.name,
        tagline=room.tagline,
        description=room.description,
        capacity_seated=room.capacity_seated,
        capacity_standing=room.capacity_standing,
        min_party=room.min_party,
        hire_fee_pence=room.hire_fee_pence,
        deposit_pence=room.deposit_pence,
        image_url=room.image_url,
        features=[f for f in room.features.split(",") if f],
        sort_order=room.sort_order,
    )


def _get_room_or_404(db: Session, slug: str) -> Room:
    room = db.exec(select(Room).where(Room.slug == slug, Room.is_active == True)).first()  # noqa: E712
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room


@router.get("", response_model=list[RoomPublic])
def list_rooms(db: Session = Depends(get_db)):
    rooms = db.exec(
        select(Room).where(Room.is_active == True).order_by(Room.sort_order)  # noqa: E712  # type: ignore[arg-type]
    ).all()
    return [_public(room) for room in rooms]


@router.get("/slots")
def list_slot_windows():
    """The bookable windows the venue offers, for rendering the picker."""
    return [{"start_time": s, "end_time": e, "label": label} for s, e, label in SLOT_WINDOWS]


@router.get("/{slug}", response_model=RoomPublic)
def get_room(slug: str, db: Session = Depends(get_db)):
    return _public(_get_room_or_404(db, slug))


@router.get("/{slug}/availability", response_model=RoomAvailability)
def get_availability(
    slug: str,
    date: date_type = Query(description="Day to check, YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    return room_availability(db, _get_room_or_404(db, slug), date)


@router.post("/bookings", response_model=CheckoutSessionResponse, status_code=201)
def create_booking(
    payload: RoomBookingCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Hold a room, then take the deposit through Stripe.

    Rooms with `deposit_pence == 0` are confirmed on the spot; the rest stay in
    `pending_payment` until the webhook lands, and the slot is released if the
    customer never completes checkout.
    """
    room = _get_room_or_404(db, payload.room_slug)

    if payload.date < datetime.utcnow().date():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Choose a date in the future.",
        )

    capacity = max(room.capacity_seated, room.capacity_standing)
    if payload.party_size > capacity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{room.name} holds up to {capacity} guests.",
        )
    if payload.party_size < room.min_party:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{room.name} has a minimum of {room.min_party} guests.",
        )

    start_time, end_time, _label = window_for_start(payload.start_time)
    assert_room_slot_free(db, room, payload.date, start_time, end_time)

    user_id = user.id if user else None

    booking = RoomBooking(
        room_id=room.id,
        user_id=user_id,
        name=payload.name.strip(),
        email=payload.email.lower(),
        phone=payload.phone,
        party_size=payload.party_size,
        date=payload.date,
        start_time=start_time,
        end_time=end_time,
        event_type=payload.event_type,
        notes=payload.notes,
        deposit_pence=room.deposit_pence,
        status="pending_payment" if room.deposit_pence > 0 else "confirmed",
        expires_at=hold_expiry() if room.deposit_pence > 0 else None,
        confirmed_at=None if room.deposit_pence > 0 else datetime.utcnow(),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    order = Order(
        user_id=user_id,
        customer_name=booking.name,
        customer_email=booking.email,
        kind="room_deposit",
        subtotal_pence=room.deposit_pence,
        currency=settings.currency,
        room_booking_id=booking.id,
        expires_at=booking.expires_at,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    db.add(
        OrderItem(
            order_id=order.id,
            description=f"{room.name} — {payload.date.isoformat()} · {start_time}–{end_time} (deposit)",
            quantity=1,
            unit_price_pence=room.deposit_pence,
        )
    )
    db.commit()

    return create_checkout_for_order(
        db,
        order,
        [
            LineItem(
                name=f"{room.name} — hire deposit",
                description=f"{payload.date.strftime('%a %d %b %Y')} · {start_time}–{end_time}",
                amount_pence=room.deposit_pence,
                quantity=1,
            )
        ],
    )


@router.get("/bookings/{reference}", response_model=RoomBookingPublic)
def get_booking(
    reference: str,
    email: str = Query(description="Must match the email on the booking"),
    db: Session = Depends(get_db),
):
    booking = db.exec(select(RoomBooking).where(RoomBooking.reference == reference)).first()
    # Same 404 whether the reference is wrong or the email does not match, so
    # the endpoint cannot be used to enumerate references.
    if booking is None or booking.email != email.lower():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return serialize_booking(db, booking)
