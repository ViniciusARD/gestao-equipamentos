# app/routes/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.google_token import GoogleOAuthToken
from app.schemas.reservation import ReservationOut
# Importações atualizadas
from app.schemas.admin import ReservationStatusUpdate, UserRoleUpdate
from app.schemas.user import UserOut # Para o tipo de resposta
from app.security import get_current_admin_user
from app.google_calendar_utils import get_calendar_service, create_calendar_event

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)

# --- Rotas de Gerenciamento de Reservas ---

@router.get("/reservations", response_model=List[ReservationOut])
def list_all_reservations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
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
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Atualiza o status de uma reserva (approve, reject, return).
    """
    db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    unit = db_reservation.equipment_unit
    
    if update_data.status.value == 'approved':
        unit.status = 'reserved'
        
        user_to_notify = db_reservation.user
        google_token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == user_to_notify.id).first()
        
        if google_token:
            print(f"Token do Google encontrado para o usuário {user_to_notify.email}. Tentando criar evento...")
            try:
                service = get_calendar_service(google_token.token_json)
                create_calendar_event(service, db_reservation)
            except Exception as e:
                print(f"ERRO ao criar evento no Google Calendar: {e}")
        else:
            print(f"AVISO: O usuário {user_to_notify.email} não conectou a sua conta Google.")

    elif update_data.status.value in ['rejected', 'returned']:
        unit.status = 'available'
    
    db_reservation.status = update_data.status.value
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation

# --- NOVO: Rota para Gerenciamento de Usuários ---

@router.patch("/users/{user_id}/role", response_model=UserOut)
def set_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Define a permissão (role) de um usuário como 'user' ou 'admin'.
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
        
    # Impede que um admin remova a própria permissão acidentalmente
    if db_user.id == admin_user.id and role_update.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Um administrador não pode remover a própria permissão.")
    
    db_user.role = role_update.role.value
    db.commit()
    db.refresh(db_user)
    
    return db_user