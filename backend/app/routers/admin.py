"""Back-office API behind the staff dashboard.

Every endpoint here reads (and sometimes writes) the same tables the public
site uses — there is no separate admin store. Gated on the shared staff key
rather than a guest JWT: the back office is not a guest account.

Money is integer pence throughout, matching the rest of the codebase.
"""

from datetime import date as date_type, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, SQLModel, func, select

from app.auth import require_staff
from app.config import settings
from app.database import get_db
from app.fulfilment import serialize_booking
from app.models import (
    ContactMessage,
    Event,
    MenuItem,
    MenuItemCreate,
    MenuItemPublic,
    MenuItemUpdate,
    Order,
    OrderItem,
    Reservation,
    ReservationPublic,
    Room,
    RoomBooking,
    RoomBookingPublic,
    Ticket,
    TicketType,
    User,
    VenueEnquiry,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_staff)])

# Status vocabularies. The API is the only place these are enforced, so the
# admin UI can offer exactly these and nothing else.
RESERVATION_STATUSES = ("pending", "confirmed", "seated", "completed", "cancelled")
EVENT_STATUSES = ("draft", "published", "cancelled")
BOOKING_STATUSES = ("pending_payment", "confirmed", "cancelled", "expired")

# Recent-activity feeds only ever need a slice of each table.
FEED_PER_SOURCE = 12


def _count(db: Session, model, *where) -> int:
    statement = select(func.count()).select_from(model)
    for clause in where:
        statement = statement.where(clause)
    return int(db.exec(statement).one())


def _matches(query: str | None, *fields: str | None) -> bool:
    if not query:
        return True
    needle = query.strip().lower()
    return any(needle in (field or "").lower() for field in fields)


# =====================================================================
# Overview
# =====================================================================


class ActivityItem(SQLModel):
    id: str
    kind: str
    title: str
    detail: str
    at: datetime
    href: str


class AdminOverview(SQLModel):
    currency: str
    reservations_today: int
    covers_today: int
    reservations_pending: int
    upcoming_events: int
    tickets_sold_upcoming: int
    events_sold_out: int
    open_enquiries: int
    bookings_pending: int
    bookings_confirmed: int
    revenue_30d_pence: int
    paid_orders_30d: int
    guests_total: int
    activity: list[ActivityItem]


def _recent_activity(db: Session, limit: int) -> list[ActivityItem]:
    items: list[ActivityItem] = []

    reservations = db.exec(
        select(Reservation).order_by(Reservation.created_at.desc()).limit(FEED_PER_SOURCE)
    ).all()
    for row in reservations:
        items.append(
            ActivityItem(
                id=f"reservation:{row.id}",
                kind="reservation",
                title=f"Table for {row.party_size} — {row.name}",
                detail=f"{row.date:%a %d %b} at {row.time} · {row.status}",
                at=row.created_at,
                href="/staff-dashboard/reservations",
            )
        )

    bookings = db.exec(
        select(RoomBooking).order_by(RoomBooking.created_at.desc()).limit(FEED_PER_SOURCE)
    ).all()
    rooms = {room.id: room for room in db.exec(select(Room)).all()}
    for row in bookings:
        room = rooms.get(row.room_id)
        items.append(
            ActivityItem(
                id=f"booking:{row.id}",
                kind="venue-hire",
                title=f"{room.name if room else 'Room'} hire — {row.name}",
                detail=f"{row.date:%a %d %b} {row.start_time} · {row.status.replace('_', ' ')}",
                at=row.created_at,
                href="/staff-dashboard/venue-hire",
            )
        )

    messages = db.exec(
        select(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(FEED_PER_SOURCE)
    ).all()
    for row in messages:
        items.append(
            ActivityItem(
                id=f"contact:{row.id}",
                kind="enquiry",
                title=f"Message — {row.subject}",
                detail=f"From {row.name} · {row.email}",
                at=row.created_at,
                href="/staff-dashboard/enquiries",
            )
        )

    enquiries = db.exec(
        select(VenueEnquiry).order_by(VenueEnquiry.created_at.desc()).limit(FEED_PER_SOURCE)
    ).all()
    for row in enquiries:
        items.append(
            ActivityItem(
                id=f"venue-enquiry:{row.id}",
                kind="enquiry",
                title=f"{row.event_type.replace('-', ' ').title()} enquiry — {row.name}",
                detail=f"{row.guests} guests · {row.date:%a %d %b}",
                at=row.created_at,
                href="/staff-dashboard/enquiries",
            )
        )

    orders = db.exec(select(Order).order_by(Order.created_at.desc()).limit(FEED_PER_SOURCE)).all()
    for row in orders:
        label = "Ticket order" if row.kind == "tickets" else "Room deposit"
        items.append(
            ActivityItem(
                id=f"order:{row.id}",
                kind="order",
                title=f"{label} {row.reference} — {row.customer_name}",
                detail=f"{row.subtotal_pence / 100:.2f} {row.currency.upper()} · {row.status}",
                at=row.created_at,
                href="/staff-dashboard/finance",
            )
        )

    items.sort(key=lambda item: item.at, reverse=True)
    return items[:limit]


@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db)):
    today = date_type.today()
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)

    todays = db.exec(select(Reservation).where(Reservation.date == today)).all()
    live_today = [r for r in todays if r.status != "cancelled"]

    upcoming = db.exec(
        select(Event).where(Event.starts_at >= now, Event.status == "published")
    ).all()
    tickets_sold = 0
    sold_out = 0
    for event in upcoming:
        types = db.exec(select(TicketType).where(TicketType.event_id == event.id)).all()
        tickets_sold += sum(t.quantity_sold for t in types)
        if types and all(t.quantity_available == 0 for t in types):
            sold_out += 1

    paid_recent = db.exec(
        select(Order).where(Order.status == "paid", Order.created_at >= month_ago)
    ).all()

    return AdminOverview(
        currency=settings.currency,
        reservations_today=len(live_today),
        covers_today=sum(r.party_size for r in live_today),
        reservations_pending=_count(db, Reservation, Reservation.status == "pending"),
        upcoming_events=len(upcoming),
        tickets_sold_upcoming=tickets_sold,
        events_sold_out=sold_out,
        open_enquiries=_count(db, ContactMessage) + _count(db, VenueEnquiry),
        bookings_pending=_count(db, RoomBooking, RoomBooking.status == "pending_payment"),
        bookings_confirmed=_count(db, RoomBooking, RoomBooking.status == "confirmed"),
        revenue_30d_pence=sum(o.subtotal_pence for o in paid_recent),
        paid_orders_30d=len(paid_recent),
        guests_total=_count(db, User),
        activity=_recent_activity(db, 10),
    )


# =====================================================================
# Reservations
# =====================================================================


class StatusUpdate(SQLModel):
    status: str


@router.get("/reservations", response_model=list[ReservationPublic])
def list_reservations(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = None,
    limit: int = Query(default=200, ge=1, le=500),
):
    statement = select(Reservation).order_by(Reservation.date.desc(), Reservation.time.desc())
    if status_filter:
        statement = statement.where(Reservation.status == status_filter)
    rows = db.exec(statement.limit(limit)).all()
    return [row for row in rows if _matches(q, row.name, row.email, row.notes)]


@router.patch("/reservations/{reservation_id}", response_model=ReservationPublic)
def update_reservation(
    reservation_id: str, payload: StatusUpdate, db: Session = Depends(get_db)
):
    if payload.status not in RESERVATION_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status must be one of {', '.join(RESERVATION_STATUSES)}",
        )
    reservation = db.get(Reservation, reservation_id)
    if reservation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    reservation.status = payload.status
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


# =====================================================================
# Events
# =====================================================================


class AdminTicketType(SQLModel):
    id: str
    name: str
    description: str
    price_pence: int
    quantity_total: int
    quantity_sold: int
    quantity_reserved: int
    quantity_available: int
    is_active: bool


class AdminEvent(SQLModel):
    id: str
    slug: str
    title: str
    subtitle: str
    status: str
    room_name: str
    room_slug: str
    image_url: str
    doors_at: datetime | None
    starts_at: datetime
    ends_at: datetime | None
    currency: str
    capacity: int
    sold: int
    reserved: int
    available: int
    gross_pence: int
    checked_in: int
    ticket_types: list[AdminTicketType]


def _admin_event(db: Session, event: Event, rooms: dict[str, Room]) -> AdminEvent:
    types = db.exec(
        select(TicketType)
        .where(TicketType.event_id == event.id)
        .order_by(TicketType.sort_order)
    ).all()
    room = rooms.get(event.room_id)
    checked_in = _count(
        db, Ticket, Ticket.event_id == event.id, Ticket.status == "checked_in"
    )
    return AdminEvent(
        id=event.id,
        slug=event.slug,
        title=event.title,
        subtitle=event.subtitle,
        status=event.status,
        room_name=room.name if room else "",
        room_slug=room.slug if room else "",
        image_url=event.image_url,
        doors_at=event.doors_at,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        currency=settings.currency,
        capacity=sum(t.quantity_total for t in types),
        sold=sum(t.quantity_sold for t in types),
        reserved=sum(t.quantity_reserved for t in types),
        available=sum(t.quantity_available for t in types),
        gross_pence=sum(t.quantity_sold * t.price_pence for t in types),
        checked_in=checked_in,
        ticket_types=[
            AdminTicketType(
                id=t.id,
                name=t.name,
                description=t.description,
                price_pence=t.price_pence,
                quantity_total=t.quantity_total,
                quantity_sold=t.quantity_sold,
                quantity_reserved=t.quantity_reserved,
                quantity_available=t.quantity_available,
                is_active=t.is_active,
            )
            for t in types
        ],
    )


@router.get("/events", response_model=list[AdminEvent])
def list_events(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = None,
    when: str = Query(default="all", pattern="^(all|upcoming|past)$"),
):
    """Every event, drafts included — the public /events endpoint hides those."""
    statement = select(Event).order_by(Event.starts_at.desc())
    if status_filter:
        statement = statement.where(Event.status == status_filter)
    if when == "upcoming":
        statement = statement.where(Event.starts_at >= datetime.utcnow())
    elif when == "past":
        statement = statement.where(Event.starts_at < datetime.utcnow())

    rooms = {room.id: room for room in db.exec(select(Room)).all()}
    events = db.exec(statement).all()
    return [
        _admin_event(db, event, rooms)
        for event in events
        if _matches(q, event.title, event.subtitle, event.slug)
    ]


@router.patch("/events/{event_id}", response_model=AdminEvent)
def update_event(event_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    if payload.status not in EVENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status must be one of {', '.join(EVENT_STATUSES)}",
        )
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    event.status = payload.status
    db.add(event)
    db.commit()
    db.refresh(event)
    rooms = {room.id: room for room in db.exec(select(Room)).all()}
    return _admin_event(db, event, rooms)


# =====================================================================
# Menus
# =====================================================================


def _menu_public(item: MenuItem) -> MenuItemPublic:
    return MenuItemPublic(**item.model_dump(), currency=settings.currency)


@router.get("/menus", response_model=list[MenuItemPublic])
def list_menu_items(
    db: Session = Depends(get_db),
    course: str | None = None,
    q: str | None = None,
):
    statement = select(MenuItem).order_by(MenuItem.course, MenuItem.sort_order, MenuItem.name)
    if course:
        statement = statement.where(MenuItem.course == course)
    rows = db.exec(statement).all()
    return [_menu_public(row) for row in rows if _matches(q, row.name, row.description, row.course)]


@router.post("/menus", response_model=MenuItemPublic, status_code=201)
def create_menu_item(payload: MenuItemCreate, db: Session = Depends(get_db)):
    item = MenuItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _menu_public(item)


@router.patch("/menus/{item_id}", response_model=MenuItemPublic)
def update_menu_item(item_id: str, payload: MenuItemUpdate, db: Session = Depends(get_db)):
    item = db.get(MenuItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    item.updated_at = datetime.utcnow()
    db.add(item)
    db.commit()
    db.refresh(item)
    return _menu_public(item)


@router.delete("/menus/{item_id}", status_code=204)
def delete_menu_item(item_id: str, db: Session = Depends(get_db)):
    item = db.get(MenuItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    db.delete(item)
    db.commit()


# =====================================================================
# Venue hire
# =====================================================================


class AdminRoom(SQLModel):
    id: str
    slug: str
    name: str
    capacity_seated: int
    capacity_standing: int
    hire_fee_pence: int
    deposit_pence: int
    is_active: bool
    bookings_upcoming: int


class AdminVenueHire(SQLModel):
    currency: str
    pending: int
    confirmed: int
    deposits_held_pence: int
    rooms: list[AdminRoom]
    bookings: list[RoomBookingPublic]


@router.get("/venue-hire", response_model=AdminVenueHire)
def venue_hire(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = None,
):
    statement = select(RoomBooking).order_by(RoomBooking.date.desc(), RoomBooking.created_at.desc())
    if status_filter:
        statement = statement.where(RoomBooking.status == status_filter)
    bookings = [
        booking
        for booking in db.exec(statement).all()
        if _matches(q, booking.name, booking.email, booking.reference)
    ]

    today = date_type.today()
    all_bookings = db.exec(select(RoomBooking)).all()
    rooms = db.exec(select(Room).order_by(Room.sort_order)).all()

    return AdminVenueHire(
        currency=settings.currency,
        pending=sum(1 for b in all_bookings if b.status == "pending_payment"),
        confirmed=sum(1 for b in all_bookings if b.status == "confirmed"),
        deposits_held_pence=sum(b.deposit_pence for b in all_bookings if b.status == "confirmed"),
        rooms=[
            AdminRoom(
                id=room.id,
                slug=room.slug,
                name=room.name,
                capacity_seated=room.capacity_seated,
                capacity_standing=room.capacity_standing,
                hire_fee_pence=room.hire_fee_pence,
                deposit_pence=room.deposit_pence,
                is_active=room.is_active,
                bookings_upcoming=sum(
                    1
                    for b in all_bookings
                    if b.room_id == room.id and b.date >= today and b.status != "cancelled"
                ),
            )
            for room in rooms
        ],
        bookings=[serialize_booking(db, booking) for booking in bookings],
    )


@router.patch("/venue-hire/{booking_id}", response_model=RoomBookingPublic)
def update_booking(booking_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    if payload.status not in BOOKING_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status must be one of {', '.join(BOOKING_STATUSES)}",
        )
    booking = db.get(RoomBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    booking.status = payload.status
    if payload.status == "confirmed" and booking.confirmed_at is None:
        booking.confirmed_at = datetime.utcnow()
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return serialize_booking(db, booking)


# =====================================================================
# Enquiries — contact form + venue-hire enquiries in one inbox
# =====================================================================


class AdminEnquiry(SQLModel):
    id: str
    kind: str
    name: str
    email: str
    subject: str
    message: str
    event_type: str | None
    guests: int | None
    date: date_type | None
    created_at: datetime


@router.get("/enquiries", response_model=list[AdminEnquiry])
def list_enquiries(
    db: Session = Depends(get_db),
    kind: str = Query(default="all", pattern="^(all|contact|venue)$"),
    q: str | None = None,
):
    items: list[AdminEnquiry] = []

    if kind in ("all", "contact"):
        for row in db.exec(
            select(ContactMessage).order_by(ContactMessage.created_at.desc())
        ).all():
            items.append(
                AdminEnquiry(
                    id=row.id,
                    kind="contact",
                    name=row.name,
                    email=row.email,
                    subject=row.subject,
                    message=row.message,
                    event_type=None,
                    guests=None,
                    date=None,
                    created_at=row.created_at,
                )
            )

    if kind in ("all", "venue"):
        for row in db.exec(select(VenueEnquiry).order_by(VenueEnquiry.created_at.desc())).all():
            items.append(
                AdminEnquiry(
                    id=row.id,
                    kind="venue",
                    name=row.name,
                    email=row.email,
                    subject=f"{row.event_type.replace('-', ' ').title()} for {row.guests}",
                    message=row.details or "",
                    event_type=row.event_type,
                    guests=row.guests,
                    date=row.date,
                    created_at=row.created_at,
                )
            )

    items.sort(key=lambda item: item.created_at, reverse=True)
    return [item for item in items if _matches(q, item.name, item.email, item.subject, item.message)]


# =====================================================================
# Guests
# =====================================================================


class AdminGuest(SQLModel):
    id: str
    name: str
    email: str
    has_account: bool
    created_at: datetime | None
    orders_count: int
    tickets_count: int
    reservations_count: int
    bookings_count: int
    spend_pence: int
    currency: str
    last_seen_at: datetime | None


@router.get("/guests", response_model=list[AdminGuest])
def list_guests(
    db: Session = Depends(get_db),
    q: str | None = None,
    accounts_only: bool = False,
):
    """Everyone the venue knows — account holders plus anyone who booked as a guest.

    Keyed on lowercased email, which is what actually identifies a person
    across reservations, orders, and room bookings.
    """
    people: dict[str, AdminGuest] = {}

    def touch(email: str, name: str, *, at: datetime | None) -> AdminGuest | None:
        key = (email or "").strip().lower()
        if not key:
            return None
        person = people.get(key)
        if person is None:
            person = AdminGuest(
                id=key,
                name=name or key,
                email=key,
                has_account=False,
                created_at=None,
                orders_count=0,
                tickets_count=0,
                reservations_count=0,
                bookings_count=0,
                spend_pence=0,
                currency=settings.currency,
                last_seen_at=None,
            )
            people[key] = person
        if at and (person.last_seen_at is None or at > person.last_seen_at):
            person.last_seen_at = at
        return person

    for user in db.exec(select(User)).all():
        person = touch(user.email, user.name, at=user.created_at)
        if person:
            person.id = user.id
            person.name = user.name
            person.has_account = True
            person.created_at = user.created_at

    if not accounts_only:
        for reservation in db.exec(select(Reservation)).all():
            person = touch(reservation.email, reservation.name, at=reservation.created_at)
            if person:
                person.reservations_count += 1

        for booking in db.exec(select(RoomBooking)).all():
            person = touch(booking.email, booking.name, at=booking.created_at)
            if person:
                person.bookings_count += 1

    ticket_counts: dict[str, int] = {}
    for order_id, count in db.exec(
        select(Ticket.order_id, func.count()).group_by(Ticket.order_id)
    ).all():
        ticket_counts[order_id] = int(count)

    for order in db.exec(select(Order)).all():
        person = touch(order.customer_email, order.customer_name, at=order.created_at)
        if person is None:
            continue
        person.orders_count += 1
        person.tickets_count += ticket_counts.get(order.id, 0)
        if order.status == "paid":
            person.spend_pence += order.subtotal_pence

    rows = [
        person
        for person in people.values()
        if (person.has_account or not accounts_only) and _matches(q, person.name, person.email)
    ]
    rows.sort(key=lambda person: (person.last_seen_at or datetime.min), reverse=True)
    return rows


# =====================================================================
# Finance
# =====================================================================


class AdminOrderRow(SQLModel):
    id: str
    reference: str
    status: str
    kind: str
    customer_name: str
    customer_email: str
    subtotal_pence: int
    currency: str
    created_at: datetime
    paid_at: datetime | None
    summary: str
    stripe_payment_intent_id: str | None


class AdminFinance(SQLModel):
    currency: str
    stripe_enabled: bool
    window_days: int
    gross_paid_pence: int
    tickets_pence: int
    deposits_pence: int
    pending_pence: int
    refunded_pence: int
    paid_count: int
    pending_count: int
    refunded_count: int
    average_order_pence: int
    orders: list[AdminOrderRow]


@router.get("/finance", response_model=AdminFinance)
def finance(
    db: Session = Depends(get_db),
    days: int = Query(default=90, ge=1, le=730),
    status_filter: str | None = Query(default=None, alias="status"),
    kind: str | None = None,
    q: str | None = None,
):
    since = datetime.utcnow() - timedelta(days=days)
    window = db.exec(
        select(Order).where(Order.created_at >= since).order_by(Order.created_at.desc())
    ).all()

    paid = [o for o in window if o.status == "paid"]
    pending = [o for o in window if o.status == "pending"]
    refunded = [o for o in window if o.status == "refunded"]
    gross = sum(o.subtotal_pence for o in paid)

    items_by_order: dict[str, list[OrderItem]] = {}
    for item in db.exec(select(OrderItem)).all():
        items_by_order.setdefault(item.order_id, []).append(item)

    shown = window
    if status_filter:
        shown = [o for o in shown if o.status == status_filter]
    if kind:
        shown = [o for o in shown if o.kind == kind]
    shown = [o for o in shown if _matches(q, o.reference, o.customer_name, o.customer_email)]

    def summarise(order: Order) -> str:
        items = items_by_order.get(order.id, [])
        if not items:
            return "Room deposit" if order.kind == "room_deposit" else "—"
        return ", ".join(f"{item.quantity} × {item.description}" for item in items)

    return AdminFinance(
        currency=settings.currency,
        stripe_enabled=settings.stripe_enabled,
        window_days=days,
        gross_paid_pence=gross,
        tickets_pence=sum(o.subtotal_pence for o in paid if o.kind == "tickets"),
        deposits_pence=sum(o.subtotal_pence for o in paid if o.kind == "room_deposit"),
        pending_pence=sum(o.subtotal_pence for o in pending),
        refunded_pence=sum(o.subtotal_pence for o in refunded),
        paid_count=len(paid),
        pending_count=len(pending),
        refunded_count=len(refunded),
        average_order_pence=round(gross / len(paid)) if paid else 0,
        orders=[
            AdminOrderRow(
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
                summary=summarise(order),
                stripe_payment_intent_id=order.stripe_payment_intent_id,
            )
            for order in shown
        ],
    )


# =====================================================================
# Settings
# =====================================================================


class TableCount(SQLModel):
    table: str
    label: str
    rows: int


class AdminSettingsView(SQLModel):
    """Read-only view of how this deployment is wired. No secrets, ever —
    only whether each one is configured."""

    currency: str
    public_site_url: str
    cors_origins: list[str]
    database_backend: str
    checkout_hold_minutes: int
    session_hours: int
    stripe_enabled: bool
    stripe_webhook_configured: bool
    email_configured: bool
    supabase_configured: bool
    rooms_active: int
    rooms_total: int
    tables: list[TableCount]


@router.get("/settings", response_model=AdminSettingsView)
def admin_settings(db: Session = Depends(get_db)):
    backend = settings.database_url.split("://", 1)[0] if "://" in settings.database_url else "unknown"
    rooms = db.exec(select(Room)).all()

    return AdminSettingsView(
        currency=settings.currency,
        public_site_url=settings.public_site_url,
        cors_origins=settings.cors_origins,
        database_backend=backend,
        checkout_hold_minutes=settings.checkout_hold_minutes,
        session_hours=settings.jwt_expire_hours,
        stripe_enabled=settings.stripe_enabled,
        stripe_webhook_configured=bool(settings.stripe_webhook_secret),
        email_configured=False,
        supabase_configured=bool(settings.supabase_url),
        rooms_active=sum(1 for room in rooms if room.is_active),
        rooms_total=len(rooms),
        tables=[
            TableCount(table="rooms", label="Rooms", rows=len(rooms)),
            TableCount(table="events", label="Events", rows=_count(db, Event)),
            TableCount(table="ticket_types", label="Ticket types", rows=_count(db, TicketType)),
            TableCount(table="tickets", label="Tickets issued", rows=_count(db, Ticket)),
            TableCount(table="orders", label="Orders", rows=_count(db, Order)),
            TableCount(table="room_bookings", label="Room bookings", rows=_count(db, RoomBooking)),
            TableCount(table="reservations", label="Reservations", rows=_count(db, Reservation)),
            TableCount(table="menu_items", label="Menu items", rows=_count(db, MenuItem)),
            TableCount(table="contact_messages", label="Messages", rows=_count(db, ContactMessage)),
            TableCount(table="venue_enquiries", label="Venue enquiries", rows=_count(db, VenueEnquiry)),
            TableCount(table="users", label="Guest accounts", rows=_count(db, User)),
        ],
    )


# =====================================================================
# Notifications
# =====================================================================


class AdminNotification(SQLModel):
    id: str
    kind: str
    severity: str
    title: str
    detail: str
    at: datetime
    href: str


@router.get("/notifications", response_model=list[AdminNotification])
def notifications(db: Session = Depends(get_db), limit: int = Query(default=40, ge=1, le=100)):
    """Derived from the tables themselves — there is no notifications table, so
    nothing here is 'read' or dismissible. It is the floor's alert list: what
    is unactioned, what sold out, and what expired."""
    out: list[AdminNotification] = []
    now = datetime.utcnow()

    for row in db.exec(
        select(Reservation)
        .where(Reservation.status == "pending")
        .order_by(Reservation.created_at.desc())
        .limit(limit)
    ).all():
        out.append(
            AdminNotification(
                id=f"reservation:{row.id}",
                kind="reservation",
                severity="action",
                title=f"Reservation awaiting confirmation — {row.name}",
                detail=f"Party of {row.party_size} · {row.date:%a %d %b} at {row.time}",
                at=row.created_at,
                href="/staff-dashboard/reservations",
            )
        )

    for row in db.exec(
        select(RoomBooking)
        .where(RoomBooking.status == "pending_payment")
        .order_by(RoomBooking.created_at.desc())
        .limit(limit)
    ).all():
        expired = row.expires_at is not None and row.expires_at < now
        out.append(
            AdminNotification(
                id=f"booking:{row.id}",
                kind="venue-hire",
                severity="warning" if expired else "action",
                title=f"Hire deposit unpaid — {row.name} ({row.reference})",
                detail=(
                    "Hold has expired — the slot is back on sale"
                    if expired
                    else f"{row.date:%a %d %b} {row.start_time} · deposit {row.deposit_pence / 100:.2f}"
                ),
                at=row.created_at,
                href="/staff-dashboard/venue-hire",
            )
        )

    for row in db.exec(
        select(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(limit)
    ).all():
        out.append(
            AdminNotification(
                id=f"contact:{row.id}",
                kind="enquiry",
                severity="info",
                title=f"New message — {row.subject}",
                detail=f"{row.name} · {row.email}",
                at=row.created_at,
                href="/staff-dashboard/enquiries",
            )
        )

    for row in db.exec(
        select(VenueEnquiry).order_by(VenueEnquiry.created_at.desc()).limit(limit)
    ).all():
        out.append(
            AdminNotification(
                id=f"venue-enquiry:{row.id}",
                kind="enquiry",
                severity="info",
                title=f"Hire enquiry — {row.name}",
                detail=f"{row.event_type.replace('-', ' ')} · {row.guests} guests · {row.date:%a %d %b}",
                at=row.created_at,
                href="/staff-dashboard/enquiries",
            )
        )

    rooms = {room.id: room for room in db.exec(select(Room)).all()}
    for event in db.exec(
        select(Event).where(Event.starts_at >= now, Event.status == "published")
    ).all():
        types = db.exec(select(TicketType).where(TicketType.event_id == event.id)).all()
        if not types:
            continue
        available = sum(t.quantity_available for t in types)
        capacity = sum(t.quantity_total for t in types)
        room = rooms.get(event.room_id)
        if available == 0:
            out.append(
                AdminNotification(
                    id=f"event-soldout:{event.id}",
                    kind="event",
                    severity="success",
                    title=f"Sold out — {event.title}",
                    detail=f"{room.name if room else ''} · {event.starts_at:%a %d %b %H:%M}",
                    at=event.starts_at,
                    href="/staff-dashboard/events",
                )
            )
        elif capacity and available <= max(1, capacity // 10):
            out.append(
                AdminNotification(
                    id=f"event-low:{event.id}",
                    kind="event",
                    severity="warning",
                    title=f"Final tickets — {event.title}",
                    detail=f"{available} of {capacity} left · {event.starts_at:%a %d %b %H:%M}",
                    at=event.starts_at,
                    href="/staff-dashboard/events",
                )
            )

    for row in db.exec(
        select(Order)
        .where(Order.status == "pending")
        .order_by(Order.created_at.desc())
        .limit(limit)
    ).all():
        if row.expires_at and row.expires_at < now:
            out.append(
                AdminNotification(
                    id=f"order-stale:{row.id}",
                    kind="order",
                    severity="warning",
                    title=f"Checkout never completed — {row.reference}",
                    detail=f"{row.customer_email} · held {row.subtotal_pence / 100:.2f} {row.currency.upper()}",
                    at=row.created_at,
                    href="/staff-dashboard/finance",
                )
            )

    out.sort(key=lambda item: item.at, reverse=True)
    return out[:limit]
