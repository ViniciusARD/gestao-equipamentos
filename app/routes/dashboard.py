# app/routes/dashboard.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, case
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.reservation import Reservation
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.user import User
from app.models.setor import Setor
from app.schemas.dashboard import DashboardStats, StatsItem
from app.security import get_current_admin_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """
    (Admin) Retorna estatísticas agregadas para o painel de análise.
    """
    # Query base para reservas, com filtros de data se fornecidos
    query = db.query(Reservation)
    if start_date:
        query = query.filter(Reservation.created_at >= start_date)
    if end_date:
        query = query.filter(Reservation.created_at <= end_date)

    # <<-- MODIFICAÇÃO: Apenas reservas aprovadas para os TOP 5 -->>
    approved_query = query.filter(Reservation.status == 'approved')


    # 1. Equipamentos mais reservados (APENAS APROVADOS)
    top_equipments_query = (
        approved_query
        .join(Reservation.equipment_unit)
        .join(EquipmentUnit.equipment_type)
        .group_by(EquipmentType.name)
        .with_entities(EquipmentType.name, func.count(Reservation.id).label('count'))
        .order_by(desc('count'))
        .limit(5)
        .all()
    )
    top_equipments = [StatsItem(name=name, count=count) for name, count in top_equipments_query]

    # 2. Setores que mais reservam (APENAS APROVADOS)
    top_sectors_query = (
        approved_query
        .join(Reservation.user)
        .join(User.setor)
        .group_by(Setor.name)
        .with_entities(Setor.name, func.count(Reservation.id).label('count'))
        .order_by(desc('count'))
        .limit(5)
        .all()
    )
    top_sectors = [StatsItem(name=name, count=count) for name, count in top_sectors_query]

    # 3. Usuários que mais reservam (APENAS APROVADOS)
    top_users_query = (
        approved_query
        .join(Reservation.user)
        .group_by(User.username)
        .with_entities(User.username, func.count(Reservation.id).label('count'))
        .order_by(desc('count'))
        .limit(5)
        .all()
    )
    top_users = [StatsItem(name=name, count=count) for name, count in top_users_query]

    # <<-- NOVA QUERY: Contagem de status de reserva -->>
    status_counts_query = (
        query
        .group_by(Reservation.status)
        .with_entities(
            Reservation.status,
            func.count(Reservation.id).label('count')
        )
        .all()
    )
    # Traduzir os status para melhor visualização
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


    return DashboardStats(
        top_equipments=top_equipments,
        top_sectors=top_sectors,
        top_users=top_users,
        reservation_status_counts=reservation_status_counts
    )