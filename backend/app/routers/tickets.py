"""Door operations: scan a ticket, see the guest list.

Gated on a shared staff key rather than guest JWTs — the door tablet is not a
guest account.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, SQLModel, select

from app.auth import require_staff
from app.database import get_db
from app.fulfilment import serialize_ticket
from app.models import Event, Ticket, TicketPublic

router = APIRouter(prefix="/tickets", tags=["tickets"])


class CheckInRequest(SQLModel):
    code: str


class CheckInResult(SQLModel):
    ok: bool
    message: str
    ticket: TicketPublic | None = None


class DoorSummary(SQLModel):
    event_slug: str
    event_title: str
    starts_at: datetime
    sold: int
    checked_in: int
    tickets: list[TicketPublic]


@router.post("/check-in", response_model=CheckInResult, dependencies=[Depends(require_staff)])
def check_in(payload: CheckInRequest, db: Session = Depends(get_db)):
    code = payload.code.strip().upper()
    ticket = db.exec(select(Ticket).where(Ticket.code == code)).first()

    if ticket is None:
        return CheckInResult(ok=False, message="Ticket not recognised.")

    public = serialize_ticket(db, ticket)

    if ticket.status == "void":
        return CheckInResult(ok=False, message="Ticket was refunded or cancelled.", ticket=public)

    if ticket.status == "checked_in":
        when = ticket.checked_in_at.strftime("%H:%M") if ticket.checked_in_at else "earlier"
        return CheckInResult(ok=False, message=f"Already checked in at {when}.", ticket=public)

    ticket.status = "checked_in"
    ticket.checked_in_at = datetime.utcnow()
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return CheckInResult(ok=True, message=f"Welcome, {ticket.holder_name}.", ticket=serialize_ticket(db, ticket))


@router.get("/door/{event_slug}", response_model=DoorSummary, dependencies=[Depends(require_staff)])
def door_list(event_slug: str, db: Session = Depends(get_db)):
    event = db.exec(select(Event).where(Event.slug == event_slug)).first()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    tickets = db.exec(
        select(Ticket).where(Ticket.event_id == event.id, Ticket.status != "void")
    ).all()

    return DoorSummary(
        event_slug=event.slug,
        event_title=event.title,
        starts_at=event.starts_at,
        sold=len(tickets),
        checked_in=sum(1 for t in tickets if t.status == "checked_in"),
        tickets=[serialize_ticket(db, t) for t in tickets],
    )


@router.get("/lookup/{code}", response_model=TicketPublic, dependencies=[Depends(require_staff)])
def lookup(code: str, db: Session = Depends(get_db)):
    ticket = db.exec(select(Ticket).where(Ticket.code == code.strip().upper())).first()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return serialize_ticket(db, ticket)
