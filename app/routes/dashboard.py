# app/routes/dashboard.py

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, case
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.reservation import Reservation
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.user import User
from app.models.sector import Sector
from app.schemas.dashboard import DashboardStats, StatsItem
from app.security import get_current_admin_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    sector_id: Optional[int] = Query(None),
    equipment_type_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None)
):
    """
    (Admin) Retorna estatísticas agregadas para o painel de análise com filtros avançados.
    """
    # Query base para todas as estatísticas
    query = db.query(Reservation)

    # Aplica filtros de data
    if start_date:
        query = query.filter(Reservation.created_at >= start_date)
    if end_date:
        query = query.filter(Reservation.created_at <= end_date)

    # Aplica filtros adicionais
    if sector_id:
        query = query.join(Reservation.user).filter(User.sector_id == sector_id)
    if user_id:
        if not sector_id:
            query = query.join(Reservation.user)
        query = query.filter(User.id == user_id)
    if equipment_type_id:
        query = query.join(Reservation.equipment_unit).filter(EquipmentUnit.type_id == equipment_type_id)


    # 1. KPIs Gerais (baseados nos filtros)
    total_users = db.query(User).count()
    total_equipments = db.query(EquipmentUnit).count()
    total_reservations = query.count()


    # 2. Equipamentos mais reservados
    top_equipments_query_base = query
    if not equipment_type_id:
        top_equipments_query_base = top_equipments_query_base.join(Reservation.equipment_unit)

    top_equipments_query = (
        top_equipments_query_base
        .join(EquipmentUnit.equipment_type)
        .group_by(EquipmentType.name)
        .with_entities(EquipmentType.name, func.count(Reservation.id).label('count'))
        .order_by(desc('count'))
        .limit(5)
        .all()
    )
    top_equipments = [StatsItem(name=name, count=count) for name, count in top_equipments_query]

    # 3. Setores que mais reservam
    top_sectors_query_base = query
    if not sector_id and not user_id:
        top_sectors_query_base = top_sectors_query_base.join(Reservation.user)

    top_sectors_query = (
        top_sectors_query_base
        .join(User.sector)
        .group_by(Sector.name)
        .with_entities(Sector.name, func.count(Reservation.id).label('count'))
        .order_by(desc('count'))
        .limit(5)
        .all()
    )
    top_sectors = [StatsItem(name=name, count=count) for name, count in top_sectors_query]


    # 4. Usuários que mais reservam
    top_users_query_base = query
    if not sector_id and not user_id:
         top_users_query_base = top_users_query_base.join(Reservation.user)

    top_users_query = (
        top_users_query_base
        .group_by(User.username)
        .with_entities(User.username, func.count(Reservation.id).label('count'))
        .order_by(desc('count'))
        .limit(5)
        .all()
    )
    top_users = [StatsItem(name=name, count=count) for name, count in top_users_query]

    # 5. Contagem de status de reserva
    status_counts_query = (
        query
        .group_by(Reservation.status)
        .with_entities(
            Reservation.status,
            func.count(Reservation.id).label('count')
        )
        .all()
    )
    status_translation = {
        'approved': 'Aprovadas',
        'pending': 'Pendentes',
        'rejected': 'Rejeitadas',
        'returned': 'Devolvidas'
    }
    reservation_status_counts = [
        StatsItem(name=status_translation.get(status, status), count=count)
        for status, count in status_counts_query
    ]

    # 6. Reservas por dia da semana
    reservations_by_day_query = (
        query
        .group_by(func.extract('isodow', Reservation.created_at))
        .with_entities(
            func.extract('isodow', Reservation.created_at).label('day_of_week'),
            func.count(Reservation.id).label('count')
        )
        .order_by('day_of_week')
        .all()
    )
    days_of_week = {
        1: "Segunda", 2: "Terça", 3: "Quarta",
        4: "Quinta", 5: "Sexta", 6: "Sábado", 7: "Domingo"
    }
    reservations_by_day_dict = {day: count for day, count in reservations_by_day_query}
    reservations_by_day = [
        StatsItem(name=days_of_week[i], count=reservations_by_day_dict.get(i, 0))
        for i in range(1, 8)
    ]

    stats_object = DashboardStats(
        total_users=total_users,
        total_equipments=total_equipments,
        total_reservations=total_reservations,
        top_equipments=top_equipments,
        top_sectors=top_sectors,
        top_users=top_users,
        reservation_status_counts=reservation_status_counts,
        reservations_by_day=reservations_by_day
    )

    # --- NOVA ABORDAGEM ---
    # Converte o objeto Pydantic para JSON e cria uma Resposta manual
    # com o cabeçalho de codificação correto.
    json_content = stats_object.model_dump_json()
    return Response(content=json_content, media_type="application/json; charset=utf-8")