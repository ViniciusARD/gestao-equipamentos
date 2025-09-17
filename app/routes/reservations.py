# app/routes/reservations.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone

from app.database import get_db
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.user import User
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.security import get_current_user, get_current_requester_user

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"]
)

@router.post("/", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_requester_user)
):
    """Cria uma nova solicitação de reserva para uma unidade de equipamento."""
    unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == reservation.unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidade de equipamento não encontrada.")

    if unit.status != 'available':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta unidade não está disponível para reserva.")

    existing_reservation = db.query(Reservation).filter(
        Reservation.unit_id == reservation.unit_id,
        Reservation.end_time > reservation.start_time,
        Reservation.start_time < reservation.end_time,
        Reservation.status.in_(['pending', 'approved'])
    ).first()

    if existing_reservation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma reserva para esta unidade no período solicitado."
        )
    
    new_reservation = Reservation(
        **reservation.dict(),
        user_id=current_user.id,
        status='pending'
    )
    
    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)
    return new_reservation

@router.get("/my-reservations", response_model=List[ReservationOut])
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_requester_user)
):
    """Retorna uma lista de todas as reservas feitas pelo usuário autenticado."""
    reservations = (
        db.query(Reservation)
        .filter(Reservation.user_id == current_user.id)
        .options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        )
        .order_by(Reservation.created_at.desc())
        .all()
    )
    return reservations

@router.get("/upcoming", response_model=List[ReservationOut])
def get_my_upcoming_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_requester_user)
):
    """Retorna as próximas 3 reservas aprovadas e futuras do usuário."""
    now = datetime.now(timezone.utc)
    reservations = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == current_user.id,
            Reservation.status == 'approved',
            Reservation.start_time > now
        )
        .options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        )
        .order_by(Reservation.start_time.asc())
        .limit(3)
        .all()
    )
    return reservations