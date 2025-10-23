# app/routes/equipments.py

"""
Módulo de Rotas para Gerenciamento de Equipamentos

Este arquivo define os endpoints para todas as operações CRUD (Criar, Ler,
Atualizar, Deletar) relacionadas tanto aos Tipos de Equipamento quanto às
Unidades de Equipamento individuais.

Dependências:
- FastAPI: Para a criação do roteador e gerenciamento das requisições.
- SQLAlchemy: Para a interação e consultas complexas ao banco de dados.
- Módulos de modelos e schemas: Para a estrutura de dados e validação.
- Módulos de utilitários: security (para proteger rotas) e logging_utils.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, subqueryload, joinedload
from sqlalchemy import func, case, or_
from typing import List, Optional
import math

from app.database import get_db
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.user import User
from app.models.reservation import Reservation
from app.models.unit_history import UnitHistory
from app.schemas.equipment import (
    EquipmentTypeCreate, EquipmentTypeOut, EquipmentTypeUpdate,
    EquipmentUnitCreate, EquipmentUnitOut, EquipmentUnitUpdate,
    EquipmentTypeWithUnitsOut, EquipmentTypeStatsOut
)
from app.schemas.pagination import Page
from app.schemas.unit_history import UnitHistoryOut
from app.security import get_current_user, get_current_manager_user
from app.logging_utils import create_log

router = APIRouter(
    prefix="/equipments",
    tags=["Equipments Management"]
)

# --- Rotas para TIPOS de Equipamento ---

@router.post("/types", response_model=EquipmentTypeOut, status_code=status.HTTP_201_CREATED)
def create_equipment_type(
    equipment_type: EquipmentTypeCreate,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Gerente) Cria um novo tipo de equipamento (ex: "Notebook Dell Vostro")."""
    db_type = db.query(EquipmentType).filter(EquipmentType.name == equipment_type.name).first()
    if db_type:
        raise HTTPException(status_code=400, detail="Este tipo de equipamento já existe.")

    new_type = EquipmentType(**equipment_type.dict())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)

    create_log(db, manager_user.id, "INFO", f"Gerente '{manager_user.email}' criou o tipo de equipamento '{new_type.name}' (ID: {new_type.id}).")
    return new_type

@router.get("/types/categories", response_model=List[str])
def list_equipment_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """(Usuários Autenticados) Retorna uma lista de todas as categorias de equipamentos únicas."""
    categories = db.query(EquipmentType.category).distinct().order_by(EquipmentType.category).all()
    return [category[0] for category in categories]


@router.get("/types", response_model=Page[EquipmentTypeStatsOut])
def list_equipment_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    availability: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(9, ge=1, le=1000)
):
    """
    (Usuários Autenticados) Lista todos os tipos de equipamentos com estatísticas de unidades.
    Esta consulta complexa calcula a contagem de unidades por status para cada tipo.
    """
    # Subconsultas para calcular as estatísticas de unidades de forma eficiente
    total_sub = func.count(EquipmentUnit.id).label("total_units")
    available_sub = func.sum(case((EquipmentUnit.status == 'available', 1), else_=0)).label("available_units")
    reserved_sub = func.sum(case((EquipmentUnit.status.in_(['reserved', 'pending']), 1), else_=0)).label("reserved_units")
    maintenance_sub = func.sum(case((EquipmentUnit.status == 'maintenance', 1), else_=0)).label("maintenance_units")

    query = (
        db.query(
            EquipmentType,
            total_sub,
            available_sub,
            reserved_sub,
            maintenance_sub
        )
        .outerjoin(EquipmentUnit, EquipmentType.id == EquipmentUnit.type_id)
    )

    # Aplica filtros de busca por texto e categoria
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                EquipmentType.name.ilike(search_term),
                EquipmentType.description.ilike(search_term),
                EquipmentType.category.ilike(search_term),
                EquipmentUnit.identifier_code.ilike(search_term),
                EquipmentUnit.serial_number.ilike(search_term)
            )
        )
    if category and category != "all":
        query = query.filter(EquipmentType.category == category)
    
    query = query.group_by(EquipmentType.id)

    # Aplica filtro por disponibilidade
    if availability == "available":
        query = query.having(available_sub > 0)
    elif availability == "unavailable":
        query = query.having(available_sub == 0)

    total = query.count()
    results = query.order_by(EquipmentType.name).offset((page - 1) * size).limit(size).all()
    
    # Monta a lista de resposta no formato do schema EquipmentTypeStatsOut
    stats_out = [
        EquipmentTypeStatsOut.model_validate({
            **type_obj.__dict__,
            "total_units": total_units or 0,
            "available_units": available or 0,
            "reserved_units": reserved or 0,
            "maintenance_units": maintenance or 0
        }) for type_obj, total_units, available, reserved, maintenance in results
    ]
    
    return {
        "items": stats_out,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if size > 0 else 0
    }

@router.get("/types/{type_id}", response_model=EquipmentTypeWithUnitsOut)
def get_equipment_type_with_units(type_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """(Usuários Autenticados) Busca um tipo de equipamento e todas as suas unidades."""
    db_type = db.query(EquipmentType).options(
        joinedload(EquipmentType.units).subqueryload(EquipmentUnit.reservations).joinedload(Reservation.user)
    ).filter(EquipmentType.id == type_id).first()

    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")

    # Adiciona a informação da reserva ativa a cada unidade para exibição no frontend
    for unit in db_type.units:
        unit.active_reservation = next((r for r in unit.reservations if r.status in ['approved', 'pending']), None)

    return db_type

@router.put("/types/{type_id}", response_model=EquipmentTypeOut)
def update_equipment_type(
    type_id: int, type_update: EquipmentTypeUpdate, db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Gerente) Atualiza os detalhes de um tipo de equipamento."""
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")

    update_data = type_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_type, key, value)
    
    db.commit()
    db.refresh(db_type)
    create_log(db, manager_user.id, "INFO", f"Gerente '{manager_user.email}' atualizou o tipo de equipamento '{db_type.name}' (ID: {db_type.id}).")
    return db_type

@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment_type(type_id: int, db: Session = Depends(get_db), manager_user: User = Depends(get_current_manager_user)):
    """(Gerente) Deleta um tipo de equipamento e todas as suas unidades associadas (devido à cascata no modelo)."""
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")
    
    type_name = db_type.name
    db.delete(db_type)
    db.commit()
    create_log(db, manager_user.id, "INFO", f"Gerente '{manager_user.email}' deletou o tipo de equipamento '{type_name}' (ID: {type_id}).")
    return

# --- Rotas para UNIDADES de Equipamento ---

@router.post("/units", response_model=List[EquipmentUnitOut], status_code=status.HTTP_201_CREATED)
def create_equipment_unit(
    unit_data: EquipmentUnitCreate, db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Gerente) Cria uma ou mais novas unidades físicas para um tipo de equipamento."""
    db_type = db.query(EquipmentType).filter(EquipmentType.id == unit_data.type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="O tipo de equipamento especificado não existe.")

    # Validação de unicidade para código e número de série
    if db.query(EquipmentUnit).filter(EquipmentUnit.identifier_code == unit_data.identifier_code).first():
        raise HTTPException(status_code=409, detail=f"O código de identificação '{unit_data.identifier_code}' já está em uso.")
    if db.query(EquipmentUnit).filter(EquipmentUnit.serial_number == unit_data.serial_number).first():
        raise HTTPException(status_code=409, detail=f"O número de série '{unit_data.serial_number}' já está em uso.")

    if unit_data.quantity > 1:
         raise HTTPException(status_code=400, detail="Não é possível criar múltiplas unidades com número de série. Adicione uma de cada vez.")

    created_units = []
    for _ in range(unit_data.quantity):
        new_unit = EquipmentUnit(**unit_data.dict(exclude={'quantity'}))
        db.add(new_unit)
        db.flush()  # Garante que o ID da nova unidade seja gerado para o log de histórico
        
        # Cria um registro de histórico para o evento de criação
        history_event = UnitHistory(unit_id=new_unit.id, event_type='created', notes=f"Unidade criada com status '{new_unit.status}'.", user_id=manager_user.id)
        db.add(history_event)
        created_units.append(new_unit)

    db.commit()
    log_message = f"Gerente '{manager_user.email}' criou {unit_data.quantity} unidade(s) para o tipo '{db_type.name}'."
    create_log(db, manager_user.id, "INFO", log_message)
    
    for unit in created_units: db.refresh(unit)
    return created_units

@router.get("/units/{unit_id}/history", response_model=List[UnitHistoryOut])
def get_unit_history(unit_id: int, db: Session = Depends(get_db), manager_user: User = Depends(get_current_manager_user)):
    """(Gerente) Retorna o histórico de eventos de uma unidade específica."""
    if not db.query(EquipmentUnit).filter(EquipmentUnit.id == unit_id).first():
        raise HTTPException(status_code=404, detail="Unidade de equipamento não encontrada.")

    history = db.query(UnitHistory).options(joinedload(UnitHistory.user)).filter(UnitHistory.unit_id == unit_id).order_by(UnitHistory.created_at.desc()).all()
    return history

@router.put("/units/{unit_id}", response_model=EquipmentUnitOut)
def update_equipment_unit(
    unit_id: int, unit_update: EquipmentUnitUpdate, db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Gerente) Atualiza os detalhes de uma unidade de equipamento."""
    db_unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidade de equipamento não encontrada.")

    update_data = unit_update.dict(exclude_unset=True)

    # Validações de unicidade para os campos que estão sendo alterados
    if 'identifier_code' in update_data and update_data['identifier_code'] != db_unit.identifier_code:
        if db.query(EquipmentUnit).filter(EquipmentUnit.identifier_code == update_data['identifier_code']).first():
            raise HTTPException(status_code=409, detail=f"O código de identificação '{update_data['identifier_code']}' já está em uso.")
    if 'serial_number' in update_data and update_data['serial_number'] != db_unit.serial_number:
        if db.query(EquipmentUnit).filter(EquipmentUnit.serial_number == update_data['serial_number']).first():
            raise HTTPException(status_code=409, detail=f"O número de série '{update_data['serial_number']}' já está em uso.")

    for key, value in update_data.items():
        setattr(db_unit, key, value)
    
    db.commit()
    db.refresh(db_unit)
    create_log(db, manager_user.id, "INFO", f"Gerente '{manager_user.email}' atualizou a unidade ID {db_unit.id}.")
    return db_unit

@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment_unit(unit_id: int, db: Session = Depends(get_db), manager_user: User = Depends(get_current_manager_user)):
    """(Gerente) Deleta uma unidade de equipamento."""
    db_unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidade de equipamento não encontrada.")
        
    # Impede a exclusão se a unidade tiver uma reserva ativa
    if db.query(Reservation).filter(Reservation.unit_id == unit_id, Reservation.status.in_(['pending', 'approved'])).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Não é possível deletar a unidade. Ela está associada a uma reserva ativa.")
    
    unit_identifier = db_unit.identifier_code or db_unit.id
    db.delete(db_unit)
    db.commit()
    create_log(db, manager_user.id, "INFO", f"Gerente '{manager_user.email}' deletou a unidade '{unit_identifier}' (ID: {unit_id}).")
    return

# --- Rota de Estatísticas ---
@router.get("/stats/popular", response_model=List[EquipmentTypeOut])
def get_popular_equipment_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """(Usuários Autenticados) Retorna os 5 tipos de equipamentos mais reservados."""
    popular_types = (
        db.query(EquipmentType)
        .join(EquipmentUnit)
        .join(Reservation)
        .group_by(EquipmentType.id)
        .order_by(func.count(Reservation.id).desc())
        .limit(5)
        .all()
    )
    return popular_types