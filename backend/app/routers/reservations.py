from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.auth import require_staff_access
from app.bot_protection import BotRejected, enforce_public_form_rate_limit, extract_bot_fields, verify_public_form_submission
from app.database import get_db
from app.models import Reservation, ReservationCreate, ReservationPublic
from app.public_validation import (
    validate_party_size,
    validate_public_email,
    validate_public_name,
    validate_public_notes,
    validate_reservation_date,
    validate_reservation_time,
)

router = APIRouter(prefix="/reservations", tags=["reservations"])


def _bot_success_placeholder() -> ReservationPublic:
    return ReservationPublic(
        id="00000000000000000000000000000000",
        name="Guest",
        email="guest@example.com",
        party_size=2,
        date=date.today(),
        time="20:00",
        notes=None,
        status="pending",
        created_at=datetime.utcnow(),
    )


def _validate_reservation_payload(data: dict) -> ReservationCreate:
    try:
        raw_date = data.get("date")
        if isinstance(raw_date, str):
            parsed_date = date.fromisoformat(raw_date)
        elif isinstance(raw_date, date):
            parsed_date = raw_date
        else:
            raise ValueError("Date is required.")

        return ReservationCreate(
            name=validate_public_name(str(data.get("name", ""))),
            email=validate_public_email(str(data.get("email", ""))),
            party_size=validate_party_size(int(data.get("party_size", 0))),
            date=validate_reservation_date(parsed_date),
            time=validate_reservation_time(str(data.get("time", ""))),
            notes=validate_public_notes(data.get("notes")),
        )
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("", response_model=ReservationPublic, status_code=201)
async def create_reservation(request: Request, db: Session = Depends(get_db)):
    enforce_public_form_rate_limit(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid payload.")
    hp, form_ts, turnstile = extract_bot_fields(body)
    try:
        verify_public_form_submission(request, hp=hp, form_ts=form_ts, turnstile_token=turnstile)
    except BotRejected:
        return _bot_success_placeholder()

    payload = _validate_reservation_payload(body)
    reservation = Reservation.model_validate(payload)
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


@router.get("", response_model=list[ReservationPublic], dependencies=[Depends(require_staff_access)])
def list_reservations(db: Session = Depends(get_db)):
    statement = select(Reservation).order_by(Reservation.created_at.desc())
    return db.exec(statement).all()
