# app/routes/reservations.py

"""
Módulo de Rotas para Gerenciamento de Reservas (visão do usuário).

Este arquivo define os endpoints que permitem a um usuário criar e visualizar
suas próprias reservas de equipamentos.

Dependências:
- FastAPI: Para a criação do roteador, dependências e tarefas em segundo plano.
- SQLAlchemy: Para a interação com o banco de dados.
- Módulos de modelos e schemas: Para a estrutura de dados e validação.
- Módulos de utilitários: security, email_utils, logging_utils.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, desc, asc, case
from typing import List, Optional
from datetime import datetime, timezone
import asyncio
import math

from app.database import get_db, SessionLocal
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.equipment_type import EquipmentType
from app.models.user import User
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.schemas.pagination import Page
from app.security import get_current_user, get_current_requester_user
from app.email_utils import send_reservation_pending_email, send_new_reservation_to_managers_email
from app.logging_utils import create_log

# Cria um roteador FastAPI para agrupar os endpoints de reservas
router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"]
)

# --- Tarefa em Segundo Plano para Envio de E-mails ---

async def task_send_creation_emails(reservation_id: int):
    """
    (ASSÍNCRONA) Tarefa em segundo plano para enviar e-mails de notificação.

    Esta função é executada de forma independente da requisição HTTP principal.
    Ela cria sua própria sessão de banco de dados para buscar os detalhes da
    reserva e enviar os e-mails necessários (um para o usuário e outro para
    os gerentes), evitando que a API espere pelo envio dos e-mails.
    """
    db = SessionLocal()  # Cria uma nova sessão de DB específica para esta tarefa
    try:
        # Busca a reserva com todos os dados relacionados necessários para os e-mails
        reservation = db.query(Reservation).options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        ).filter(Reservation.id == reservation_id).first()

        if not reservation:
            return

        # Busca todos os usuários com permissão de 'manager' ou 'admin'
        managers_and_admins = db.query(User).filter(User.role.in_(['manager', 'admin'])).all()

        # Dispara as duas tarefas de envio de e-mail em paralelo para otimizar o tempo
        await asyncio.gather(
            send_reservation_pending_email(reservation),
            send_new_reservation_to_managers_email(managers_and_admins, reservation)
        )
    finally:
        db.close()  # Garante que a sessão do banco de dados seja fechada


# --- ROTAS ---

@router.post("/", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation: ReservationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_requester_user)
):
    """
    (Requerente) Cria uma nova solicitação de reserva para uma unidade de equipamento.
    """
    # Valida se a unidade de equipamento solicitada existe
    unit = db.query(EquipmentUnit).options(joinedload(EquipmentUnit.equipment_type)).filter(EquipmentUnit.id == reservation.unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidade de equipamento não encontrada.")

    # Valida se a unidade está disponível para reserva
    if unit.status != 'available':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta unidade não está disponível para reserva.")

    # Verifica se há conflito de horário com outras reservas pendentes ou aprovadas para a mesma unidade
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
    
    # Cria a nova reserva com status 'pending'
    new_reservation = Reservation(
        **reservation.dict(),
        user_id=current_user.id,
        status='pending'
    )
    
    # Altera o status da unidade para 'pending' para evitar que seja reservada por outra pessoa
    unit.status = 'pending'
    
    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    create_log(db, current_user.id, "INFO", f"Usuário '{current_user.username}' solicitou a reserva da unidade '{unit.identifier_code}' (ID: {unit.id}).")

    # Adiciona a tarefa de envio de e-mails para ser executada em segundo plano
    background_tasks.add_task(task_send_creation_emails, new_reservation.id)

    return new_reservation

@router.get("/my-reservations", response_model=Page[ReservationOut])
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_requester_user),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    sort_by: Optional[str] = Query(None), # Alterado o padrão
    sort_dir: Optional[str] = Query('asc'), # Alterado o padrão
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100)
):
    """
    (Requerente) Retorna uma lista paginada de todas as reservas feitas pelo usuário autenticado, com filtros.
    """
    query = (
        db.query(Reservation)
        .join(Reservation.equipment_unit)
        .join(EquipmentUnit.equipment_type)
        .filter(Reservation.user_id == current_user.id)
        .options(  # Otimiza a consulta carregando os dados relacionados de uma só vez
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        )
    )

    # Aplica filtros de busca e de status, se fornecidos
    if search:
        search_term = f"%{search}%"
        filter_conditions = [
            EquipmentType.name.ilike(search_term),
            EquipmentUnit.identifier_code.ilike(search_term),
            EquipmentUnit.serial_number.ilike(search_term),
        ]
        if search.isdigit():
            filter_conditions.append(Reservation.id == int(search))
        query = query.filter(or_(*filter_conditions))

    if status and status != "all":
        if status == "overdue":
            query = query.filter(Reservation.status == 'approved', Reservation.end_time < datetime.now(timezone.utc))
        else:
            query = query.filter(Reservation.status == status)

    # Aplica filtros de período, se fornecidos
    if start_date:
        query = query.filter(Reservation.end_time >= start_date)
    if end_date:
        query = query.filter(Reservation.start_time <= end_date)

    # Lógica de ordenação
    sort_column_map = {
        'equipment': EquipmentType.name,
        'code': EquipmentUnit.identifier_code,
        'status': Reservation.status,
        'start_time': Reservation.start_time,
        'end_time': Reservation.end_time,
        'created_at': Reservation.created_at
    }
    
    # Se uma ordenação específica for solicitada, aplica.
    if sort_by and sort_by in sort_column_map:
        sort_column = sort_column_map.get(sort_by)
        sort_direction = desc(sort_column) if sort_dir == 'desc' else asc(sort_column)
        query = query.order_by(sort_direction)
    else:
        # Caso contrário, aplica a ordenação padrão (pendentes primeiro, depois aprovadas, depois por data de início).
        status_sort_order = case(
            (Reservation.status == 'pending', 1),
            (Reservation.status == 'approved', 2),
            else_=3
        ).asc()
        query = query.order_by(status_sort_order, desc(Reservation.start_time))


    # Calcula o total de itens para a paginação
    total = query.count()
    # Executa a consulta com ordenação, paginação e retorna os resultados
    reservations = query.offset((page - 1) * size).limit(size).all()
    
    return {
        "items": reservations,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size)
    }


@router.get("/upcoming", response_model=List[ReservationOut])
def get_my_upcoming_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_requester_user)
):
    """
    (Requerente) Retorna as próximas 3 reservas aprovadas e futuras do usuário.
    Ideal para um painel de visualização rápida.
    """
    now = datetime.now(timezone.utc)
    reservations = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == current_user.id,
            Reservation.status == 'approved',
            Reservation.start_time > now  # Filtra apenas reservas que ainda não começaram
        )
        .options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        )
        .order_by(Reservation.start_time.asc()) # Ordena pela mais próxima
        .limit(3)
        .all()
    )
    return reservations