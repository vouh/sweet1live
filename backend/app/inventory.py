"""Seat and room-slot availability.

Two invariants live here:

1.  A ticket type never sells more than `quantity_total`. Seats move
    total -> reserved (checkout started) -> sold (Stripe confirmed payment),
    and fall back to the pool if the shopper walks away.
2.  A room never holds two overlapping bookings on the same date, and a
    published event in that room blocks the windows it runs across.
"""

from datetime import date as date_type, datetime, timedelta

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.config import settings
from app.models import (
    Event,
    Order,
    OrderItem,
    Room,
    RoomAvailability,
    RoomBooking,
    RoomSlot,
    TicketType,
)

# The windows the venue sells. Non-overlapping back-to-back sittings, plus a
# full-day option that deliberately overlaps all of them — the overlap test
# below is what keeps the two consistent.
SLOT_WINDOWS: list[tuple[str, str, str]] = [
    ("12:00", "16:00", "Daytime"),
    ("17:00", "20:30", "Early evening"),
    ("21:00", "00:30", "Late set"),
    ("12:00", "00:30", "Full day exclusive"),
]

# Bookings in these states occupy the room.
BLOCKING_BOOKING_STATUSES = ("confirmed", "pending_payment")


def slot_minutes(hhmm: str) -> int:
    """Minutes from the start of the venue's trading day.

    Anything before 06:00 belongs to the previous night, so "00:30" sorts
    after "21:00" instead of before it.
    """
    hours, minutes = (int(part) for part in hhmm.split(":"))
    if hours < 6:
        hours += 24
    return hours * 60 + minutes


def windows_overlap(a_start: str, a_end: str, b_start: str, b_end: str) -> bool:
    a1, a2 = slot_minutes(a_start), slot_minutes(a_end)
    b1, b2 = slot_minutes(b_start), slot_minutes(b_end)
    return a1 < b2 and b1 < a2


def window_for_start(start_time: str) -> tuple[str, str, str]:
    for start, end, label in SLOT_WINDOWS:
        if start == start_time:
            return start, end, label
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"Unknown start_time. Valid values: {sorted({s for s, _, _ in SLOT_WINDOWS})}",
    )


# ---------------------------------------------------------------------
# Rooms
# ---------------------------------------------------------------------


def _live_bookings(db: Session, room_id: str, on_date: date_type) -> list[RoomBooking]:
    now = datetime.utcnow()
    statement = select(RoomBooking).where(
        RoomBooking.room_id == room_id,
        RoomBooking.date == on_date,
        RoomBooking.status.in_(BLOCKING_BOOKING_STATUSES),  # type: ignore[attr-defined]
    )
    bookings = db.exec(statement).all()
    # An unpaid hold past its expiry no longer occupies the room, even if the
    # sweeper has not run yet.
    return [
        booking
        for booking in bookings
        if booking.status == "confirmed" or booking.expires_at is None or booking.expires_at > now
    ]


def _event_windows(db: Session, room_id: str, on_date: date_type) -> list[tuple[str, str]]:
    """Windows blocked by ticketed events programmed in this room."""
    day_start = datetime.combine(on_date, datetime.min.time())
    statement = select(Event).where(
        Event.room_id == room_id,
        Event.status == "published",
        Event.starts_at >= day_start,
        Event.starts_at < day_start + timedelta(days=1),
    )
    windows: list[tuple[str, str]] = []
    for event in db.exec(statement).all():
        start = (event.doors_at or event.starts_at).strftime("%H:%M")
        end_dt = event.ends_at or (event.starts_at + timedelta(hours=3))
        windows.append((start, end_dt.strftime("%H:%M")))
    return windows


def room_availability(db: Session, room: Room, on_date: date_type) -> RoomAvailability:
    taken = [(b.start_time, b.end_time) for b in _live_bookings(db, room.id, on_date)]
    taken += _event_windows(db, room.id, on_date)

    slots = [
        RoomSlot(
            start_time=start,
            end_time=end,
            label=label,
            available=not any(windows_overlap(start, end, t_start, t_end) for t_start, t_end in taken),
        )
        for start, end, label in SLOT_WINDOWS
    ]
    return RoomAvailability(room_id=room.id, room_slug=room.slug, date=on_date, slots=slots)


def assert_room_slot_free(
    db: Session, room: Room, on_date: date_type, start_time: str, end_time: str
) -> None:
    taken = [(b.start_time, b.end_time) for b in _live_bookings(db, room.id, on_date)]
    taken += _event_windows(db, room.id, on_date)
    if any(windows_overlap(start_time, end_time, t_start, t_end) for t_start, t_end in taken):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{room.name} is already booked for that window on {on_date.isoformat()}.",
        )


# ---------------------------------------------------------------------
# Tickets
# ---------------------------------------------------------------------


def on_sale(ticket_type: TicketType, now: datetime | None = None) -> bool:
    now = now or datetime.utcnow()
    if not ticket_type.is_active:
        return False
    if ticket_type.sales_start and now < ticket_type.sales_start:
        return False
    if ticket_type.sales_end and now > ticket_type.sales_end:
        return False
    return True


def reserve_seats(db: Session, lines: list[tuple[str, int]]) -> list[tuple[TicketType, int]]:
    """Move seats into `quantity_reserved` for an in-flight checkout.

    Raises 409 if a line cannot be satisfied. The caller commits; on any later
    failure it must call `release_seats` (or let the order expire).
    """
    reserved: list[tuple[TicketType, int]] = []
    for ticket_type_id, quantity in lines:
        # SELECT ... FOR UPDATE on Postgres so two shoppers cannot both read the
        # last seat as available. SQLAlchemy omits it on SQLite, where the
        # write lock serialises the transaction anyway.
        statement = select(TicketType).where(TicketType.id == ticket_type_id).with_for_update()
        ticket_type = db.exec(statement).first()

        if ticket_type is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unknown ticket type {ticket_type_id}",
            )
        if not on_sale(ticket_type):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{ticket_type.name} is not on sale.",
            )
        if quantity > ticket_type.max_per_order:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Maximum {ticket_type.max_per_order} × {ticket_type.name} per order.",
            )
        if quantity > ticket_type.quantity_available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Only {ticket_type.quantity_available} × {ticket_type.name} left."
                    if ticket_type.quantity_available
                    else f"{ticket_type.name} is sold out."
                ),
            )

        ticket_type.quantity_reserved += quantity
        db.add(ticket_type)
        reserved.append((ticket_type, quantity))

    return reserved


def _order_lines(db: Session, order: Order) -> list[OrderItem]:
    statement = select(OrderItem).where(OrderItem.order_id == order.id)
    return list(db.exec(statement).all())


def release_seats(db: Session, order: Order) -> None:
    """Hand an abandoned order's seats back to the pool."""
    for item in _order_lines(db, order):
        if item.ticket_type_id is None:
            continue
        ticket_type = db.get(TicketType, item.ticket_type_id)
        if ticket_type is None:
            continue
        ticket_type.quantity_reserved = max(0, ticket_type.quantity_reserved - item.quantity)
        db.add(ticket_type)


def settle_seats(db: Session, order: Order) -> None:
    """Payment cleared: reserved seats become sold."""
    for item in _order_lines(db, order):
        if item.ticket_type_id is None:
            continue
        ticket_type = db.get(TicketType, item.ticket_type_id)
        if ticket_type is None:
            continue
        ticket_type.quantity_reserved = max(0, ticket_type.quantity_reserved - item.quantity)
        ticket_type.quantity_sold += item.quantity
        db.add(ticket_type)


def hold_expiry(now: datetime | None = None) -> datetime:
    return (now or datetime.utcnow()) + timedelta(minutes=settings.checkout_hold_minutes)


def expire_stale_holds(db: Session) -> int:
    """Release orders and room holds whose checkout window has passed.

    Stripe also fires `checkout.session.expired`, but a webhook can be delayed
    or the endpoint can be down — this sweeper is the backstop so seats are
    never stranded.
    """
    now = datetime.utcnow()
    released = 0

    stale_orders = db.exec(
        select(Order).where(
            Order.status == "pending",
            Order.expires_at.is_not(None),  # type: ignore[union-attr]
            Order.expires_at < now,  # type: ignore[operator]
        )
    ).all()
    for order in stale_orders:
        release_seats(db, order)
        order.status = "expired"
        db.add(order)
        released += 1

    stale_bookings = db.exec(
        select(RoomBooking).where(
            RoomBooking.status == "pending_payment",
            RoomBooking.expires_at.is_not(None),  # type: ignore[union-attr]
            RoomBooking.expires_at < now,  # type: ignore[operator]
        )
    ).all()
    for booking in stale_bookings:
        booking.status = "expired"
        db.add(booking)
        released += 1

    if released:
        db.commit()
    return released
