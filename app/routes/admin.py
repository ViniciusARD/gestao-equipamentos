# app/routes/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.google_token import GoogleOAuthToken # <-- NOVO: Importar o modelo do token
from app.schemas.reservation import ReservationOut
from app.schemas.admin import ReservationStatusUpdate
from app.security import get_current_admin_user
# --- NOVO: Importar as nossas funções de utilidade do Google Calendar ---
from app.google_calendar_utils import get_calendar_service, create_calendar_event

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)

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
    Se o status for 'approved', tenta criar um evento no Google Calendar do usuário.
    """
    db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    unit = db_reservation.equipment_unit
    
    # --- LÓGICA DE INTEGRAÇÃO COM O GOOGLE CALENDAR ADICIONADA AQUI ---
    if update_data.status == 'approved':
        unit.status = 'reserved'
        
        # Tenta criar o evento no Google Calendar
        user_to_notify = db_reservation.user
        google_token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == user_to_notify.id).first()
        
        if google_token:
            print(f"Token do Google encontrado para o usuário {user_to_notify.email}. Tentando criar evento...")
            try:
                service = get_calendar_service(google_token.token_json)
                create_calendar_event(service, db_reservation)
            except Exception as e:
                # Não bloqueia a aprovação se a criação do evento falhar, apenas regista o erro
                print(f"ERRO ao criar evento no Google Calendar: {e}")
        else:
            print(f"AVISO: O usuário {user_to_notify.email} não conectou a sua conta Google. O evento não será criado.")

    elif update_data.status in ['rejected', 'returned']:
        unit.status = 'available'
    
    db_reservation.status = update_data.status
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation