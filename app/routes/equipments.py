# app/routes/equipments.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, subqueryload, joinedload
from sqlalchemy import func, case, or_
from typing import List, Optional

from app.database import get_db
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.user import User
from app.models.reservation import Reservation
from app.models.unit_history import UnitHistory # <<-- IMPORTAR
from app.schemas.equipment import (
    EquipmentTypeCreate, EquipmentTypeOut, EquipmentTypeUpdate,
    EquipmentUnitCreate, EquipmentUnitOut, EquipmentUnitUpdate,
    EquipmentTypeWithUnitsOut, EquipmentTypeStatsOut
)
from app.schemas.unit_history import UnitHistoryOut # <<-- IMPORTAR
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
    """(Manager) Cria um novo tipo de equipamento."""
    db_type = db.query(EquipmentType).filter(EquipmentType.name == equipment_type.name).first()
    if db_type:
        raise HTTPException(status_code=400, detail="Este tipo de equipamento já existe.")

    new_type = EquipmentType(**equipment_type.dict())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)

    create_log(db, manager_user.id, "INFO", f"Manager '{manager_user.email}' criou o tipo de equipamento '{new_type.name}' (ID: {new_type.id}).")

    return new_type

@router.get("/types", response_model=List[EquipmentTypeStatsOut])
def list_equipment_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None, alias="search"),
    category: Optional[str] = Query(None, alias="category"),
    availability: Optional[str] = Query(None, alias="availability") # Novo filtro
):
    """(Usuários Autenticados) Lista todos os tipos de equipamentos com estatísticas de unidades."""
    
    available_units_subquery = func.sum(case((EquipmentUnit.status == 'available', 1), else_=0))
    
    query = (
        db.query(
            EquipmentType,
            func.count(EquipmentUnit.id).label("total_units"),
            available_units_subquery.label("available_units")
        )
        .outerjoin(EquipmentUnit, EquipmentType.id == EquipmentUnit.type_id)
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                EquipmentType.name.ilike(search_term),
                EquipmentType.description.ilike(search_term),
                EquipmentType.category.ilike(search_term)
            )
        )

    if category and category != "all":
        query = query.filter(EquipmentType.category == category)
    
    query = query.group_by(EquipmentType.id)

    if availability == "available":
        query = query.having(available_units_subquery > 0)
    elif availability == "unavailable":
        query = query.having(available_units_subquery == 0)


    results = query.order_by(EquipmentType.name).all()
    
    stats_out = []
    for type_obj, total_units, available_units in results:
        stats_out.append(
            EquipmentTypeStatsOut.model_validate({
                **type_obj.__dict__,
                "total_units": total_units or 0,
                "available_units": available_units or 0
            })
        )
    return stats_out


@router.get("/types/{type_id}", response_model=EquipmentTypeWithUnitsOut)
def get_equipment_type_with_units(type_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """(Usuários Autenticados) Busca um tipo de equipamento e suas unidades."""
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")
    return db_type

@router.put("/types/{type_id}", response_model=EquipmentTypeOut)
def update_equipment_type(
    type_id: int,
    type_update: EquipmentTypeUpdate,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Manager) Atualiza os detalhes de um tipo de equipamento."""
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")

    update_data = type_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_type, key, value)
    
    db.commit()
    db.refresh(db_type)
    
    create_log(db, manager_user.id, "INFO", f"Manager '{manager_user.email}' atualizou o tipo de equipamento '{db_type.name}' (ID: {db_type.id}).")
    
    return db_type

@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment_type(
    type_id: int,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Manager) Deleta um tipo de equipamento e todas as suas unidades."""
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")
    
    type_name = db_type.name
    db.delete(db_type)
    db.commit()
    
    create_log(db, manager_user.id, "INFO", f"Manager '{manager_user.email}' deletou o tipo de equipamento '{type_name}' (ID: {type_id}).")
    
    return

# --- Rotas para UNIDADES de Equipamento ---

@router.post("/units", response_model=EquipmentUnitOut, status_code=status.HTTP_201_CREATED)
def create_equipment_unit(
    unit: EquipmentUnitCreate,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Manager) Cria uma nova unidade física para um tipo de equipamento."""
    db_type = db.query(EquipmentType).filter(EquipmentType.id == unit.type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="O tipo de equipamento especificado não existe.")

    new_unit = EquipmentUnit(**unit.dict())
    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)

    # <<-- Adiciona evento de criação ao histórico -->>
    history_event = UnitHistory(
        unit_id=new_unit.id,
        event_type='created',
        notes=f"Unidade criada com status '{new_unit.status}'.",
        user_id=manager_user.id
    )
    db.add(history_event)
    db.commit()
    
    create_log(db, manager_user.id, "INFO", f"Manager '{manager_user.email}' criou a unidade '{new_unit.identifier_code or new_unit.id}' para o tipo '{db_type.name}'.")
    
    return new_unit

@router.get("/units", response_model=List[EquipmentUnitOut])
def list_all_units(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """(Usuários Autenticados) Lista todas as unidades de equipamentos."""
    return db.query(EquipmentUnit).all()

# <<-- NOVA ROTA DE HISTÓRICO -->>
@router.get("/units/{unit_id}/history", response_model=List[UnitHistoryOut])
def get_unit_history(
    unit_id: int,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Manager) Retorna o histórico de eventos de uma unidade específica."""
    unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidade de equipamento não encontrada.")

    history = (
        db.query(UnitHistory)
        .options(joinedload(UnitHistory.user))
        .filter(UnitHistory.unit_id == unit_id)
        .order_by(UnitHistory.created_at.desc())
        .all()
    )
    return history


@router.put("/units/{unit_id}", response_model=EquipmentUnitOut)
def update_equipment_unit(
    unit_id: int,
    unit_update: EquipmentUnitUpdate,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Manager) Atualiza os detalhes de uma unidade de equipamento."""
    db_unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidade de equipamento não encontrada.")

    update_data = unit_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_unit, key, value)
    
    db.commit()
    db.refresh(db_unit)
    
    create_log(db, manager_user.id, "INFO", f"Manager '{manager_user.email}' atualizou a unidade ID {db_unit.id}.")
    
    return db_unit

@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Manager) Deleta uma unidade de equipamento."""
    db_unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidade de equipamento não encontrada.")
        
    active_reservation = db.query(Reservation).filter(
        Reservation.unit_id == unit_id,
        Reservation.status.in_(['pending', 'approved'])
    ).first()
    
    if active_reservation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Não é possível deletar a unidade. Ela está associada à reserva ativa ID {active_reservation.id}."
        )
    
    unit_identifier = db_unit.identifier_code or db_unit.id
    db.delete(db_unit)
    db.commit()
    
    create_log(db, manager_user.id, "INFO", f"Manager '{manager_user.email}' deletou a unidade '{unit_identifier}' (ID: {unit_id}).")
    
    return

# --- Rota de Estatísticas ---
@router.get("/stats/popular", response_model=List[EquipmentTypeOut])
def get_popular_equipment_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retorna os 5 tipos de equipamentos mais reservados."""
    
    popular_types_subquery = (
        db.query(
            EquipmentType.id,
            func.count(Reservation.id).label('reservation_count')
        )
        .join(EquipmentUnit, EquipmentType.id == EquipmentUnit.type_id)
        .join(Reservation, EquipmentUnit.id == Reservation.unit_id)
        .group_by(EquipmentType.id)
        .order_by(func.count(Reservation.id).desc())
        .limit(5)
        .subquery()
    )

    popular_types = (
        db.query(EquipmentType)
        .join(popular_types_subquery, EquipmentType.id == popular_types_subquery.c.id)
        .order_by(popular_types_subquery.c.reservation_count.desc())
        .all()
    )

    return popular_types