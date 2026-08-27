from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_db
from app.models import VenueEnquiry, VenueEnquiryCreate, VenueEnquiryPublic

router = APIRouter(prefix="/venue-enquiries", tags=["venue-enquiries"])


@router.post("", response_model=VenueEnquiryPublic, status_code=201)
def create_venue_enquiry(payload: VenueEnquiryCreate, db: Session = Depends(get_db)):
    enquiry = VenueEnquiry.model_validate(payload)
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.get("", response_model=list[VenueEnquiryPublic])
def list_venue_enquiries(db: Session = Depends(get_db)):
    statement = select(VenueEnquiry).order_by(VenueEnquiry.created_at.desc())
    return db.exec(statement).all()
