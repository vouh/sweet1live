from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.auth import require_staff_access
from app.bot_protection import BotRejected, enforce_public_form_rate_limit, extract_bot_fields, verify_public_form_submission
from app.database import get_db
from app.models import VenueEnquiry, VenueEnquiryCreate, VenueEnquiryPublic
from app.public_validation import (
    validate_guest_count,
    validate_public_email,
    validate_public_name,
    validate_reservation_date,
    validate_venue_details,
    validate_venue_event_type,
)

router = APIRouter(prefix="/venue-enquiries", tags=["venue-enquiries"])


def _bot_success_placeholder() -> VenueEnquiryPublic:
    return VenueEnquiryPublic(
        id="00000000000000000000000000000000",
        name="Guest",
        email="guest@example.com",
        event_type="other",
        guests=10,
        date=date.today(),
        details=None,
        created_at=datetime.utcnow(),
    )


def _validate_enquiry_payload(data: dict) -> VenueEnquiryCreate:
    try:
        raw_date = data.get("date")
        if isinstance(raw_date, str):
            parsed_date = date.fromisoformat(raw_date)
        elif isinstance(raw_date, date):
            parsed_date = raw_date
        else:
            raise ValueError("Date is required.")

        return VenueEnquiryCreate(
            name=validate_public_name(str(data.get("name", ""))),
            email=validate_public_email(str(data.get("email", ""))),
            event_type=validate_venue_event_type(str(data.get("event_type", ""))),
            guests=validate_guest_count(int(data.get("guests", 0))),
            date=validate_reservation_date(parsed_date),
            details=validate_venue_details(data.get("details")),
        )
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("", response_model=VenueEnquiryPublic, status_code=201)
async def create_venue_enquiry(request: Request, db: Session = Depends(get_db)):
    enforce_public_form_rate_limit(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid payload.")
    hp, form_ts, turnstile = extract_bot_fields(body)
    try:
        verify_public_form_submission(request, hp=hp, form_ts=form_ts, turnstile_token=turnstile)
    except BotRejected:
        return _bot_success_placeholder()

    payload = _validate_enquiry_payload(body)
    enquiry = VenueEnquiry.model_validate(payload)
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.get("", response_model=list[VenueEnquiryPublic], dependencies=[Depends(require_staff_access)])
def list_venue_enquiries(db: Session = Depends(get_db)):
    statement = select(VenueEnquiry).order_by(VenueEnquiry.created_at.desc())
    return db.exec(statement).all()
