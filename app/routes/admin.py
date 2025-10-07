# app/routes/admin.py

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload, contains_eager
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.setor import Setor
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.equipment_type import EquipmentType
from app.models.google_token import GoogleOAuthToken
from app.models.unit_history import UnitHistory # <<-- IMPORTAR
from app.schemas.reservation import ReservationOut
from app.schemas.admin import ReservationStatusUpdate, UserRoleUpdate, UserSectorUpdate
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

@router.get("/reservations", response_model=List[ReservationOut])
def list_all_reservations(
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """(Manager) Lista todas as reservas, com filtros avançados."""
    query = (
        db.query(Reservation)
        .join(Reservation.user)
        .join(Reservation.equipment_unit)
        .join(EquipmentUnit.equipment_type)
        .options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        )
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term),
                EquipmentType.name.ilike(search_term),
                EquipmentUnit.identifier_code.ilike(search_term)
            )
        )

    if status and status != "all":
        query = query.filter(Reservation.status == status)
    
    if start_date:
        query = query.filter(Reservation.end_time >= start_date)
    if end_date:
        query = query.filter(Reservation.start_time <= end_date)
    
    reservations = query.order_by(Reservation.start_time.desc()).all()
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
    db_reservation = db.query(Reservation).options(joinedload(Reservation.user), joinedload(Reservation.equipment_unit)).filter(Reservation.id == reservation_id).first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    unit = db_reservation.equipment_unit
    
    if update_data.status.value == 'approved':
        unit.status = 'reserved'
        background_tasks.add_task(approve_and_create_calendar_event, db, db_reservation)

    elif update_data.status.value == 'rejected':
        unit.status = 'available'
    
    # <<-- LÓGICA DE DEVOLUÇÃO MODIFICADA -->>
    elif update_data.status.value == 'returned':
        db_reservation.return_notes = update_data.return_notes
        if update_data.return_status == 'maintenance':
            unit.status = 'maintenance'
            history_event = UnitHistory(
                unit_id=unit.id,
                event_type='sent_to_maintenance',
                notes=f"Devolvido com defeito: {update_data.return_notes}",
                user_id=manager_user.id,
                reservation_id=db_reservation.id
            )
        else:
            unit.status = 'available'
            history_event = UnitHistory(
                unit_id=unit.id,
                event_type='returned_ok',
                notes=update_data.return_notes,
                user_id=manager_user.id,
                reservation_id=db_reservation.id
            )
        db.add(history_event)

    db_reservation.status = update_data.status.value
    db.commit()
    db.refresh(db_reservation)
    
    return db_reservation

@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db), 
    admin_user: User = Depends(get_current_admin_user),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    """(Admin) Lista todos os usuários cadastrados, com busca, filtro de permissão e paginação."""
    query = db.query(User).options(joinedload(User.setor))
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
    
    if role and role != "all":
        query = query.filter(User.role == role)

    users = query.order_by(User.username).offset(skip).limit(limit).all()
    return users


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
    """(Admin) Define a permissão (role) de um usuário."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
        
    if db_user.id == admin_user.id and role_update.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Um administrador não pode remover a própria permissão.")
    
    db_user.role = role_update.role.value
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.patch("/users/{user_id}/sector", response_model=UserOut)
def set_user_sector(
    user_id: int,
    sector_update: UserSectorUpdate,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user) # Manager ou Admin
):
    """(Manager) Define o setor de um usuário."""
    db_user = db.query(User).options(joinedload(User.setor)).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if sector_update.setor_id is not None:
        setor = db.query(Setor).filter(Setor.id == sector_update.setor_id).first()
        if not setor:
            raise HTTPException(status_code=404, detail="Setor não encontrado.")

    db_user.setor_id = sector_update.setor_id
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/logs", response_model=List[ActivityLogOut])
def get_activity_logs(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
    search: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    """(Admin) Lista os logs de atividade da aplicação, com filtros avançados e paginação."""
    query = db.query(ActivityLog)

    if search:
        query = query.filter(ActivityLog.message.ilike(f"%{search}%"))
    
    if level and level != "all":
        query = query.filter(ActivityLog.level == level.upper())

    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)

    if start_date:
        query = query.filter(ActivityLog.created_at >= start_date)

    if end_date:
        query = query.filter(ActivityLog.created_at <= end_date)

    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs