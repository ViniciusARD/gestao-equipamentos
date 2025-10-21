# app/routes/reservations.py

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timezone
import asyncio

from app.database import get_db, SessionLocal
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.equipment_type import EquipmentType
from app.models.user import User
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.security import get_current_user, get_current_requester_user
from app.email_utils import send_reservation_pending_email, send_new_reservation_to_managers_email
from app.logging_utils import create_log

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"]
)

# --- TAREFA EM SEGUNDO PLANO CORRIGIDA ---

async def task_send_creation_emails(reservation_id: int):
    """
    (ASYNC) Envia e-mail para o usuário e para os gerentes sobre uma nova reserva.
    Cria sua própria sessão de banco de dados.
    """
    db = SessionLocal()
    try:
        # Busca a reserva com os dados necessários
        reservation = db.query(Reservation).options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        ).filter(Reservation.id == reservation_id).first()

        if not reservation:
            return

        # Busca os gerentes
        managers_and_admins = db.query(User).filter(User.role.in_(['manager', 'admin'])).all()

        # Dispara as duas tarefas de e-mail em paralelo
        await asyncio.gather(
            send_reservation_pending_email(reservation),
            send_new_reservation_to_managers_email(managers_and_admins, reservation)
        )
    finally:
        db.close()


# --- ROTAS ---

@router.post("/", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation: ReservationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_requester_user)
):
    """Cria uma nova solicitação de reserva para uma unidade de equipamento."""
    unit = db.query(EquipmentUnit).options(joinedload(EquipmentUnit.equipment_type)).filter(EquipmentUnit.id == reservation.unit_id).first()
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
    
    unit.status = 'pending'
    
    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    create_log(db, current_user.id, "INFO", f"Usuário '{current_user.username}' solicitou a reserva da unidade '{unit.identifier_code}' (ID: {unit.id}).")

    # Adiciona a tarefa em segundo plano que irá cuidar de TODOS os e-mails
    background_tasks.add_task(task_send_creation_emails, new_reservation.id)

    return new_reservation

@router.get("/my-reservations", response_model=List[ReservationOut])
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_requester_user),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """Retorna uma lista de todas as reservas feitas pelo usuário autenticado."""
    query = (
        db.query(Reservation)
        .join(Reservation.equipment_unit)
        .join(EquipmentUnit.equipment_type)
        .filter(Reservation.user_id == current_user.id)
        .options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        )
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
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