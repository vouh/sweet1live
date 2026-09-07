"""Back-office API behind the staff dashboard.

Every endpoint here reads (and sometimes writes) the same tables the public
site uses — there is no separate admin store. Gated on the shared staff key
rather than a guest JWT: the back office is not a guest account.

Money is integer pence throughout, matching the rest of the codebase.
"""

from collections import defaultdict
from datetime import date as date_type, datetime, timedelta
import json
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import Field
from sqlmodel import Session, SQLModel, func, select

from app.admin_permissions import require_permission
from app.auth import require_staff_access
from app.config import settings
from app.database import get_db
from app.fulfilment import mark_order_cancelled, serialize_booking
from app.rbac import staff_has_permission
from app.storage import upload_menu_image
from app.models import (
    ContactMessage,
    Event,
    MailingListSubscriber,
    MailingListSubscriberPublic,
    MenuCategory,
    MenuCategoryCreate,
    MenuCategoryPublic,
    MenuCategoryUpdate,
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
    StaffMember,
    Ticket,
    TicketType,
    User,
    VenueEnquiry,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_staff_access)])

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
    collection_pending: int
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
                href="/staff-dashboard/enquiries?kind=venue",
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
        label = {
            "tickets": "Ticket order",
            "room_deposit": "Room deposit",
            "food_collection": "Collection order",
        }.get(row.kind, "Order")
        href = (
            "/staff-dashboard/collection"
            if row.kind == "food_collection"
            else "/staff-dashboard/finance"
        )
        items.append(
            ActivityItem(
                id=f"order:{row.id}",
                kind="order" if row.kind != "food_collection" else "collection",
                title=f"{label} {row.reference} — {row.customer_name}",
                detail=f"{row.subtotal_pence / 100:.2f} {row.currency.upper()} · {row.status}",
                at=row.created_at,
                href=href,
            )
        )

    items.sort(key=lambda item: item.at, reverse=True)
    return items[:limit]


@router.get("/overview", response_model=AdminOverview, dependencies=[require_permission("dashboard.view")])
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
        collection_pending=_count(db, Order, Order.kind == "food_collection", Order.status == "pending"),
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


class BulkDeleteRequest(SQLModel):
    ids: list[str] = Field(min_length=1, max_length=200)


class BulkDeleteResult(SQLModel):
    deleted: int


class EnquiryRef(SQLModel):
    kind: Literal["contact", "venue"]
    id: str


class BulkDeleteEnquiriesRequest(SQLModel):
    items: list[EnquiryRef] = Field(min_length=1, max_length=200)


def _delete_order(db: Session, order: Order) -> None:
    """Remove an order and its line items. Pending ticket holds are released first."""
    if order.status == "pending" and order.kind == "tickets":
        mark_order_cancelled(db, order)
    elif order.status == "paid" and order.kind == "tickets":
        for item in db.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all():
            if not item.ticket_type_id:
                continue
            ticket_type = db.get(TicketType, item.ticket_type_id)
            if ticket_type:
                ticket_type.quantity_sold = max(0, ticket_type.quantity_sold - item.quantity)
                db.add(ticket_type)

    for ticket in db.exec(select(Ticket).where(Ticket.order_id == order.id)).all():
        db.delete(ticket)
    for item in db.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all():
        db.delete(item)
    db.delete(order)


@router.get("/reservations", response_model=list[ReservationPublic], dependencies=[require_permission("reservations.view")])
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


@router.patch("/reservations/{reservation_id}", response_model=ReservationPublic, dependencies=[require_permission("reservations.edit")])
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


@router.delete("/reservations/{reservation_id}", status_code=204, dependencies=[require_permission("reservations.delete")])
def delete_reservation(reservation_id: str, db: Session = Depends(get_db)):
    reservation = db.get(Reservation, reservation_id)
    if reservation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    db.delete(reservation)
    db.commit()


@router.post("/reservations/bulk-delete", response_model=BulkDeleteResult, dependencies=[require_permission("reservations.delete")])
def bulk_delete_reservations(payload: BulkDeleteRequest, db: Session = Depends(get_db)):
    deleted = 0
    for reservation_id in payload.ids:
        reservation = db.get(Reservation, reservation_id)
        if reservation is None:
            continue
        db.delete(reservation)
        deleted += 1
    db.commit()
    return BulkDeleteResult(deleted=deleted)


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
    description: str
    status: str
    is_top_event: bool
    room_name: str
    room_slug: str
    image_url: str
    images: list[str]
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


def _event_images(event: Event) -> list[str]:
    if not event.image_url:
        return []
    if event.image_url.startswith("["):
        try:
            values = json.loads(event.image_url)
            if isinstance(values, list):
                return [str(value) for value in values if value][:4]
        except (TypeError, ValueError):
            pass
    return [event.image_url]


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
        description=event.description,
        status=event.status,
        is_top_event=event.is_top_event,
        room_name=room.name if room else "",
        room_slug=room.slug if room else "",
        image_url=_event_images(event)[0] if _event_images(event) else "",
        images=_event_images(event),
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


@router.get("/events", response_model=list[AdminEvent], dependencies=[require_permission("events.view")])
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


class EventAdminUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    subtitle: str | None = Field(default=None, max_length=240)
    description: str | None = Field(default=None, max_length=3000)
    images: list[str] | None = None
    status: str | None = None
    is_top_event: bool | None = None


class EventImageUploadResult(SQLModel):
    url: str


@router.patch("/events/{event_id}", response_model=AdminEvent, dependencies=[require_permission("events.edit")])
def update_event(event_id: str, payload: EventAdminUpdate, db: Session = Depends(get_db)):
    if payload.status is not None and payload.status not in EVENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status must be one of {', '.join(EVENT_STATUSES)}",
        )
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    changes = payload.model_dump(exclude_unset=True)
    if "images" in changes and len(changes["images"]) > 4:
        raise HTTPException(status_code=422, detail="An event can have up to 4 images.")
    images = changes.pop("images", None)
    if changes.get("is_top_event") is True:
        for other in db.exec(select(Event).where(Event.id != event_id, Event.is_top_event == True)).all():  # noqa: E712
            other.is_top_event = False
            db.add(other)
    for key, value in changes.items():
        setattr(event, key, value.strip() if isinstance(value, str) else value)
    if images is not None:
        event.image_url = json.dumps(images, separators=(",", ":")) if len(images) > 1 else (images[0] if images else "")
    db.add(event)
    db.commit()
    db.refresh(event)
    rooms = {room.id: room for room in db.exec(select(Room)).all()}
    return _admin_event(db, event, rooms)


@router.post("/events/upload", response_model=EventImageUploadResult, status_code=201, dependencies=[require_permission("events.edit")])
async def upload_event_photo(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPEG, PNG, or WebP image.")
    content = await file.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Images must be under 8MB.")
    return EventImageUploadResult(url=upload_menu_image(file.filename or "event.webp", content, file.content_type))


# =====================================================================
# Menus
# =====================================================================


def _menu_public(item: MenuItem) -> MenuItemPublic:
    return MenuItemPublic(**item.model_dump(), currency=settings.currency)


@router.get("/menus", response_model=list[MenuItemPublic], dependencies=[require_permission("menus.view")])
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


@router.post("/menus", response_model=MenuItemPublic, status_code=201, dependencies=[require_permission("menus.edit")])
def create_menu_item(payload: MenuItemCreate, db: Session = Depends(get_db)):
    item = MenuItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _menu_public(item)


@router.patch("/menus/{item_id}", response_model=MenuItemPublic, dependencies=[require_permission("menus.edit")])
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


@router.delete("/menus/{item_id}", status_code=204, dependencies=[require_permission("menus.delete")])
def delete_menu_item(item_id: str, db: Session = Depends(get_db)):
    item = db.get(MenuItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    db.delete(item)
    db.commit()


class MenuImageUploadResult(SQLModel):
    url: str


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024


@router.post("/menus/upload", response_model=MenuImageUploadResult, status_code=201, dependencies=[require_permission("menus.edit")])
async def upload_menu_photo(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a JPEG, PNG, WebP, or GIF image.",
        )
    content = await file.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Images must be under 8MB."
        )
    url = upload_menu_image(file.filename or "photo.jpg", content, file.content_type)
    return MenuImageUploadResult(url=url)


# ---------- Menu categories ----------
# A managed list, separate from the free-text `course` column on dishes, so
# the admin settings modal can rename/reorder/add without a schema change —
# and the public menu keeps a consistent, typo-free set of category names.


class AdminMenuCategoryView(MenuCategoryPublic):
    dish_count: int


def _category_dish_count(db: Session, name: str) -> int:
    return db.exec(
        select(func.count()).select_from(MenuItem).where(MenuItem.course == name)
    ).one()


def _category_name_taken(db: Session, name: str, exclude_id: str | None = None) -> bool:
    row = db.exec(
        select(MenuCategory).where(func.lower(MenuCategory.name) == name.lower())
    ).first()
    if row is None:
        return False
    return exclude_id is None or row.id != exclude_id


@router.get("/menu-categories", response_model=list[AdminMenuCategoryView], dependencies=[require_permission("menus.view")])
def list_menu_categories(db: Session = Depends(get_db)):
    categories = db.exec(
        select(MenuCategory).order_by(MenuCategory.sort_order, MenuCategory.name)
    ).all()
    return [
        AdminMenuCategoryView(
            id=category.id,
            name=category.name,
            sort_order=category.sort_order,
            created_at=category.created_at,
            dish_count=_category_dish_count(db, category.name),
        )
        for category in categories
    ]


@router.post("/menu-categories", response_model=MenuCategoryPublic, status_code=201, dependencies=[require_permission("menus.edit")])
def create_menu_category(payload: MenuCategoryCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Category name is required"
        )
    if _category_name_taken(db, name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f'A category named "{name}" already exists.',
        )
    top = db.exec(select(func.max(MenuCategory.sort_order))).first()
    category = MenuCategory(name=name, sort_order=(top + 1) if top is not None else 0)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/menu-categories/{category_id}", response_model=MenuCategoryPublic, dependencies=[require_permission("menus.edit")])
def update_menu_category(
    category_id: str, payload: MenuCategoryUpdate, db: Session = Depends(get_db)
):
    category = db.get(MenuCategory, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates:
        new_name = (updates["name"] or "").strip()
        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Category name is required"
            )
        if _category_name_taken(db, new_name, exclude_id=category.id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f'A category named "{new_name}" already exists.',
            )
        # `course` is a plain string, not a foreign key — renaming here has to
        # walk every dish that used the old name to keep them in sync.
        if new_name != category.name:
            for dish in db.exec(select(MenuItem).where(MenuItem.course == category.name)).all():
                dish.course = new_name
                db.add(dish)
        updates["name"] = new_name

    for key, value in updates.items():
        setattr(category, key, value)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/menu-categories/{category_id}", status_code=204, dependencies=[require_permission("menus.delete")])
def delete_menu_category(category_id: str, db: Session = Depends(get_db)):
    category = db.get(MenuCategory, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    dish_count = _category_dish_count(db, category.name)
    if dish_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"{dish_count} dish{'es' if dish_count != 1 else ''} still use "
                f'"{category.name}". Delete or move those dishes first.'
            ),
        )
    db.delete(category)
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


@router.get("/venue-hire", response_model=AdminVenueHire, dependencies=[require_permission("venue_hire.view")])
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


@router.patch("/venue-hire/{booking_id}", response_model=RoomBookingPublic, dependencies=[require_permission("venue_hire.edit")])
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


@router.delete("/venue-hire/{booking_id}", status_code=204, dependencies=[require_permission("venue_hire.delete")])
def delete_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = db.get(RoomBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    db.delete(booking)
    db.commit()


@router.post("/venue-hire/bulk-delete", response_model=BulkDeleteResult, dependencies=[require_permission("venue_hire.delete")])
def bulk_delete_bookings(payload: BulkDeleteRequest, db: Session = Depends(get_db)):
    deleted = 0
    for booking_id in payload.ids:
        booking = db.get(RoomBooking, booking_id)
        if booking is None:
            continue
        db.delete(booking)
        deleted += 1
    db.commit()
    return BulkDeleteResult(deleted=deleted)


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


@router.get("/enquiries", response_model=list[AdminEnquiry], dependencies=[require_permission("enquiries.view")])
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


@router.delete("/enquiries/{kind}/{enquiry_id}", status_code=204, dependencies=[require_permission("enquiries.delete")])
def delete_enquiry(kind: Literal["contact", "venue"], enquiry_id: str, db: Session = Depends(get_db)):
    if kind == "contact":
        row = db.get(ContactMessage, enquiry_id)
    else:
        row = db.get(VenueEnquiry, enquiry_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found")
    db.delete(row)
    db.commit()


@router.post("/enquiries/bulk-delete", response_model=BulkDeleteResult, dependencies=[require_permission("enquiries.delete")])
def bulk_delete_enquiries(payload: BulkDeleteEnquiriesRequest, db: Session = Depends(get_db)):
    deleted = 0
    for item in payload.items:
        if item.kind == "contact":
            row = db.get(ContactMessage, item.id)
        else:
            row = db.get(VenueEnquiry, item.id)
        if row is None:
            continue
        db.delete(row)
        deleted += 1
    db.commit()
    return BulkDeleteResult(deleted=deleted)


# =====================================================================
# Guests
# =====================================================================


class AdminGuest(SQLModel):
    id: str
    name: str
    email: str
    has_account: bool
    mailing_list: bool
    created_at: datetime | None
    orders_count: int
    tickets_count: int
    reservations_count: int
    bookings_count: int
    spend_pence: int
    currency: str
    last_seen_at: datetime | None


@router.get("/guests", response_model=list[AdminGuest], dependencies=[require_permission("guests.view")])
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
                mailing_list=False,
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

    for subscriber in db.exec(select(MailingListSubscriber)).all():
        person = touch(subscriber.email, subscriber.name, at=subscriber.created_at)
        if person:
            person.mailing_list = True
            if person.created_at is None or (
                subscriber.created_at and subscriber.created_at < person.created_at
            ):
                person.created_at = subscriber.created_at

    rows = [
        person
        for person in people.values()
        if (person.has_account or not accounts_only) and _matches(q, person.name, person.email)
    ]
    rows.sort(key=lambda person: (person.last_seen_at or datetime.min), reverse=True)
    return rows


@router.get(
    "/mailing-list",
    response_model=list[MailingListSubscriberPublic],
    dependencies=[require_permission("guests.view")],
)
def list_mailing_list(db: Session = Depends(get_db), q: str | None = None):
    """Raw footer newsletter signups — the same rows feed the `mailing_list`
    flag on /guests, but this returns just the subscriber list for export."""
    rows = db.exec(
        select(MailingListSubscriber).order_by(MailingListSubscriber.created_at.desc())
    ).all()
    if q:
        needle = q.strip().lower()
        rows = [row for row in rows if needle in row.email.lower() or needle in row.name.lower()]
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
    charged_currency: str | None = None
    charged_amount_pence: int | None = None
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
    collection_pence: int
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
    staff: StaffMember | None = Depends(require_staff_access),
    days: int = Query(default=90, ge=1, le=730),
    status_filter: str | None = Query(default=None, alias="status"),
    kind: str | None = None,
    q: str | None = None,
):
    required_permission = "collection.view" if kind == "food_collection" else "finance.view"
    if staff is not None and not staff_has_permission(db, staff, required_permission):
        raise HTTPException(status_code=403, detail=f"Permission denied: {required_permission}")
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
            if order.kind == "room_deposit":
                return "Room deposit"
            if order.kind == "food_collection":
                return "Collection order"
            return "—"
        return ", ".join(f"{item.quantity} × {item.description}" for item in items)

    return AdminFinance(
        currency=settings.currency,
        stripe_enabled=settings.stripe_enabled,
        window_days=days,
        gross_paid_pence=gross,
        tickets_pence=sum(o.subtotal_pence for o in paid if o.kind == "tickets"),
        deposits_pence=sum(o.subtotal_pence for o in paid if o.kind == "room_deposit"),
        collection_pence=sum(o.subtotal_pence for o in paid if o.kind == "food_collection"),
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
                charged_currency=order.charged_currency,
                charged_amount_pence=order.charged_amount_pence,
                created_at=order.created_at,
                paid_at=order.paid_at,
                summary=summarise(order),
                stripe_payment_intent_id=order.stripe_payment_intent_id,
            )
            for order in shown
        ],
    )


@router.get("/collection-orders", response_model=AdminFinance, dependencies=[require_permission("collection.view")])
def collection_orders(
    db: Session = Depends(get_db),
    days: int = Query(default=30, ge=1, le=730),
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = None,
):
    """Collection-only reporting for roles that must not see all finance data."""
    return finance(db=db, staff=None, days=days, status_filter=status_filter, kind="food_collection", q=q)


class AdminOrderLine(SQLModel):
    description: str
    quantity: int
    unit_price_pence: int


class AdminOrderDetail(AdminOrderRow):
    items: list[AdminOrderLine]
    ticket_codes: list[str]


@router.get("/orders/{order_id}", response_model=AdminOrderDetail)
def get_order_detail(
    order_id: str,
    db: Session = Depends(get_db),
    staff: StaffMember | None = Depends(require_staff_access),
):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    required_permission = "collection.view" if order.kind == "food_collection" else "finance.view"
    if staff is not None and not staff_has_permission(db, staff, required_permission):
        raise HTTPException(status_code=403, detail=f"Permission denied: {required_permission}")

    items = db.exec(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    tickets = db.exec(select(Ticket).where(Ticket.order_id == order.id)).all()
    summary = ", ".join(f"{item.quantity} × {item.description}" for item in items) or "—"

    return AdminOrderDetail(
        id=order.id,
        reference=order.reference,
        status=order.status,
        kind=order.kind,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        subtotal_pence=order.subtotal_pence,
        currency=order.currency,
        charged_currency=order.charged_currency,
        charged_amount_pence=order.charged_amount_pence,
        created_at=order.created_at,
        paid_at=order.paid_at,
        summary=summary,
        stripe_payment_intent_id=order.stripe_payment_intent_id,
        items=[
            AdminOrderLine(
                description=item.description,
                quantity=item.quantity,
                unit_price_pence=item.unit_price_pence,
            )
            for item in items
        ],
        ticket_codes=[ticket.code for ticket in tickets],
    )


@router.get("/collection-orders/{order_id}", response_model=AdminOrderDetail, dependencies=[require_permission("collection.view")])
def get_collection_order_detail(order_id: str, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if order is None or order.kind != "food_collection":
        raise HTTPException(status_code=404, detail="Collection order not found")
    return get_order_detail(order_id, db, None)


@router.delete("/collection-orders/{order_id}", status_code=204, dependencies=[require_permission("collection.delete")])
def delete_collection_order(order_id: str, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if order is None or order.kind != "food_collection":
        raise HTTPException(status_code=404, detail="Collection order not found")
    _delete_order(db, order)
    db.commit()


@router.post("/collection-orders/bulk-delete", response_model=BulkDeleteResult, dependencies=[require_permission("collection.delete")])
def bulk_delete_collection_orders(payload: BulkDeleteRequest, db: Session = Depends(get_db)):
    deleted = 0
    for order_id in payload.ids:
        order = db.get(Order, order_id)
        if order is None or order.kind != "food_collection":
            continue
        _delete_order(db, order)
        deleted += 1
    db.commit()
    return BulkDeleteResult(deleted=deleted)


@router.delete("/orders/{order_id}", status_code=204)
def delete_order(
    order_id: str,
    db: Session = Depends(get_db),
    staff: StaffMember | None = Depends(require_staff_access),
):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    required_permission = "collection.delete" if order.kind == "food_collection" else "finance.delete"
    if staff is not None and not staff_has_permission(db, staff, required_permission):
        raise HTTPException(status_code=403, detail=f"Permission denied: {required_permission}")
    _delete_order(db, order)
    db.commit()


@router.post("/orders/bulk-delete", response_model=BulkDeleteResult)
def bulk_delete_orders(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    staff: StaffMember | None = Depends(require_staff_access),
):
    existing = [order for order_id in payload.ids if (order := db.get(Order, order_id)) is not None]
    collection_only = bool(existing) and all(order.kind == "food_collection" for order in existing)
    required_permission = "collection.delete" if collection_only else "finance.delete"
    if staff is not None and not staff_has_permission(db, staff, required_permission):
        raise HTTPException(status_code=403, detail=f"Permission denied: {required_permission}")
    deleted = 0
    for order in existing:
        _delete_order(db, order)
        deleted += 1
    db.commit()
    return BulkDeleteResult(deleted=deleted)


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


@router.get("/settings", response_model=AdminSettingsView, dependencies=[require_permission("settings.manage")])
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
        email_configured=bool(settings.resend_api_key),
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
            TableCount(table="mailing_list_subscribers", label="Mailing list", rows=_count(db, MailingListSubscriber)),
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


@router.get("/notifications", response_model=list[AdminNotification], dependencies=[require_permission("notifications.view")])
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
                href="/staff-dashboard/enquiries?kind=venue",
            )
        )

    for row in db.exec(
        select(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(limit)
    ).all():
        out.append(
            AdminNotification(
                id=f"contact:{row.id}",
                kind="enquiry",
                severity="action",
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
                severity="action",
                title=f"Hire enquiry — {row.name}",
                detail=f"{row.event_type.replace('-', ' ')} · {row.guests} guests · {row.date:%a %d %b}",
                at=row.created_at,
                href="/staff-dashboard/enquiries",
            )
        )

    for row in db.exec(
        select(MailingListSubscriber).order_by(MailingListSubscriber.created_at.desc()).limit(limit)
    ).all():
        out.append(
            AdminNotification(
                id=f"mailing-list:{row.id}",
                kind="guest",
                severity="info",
                title=f"Mailing list signup — {row.email}",
                detail="Footer newsletter",
                at=row.created_at,
                href="/staff-dashboard/guests",
            )
        )

    rooms = {room.id: room for room in db.exec(select(Room)).all()}
    upcoming_events = db.exec(
        select(Event).where(Event.starts_at >= now, Event.status == "published")
    ).all()
    # One query for every event's ticket types instead of one query per event —
    # this loop used to be the single biggest cost on this endpoint, and this
    # endpoint gets polled every 30s from every admin page, not just this one.
    types_by_event: dict[str, list[TicketType]] = defaultdict(list)
    if upcoming_events:
        event_ids = [event.id for event in upcoming_events]
        for ticket_type in db.exec(
            select(TicketType).where(TicketType.event_id.in_(event_ids))
        ).all():
            types_by_event[ticket_type.event_id].append(ticket_type)

    for event in upcoming_events:
        types = types_by_event.get(event.id, [])
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

    for row in db.exec(
        select(Order)
        .where(Order.status == "paid")
        .order_by(Order.paid_at.desc(), Order.created_at.desc())
        .limit(limit)
    ).all():
        paid_at = row.paid_at or row.created_at
        out.append(
            AdminNotification(
                id=f"order-paid:{row.id}",
                kind="order",
                severity="success",
                title=f"Payment received — {row.reference}",
                detail=f"{row.customer_name} · {row.subtotal_pence / 100:.2f} {row.currency.upper()}",
                at=paid_at,
                href="/staff-dashboard/finance",
            )
        )

    out.sort(key=lambda item: item.at, reverse=True)
    return out[:limit]
