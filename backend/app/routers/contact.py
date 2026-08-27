from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_db
from app.models import ContactMessage, ContactMessageCreate, ContactMessagePublic

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactMessagePublic, status_code=201)
def create_contact_message(payload: ContactMessageCreate, db: Session = Depends(get_db)):
    message = ContactMessage.model_validate(payload)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("", response_model=list[ContactMessagePublic])
def list_contact_messages(db: Session = Depends(get_db)):
    statement = select(ContactMessage).order_by(ContactMessage.created_at.desc())
    return db.exec(statement).all()
