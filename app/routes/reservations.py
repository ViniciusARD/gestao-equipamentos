# app/routes/reservations.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.user import User
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.security import get_current_user

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"]
)

@router.post("/", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria uma nova solicitação de reserva para uma unidade de equipamento.
    O usuário deve estar autenticado.
    """
    # 1. Verifica se a unidade de equipamento existe
    unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == reservation.unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidade de equipamento não encontrada.")

    # 2. Verifica se a unidade está disponível
    if unit.status != 'available':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta unidade não está disponível para reserva.")

    # 3. Lógica para evitar sobreposição de datas (IMPORTANTE)
    existing_reservation = db.query(Reservation).filter(
        Reservation.unit_id == reservation.unit_id,
        Reservation.end_time > reservation.start_time,
        Reservation.start_time < reservation.end_time,
        Reservation.status.in_(['pending', 'approved']) # Considera reservas pendentes ou já aprovadas
    ).first()

    if existing_reservation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma reserva para esta unidade no período solicitado."
        )
    
    # 4. Cria a nova reserva
    new_reservation = Reservation(
        **reservation.dict(),
        user_id=current_user.id,
        status='pending'  # Toda nova reserva começa como pendente
    )
    
    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)
    return new_reservation

@router.get("/my-reservations", response_model=List[ReservationOut])
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna uma lista de todas as reservas feitas pelo usuário autenticado.
    """
    reservations = db.query(Reservation).filter(Reservation.user_id == current_user.id).all()
    return reservations