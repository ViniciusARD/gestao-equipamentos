# app/routes/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.schemas.reservation import ReservationOut
from app.schemas.admin import ReservationStatusUpdate
from app.security import get_current_admin_user

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)

@router.get("/reservations", response_model=List[ReservationOut])
def list_all_reservations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user) # Protege a rota
):
    """
    (Admin) Lista todas as reservas de todos os usuários.
    """
    reservations = db.query(Reservation).order_by(Reservation.created_at.desc()).all()
    return reservations

@router.patch("/reservations/{reservation_id}", response_model=ReservationOut)
def update_reservation_status(
    reservation_id: int,
    update_data: ReservationStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user) # Protege a rota
):
    """
    (Admin) Atualiza o status de uma reserva (approve, reject, return).
    """
    db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    # Atualiza o status da unidade do equipamento com base na ação
    unit = db_reservation.equipment_unit
    if update_data.status == 'approved':
        unit.status = 'reserved'
    elif update_data.status in ['rejected', 'returned']:
        unit.status = 'available'
    
    db_reservation.status = update_data.status
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation