from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.auth import require_staff_access
from app.bot_protection import BotRejected, enforce_public_form_rate_limit, extract_bot_fields, verify_public_form_submission
from app.database import get_db
from app.models import ContactMessage, ContactMessageCreate, ContactMessagePublic
from app.public_validation import (
    validate_contact_message,
    validate_contact_subject,
    validate_public_email,
    validate_public_name,
)

router = APIRouter(prefix="/contact", tags=["contact"])


def _bot_success_placeholder() -> ContactMessagePublic:
    """Convincing 201 for honeypot hits — no DB write, no email."""
    return ContactMessagePublic(
        id="00000000000000000000000000000000",
        name="Guest",
        email="guest@example.com",
        subject="Received",
        message="Thank you.",
        created_at=datetime.utcnow(),
    )


def _validate_contact_payload(data: dict) -> ContactMessageCreate:
    try:
        return ContactMessageCreate(
            name=validate_public_name(str(data.get("name", ""))),
            email=validate_public_email(str(data.get("email", ""))),
            subject=validate_contact_subject(str(data.get("subject", ""))),
            message=validate_contact_message(str(data.get("message", ""))),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("", response_model=ContactMessagePublic, status_code=201)
async def create_contact_message(request: Request, db: Session = Depends(get_db)):
    enforce_public_form_rate_limit(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid payload.")
    hp, form_ts, turnstile = extract_bot_fields(body)
    try:
        verify_public_form_submission(request, hp=hp, form_ts=form_ts, turnstile_token=turnstile)
    except BotRejected:
        return _bot_success_placeholder()

    payload = _validate_contact_payload(body)
    message = ContactMessage.model_validate(payload)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("", response_model=list[ContactMessagePublic], dependencies=[Depends(require_staff_access)])
def list_contact_messages(db: Session = Depends(get_db)):
    statement = select(ContactMessage).order_by(ContactMessage.created_at.desc())
    return db.exec(statement).all()
