# app/routes/admin.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload # 1. Importar joinedload
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.google_token import GoogleOAuthToken
from app.schemas.reservation import ReservationOut
from app.schemas.admin import ReservationStatusUpdate, UserRoleUpdate
from app.schemas.user import UserOut
from app.security import get_current_admin_user, get_current_manager_user
from app.google_calendar_utils import get_calendar_service, create_calendar_event
from app.models.activity_log import ActivityLog
from app.schemas.logs import ActivityLogOut

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)

def approve_and_create_calendar_event(db: Session, reservation: Reservation):
    user_to_notify = reservation.user
    google_token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == user_to_notify.id).first()
    
    if google_token:
        print(f"BACKGROUND TASK: Token do Google encontrado para {user_to_notify.email}. Criando evento...")
        try:
            service = get_calendar_service(google_token.token_json)
            create_calendar_event(service, reservation)
        except Exception as e:
            print(f"BACKGROUND TASK ERROR: Falha ao criar evento no Google Calendar: {e}")
    else:
        print(f"BACKGROUND TASK INFO: Usuário {user_to_notify.email} não conectou a conta Google.")

# --- ROTA DE LISTAGEM OTIMIZADA ---
@router.get("/reservations", response_model=List[ReservationOut])
def list_all_reservations(
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Manager) Lista todas as reservas de todos os usuários."""
    # 2. Aplicar Eager Loading para buscar todos os dados relacionados em uma única consulta
    reservations = (
        db.query(Reservation)
        .options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        )
        .order_by(Reservation.created_at.desc())
        .all()
    )
    return reservations

@router.patch("/reservations/{reservation_id}", response_model=ReservationOut)
def update_reservation_status(
    reservation_id: int,
    update_data: ReservationStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Manager) Atualiza o status de uma reserva (approve, reject, return)."""
    db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    unit = db_reservation.equipment_unit
    
    if update_data.status.value == 'approved':
        unit.status = 'reserved'
        background_tasks.add_task(approve_and_create_calendar_event, db, db_reservation)

    elif update_data.status.value in ['rejected', 'returned']:
        unit.status = 'available'
    
    db_reservation.status = update_data.status.value
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation

# --- Rotas de Gerenciamento de Usuários (sem alterações) ---

@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db), 
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Lista todos os usuários cadastrados no sistema."""
    return db.query(User).all()

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Deleta um usuário pelo seu ID."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    if db_user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Um administrador não pode deletar a própria conta por esta rota.")
        
    db.delete(db_user)
    db.commit()
    return

@router.patch("/users/{user_id}/role", response_model=UserOut)
def set_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Define a permissão (role) de um usuário como 'user' ou 'admin'."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
        
    if db_user.id == admin_user.id and role_update.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Um administrador não pode remover a própria permissão.")
    
    db_user.role = role_update.role.value
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.get("/logs", response_model=List[ActivityLogOut])
def get_activity_logs(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100
):
    """(Admin) Lista os logs de atividade da aplicação, dos mais recentes para os mais antigos."""
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs