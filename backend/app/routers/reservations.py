from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_db
from app.models import Reservation, ReservationCreate, ReservationPublic

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationPublic, status_code=201)
def create_reservation(payload: ReservationCreate, db: Session = Depends(get_db)):
    reservation = Reservation.model_validate(payload)
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


@router.get("", response_model=list[ReservationPublic])
def list_reservations(db: Session = Depends(get_db)):
    statement = select(Reservation).order_by(Reservation.created_at.desc())
    return db.exec(statement).all()
