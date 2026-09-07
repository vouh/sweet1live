from datetime import datetime
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.config import settings
from app.database import get_db
from app.inventory import on_sale
from app.models import Event, EventPublic, Room, TicketType, TicketTypePublic

router = APIRouter(prefix="/events", tags=["events"])
EVENT_TYPES = ("in_house", "external")
SWEET1NE_VENUE = "Sweet1ne Live"
SWEET1NE_ADDRESS = "218 High Road, Chadwell Heath, RM6 6LS"


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


def serialize_event(db: Session, event: Event) -> EventPublic:
    room = db.get(Room, event.room_id)
    ticket_types = db.exec(
        select(TicketType)
        .where(TicketType.event_id == event.id, TicketType.is_active == True)  # noqa: E712
        .order_by(TicketType.sort_order, TicketType.price_pence)  # type: ignore[arg-type]
    ).all()

    public_types = [
        TicketTypePublic(
            id=ticket_type.id,
            name=ticket_type.name,
            description=ticket_type.description,
            price_pence=ticket_type.price_pence,
            max_per_order=ticket_type.max_per_order,
            quantity_available=ticket_type.quantity_available,
            on_sale=on_sale(ticket_type),
        )
        for ticket_type in ticket_types
    ]

    buyable = [t for t in public_types if t.on_sale and t.quantity_available > 0]

    return EventPublic(
        id=event.id,
        slug=event.slug,
        title=event.title,
        subtitle=event.subtitle,
        description=event.description,
        event_type=event.event_type,
        venue_name=event.venue_name or (room.name if room else SWEET1NE_VENUE),
        venue_address=event.venue_address or SWEET1NE_ADDRESS,
        image_url=_event_images(event)[0] if _event_images(event) else "",
        images=_event_images(event),
        room_name=room.name if room else "",
        room_slug=room.slug if room else "",
        doors_at=event.doors_at,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        status=event.status,
        is_top_event=event.is_top_event,
        currency=settings.currency,
        from_price_pence=min((t.price_pence for t in buyable), default=None),
        sold_out=bool(public_types) and not buyable,
        ticket_types=public_types,
    )


@router.get("", response_model=list[EventPublic])
def list_events(
    db: Session = Depends(get_db),
    room: str | None = Query(default=None, description="Filter by room slug"),
    event_type: str | None = Query(default=None, pattern="^(in_house|external)$"),
    include_past: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
):
    statement = select(Event).where(Event.status == "published")

    if event_type:
        statement = statement.where(Event.event_type == event_type)

    if not include_past:
        statement = statement.where(Event.starts_at >= datetime.utcnow())

    if room:
        room_row = db.exec(select(Room).where(Room.slug == room)).first()
        if room_row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown room")
        statement = statement.where(Event.room_id == room_row.id)

    events = db.exec(statement.order_by(Event.starts_at).limit(limit)).all()  # type: ignore[arg-type]
    return [serialize_event(db, event) for event in events]


@router.get("/{slug}", response_model=EventPublic)
def get_event(slug: str, db: Session = Depends(get_db)):
    event = db.exec(select(Event).where(Event.slug == slug)).first()
    if event is None or event.status == "draft":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return serialize_event(db, event)
