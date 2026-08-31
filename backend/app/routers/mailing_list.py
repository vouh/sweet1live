from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.bot_protection import BotRejected, enforce_public_form_rate_limit, extract_bot_fields, verify_public_form_submission
from app.database import get_db
from app.models import MailingListSubscriber, MailingListSubscriberPublic
from app.public_validation import validate_public_email

router = APIRouter(prefix="/mailing-list", tags=["mailing-list"])


def _bot_success_placeholder() -> MailingListSubscriberPublic:
    return MailingListSubscriberPublic(
        id="00000000000000000000000000000000",
        email="guest@example.com",
        name="Guest",
        created_at=datetime.utcnow(),
    )


@router.post("", response_model=MailingListSubscriberPublic, status_code=201)
async def subscribe_mailing_list(request: Request, db: Session = Depends(get_db)):
    enforce_public_form_rate_limit(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid payload.")
    hp, form_ts, turnstile = extract_bot_fields(body)
    try:
        verify_public_form_submission(request, hp=hp, form_ts=form_ts, turnstile_token=turnstile)
    except BotRejected:
        return _bot_success_placeholder()

    try:
        email = validate_public_email(str(body.get("email", "")))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    key = email.strip().lower()
    existing = db.exec(select(MailingListSubscriber).where(MailingListSubscriber.email == key)).first()
    if existing:
        return existing

    subscriber = MailingListSubscriber(email=key, name="Guest")
    db.add(subscriber)
    db.commit()
    db.refresh(subscriber)
    return subscriber
