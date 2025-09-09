# app/routes/equipments.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.user import User
# Importar os schemas de Update
from app.schemas.equipment import (
    EquipmentTypeCreate, EquipmentTypeOut, EquipmentTypeUpdate,
    EquipmentUnitCreate, EquipmentUnitOut, EquipmentUnitUpdate, 
    EquipmentTypeWithUnitsOut
)
from app.security import get_current_user, get_current_admin_user

router = APIRouter(
    prefix="/equipments",
    tags=["Equipments Management"]
)

# --- Rotas para TIPOS de Equipamento ---

@router.post("/types", response_model=EquipmentTypeOut, status_code=status.HTTP_201_CREATED)
def create_equipment_type(
    equipment_type: EquipmentTypeCreate,
    db: Session = Depends(get_db),
    # --- ALTERAÇÃO: Rota agora protegida para apenas administradores ---
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Cria um novo tipo de equipamento (ex: "Notebook Dell Vostro").
    Requer autenticação de administrador.
    """
    db_type = db.query(EquipmentType).filter(EquipmentType.name == equipment_type.name).first()
    if db_type:
        raise HTTPException(status_code=400, detail="Este tipo de equipamento já existe.")
    
    new_type = EquipmentType(**equipment_type.dict())
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type

@router.get("/types", response_model=List[EquipmentTypeOut])
def list_equipment_types(
    db: Session = Depends(get_db),
    # --- ALTERAÇÃO: Rota agora protegida para utilizadores autenticados ---
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os tipos de equipamentos cadastrados.
    Requer autenticação.
    """
    types = db.query(EquipmentType).offset(0).limit(100).all()
    return types

@router.get("/types/{type_id}", response_model=EquipmentTypeWithUnitsOut)
def get_equipment_type_with_units(
    type_id: int, 
    db: Session = Depends(get_db),
    # --- ALTERAÇÃO: Rota agora protegida para utilizadores autenticados ---
    current_user: User = Depends(get_current_user)
):
    """
    Busca um tipo de equipamento pelo seu ID e retorna os detalhes
    junto com todas as suas unidades físicas.
    Requer autenticação.
    """
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")
    return db_type

@router.put("/types/{type_id}", response_model=EquipmentTypeOut)
def update_equipment_type(
    type_id: int,
    type_update: EquipmentTypeUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Atualiza os detalhes de um tipo de equipamento.
    """
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")

    update_data = type_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_type, key, value)
    
    db.commit()
    db.refresh(db_type)
    return db_type

@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment_type(
    type_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Deleta um tipo de equipamento e todas as suas unidades.
    """
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")
    
    db.delete(db_type)
    db.commit()
    return

# --- Rotas para UNIDADES de Equipamento ---

@router.post("/units", response_model=EquipmentUnitOut, status_code=status.HTTP_201_CREATED)
def create_equipment_unit(
    unit: EquipmentUnitCreate,
    db: Session = Depends(get_db),
    # --- ALTERAÇÃO: Rota agora protegida para apenas administradores ---
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Cria uma nova unidade física para um tipo de equipamento existente.
    Requer autenticação de administrador.
    """
    db_type = db.query(EquipmentType).filter(EquipmentType.id == unit.type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="O tipo de equipamento especificado não existe.")

    new_unit = EquipmentUnit(**unit.dict())
    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)
    return new_unit

@router.get("/units", response_model=List[EquipmentUnitOut])
def list_all_units(
    db: Session = Depends(get_db),
    # --- ALTERAÇÃO: Rota agora protegida para utilizadores autenticados ---
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as unidades de equipamentos cadastradas no sistema.
    Requer autenticação.
    """
    units = db.query(EquipmentUnit).offset(0).limit(100).all()
    return units

@router.put("/units/{unit_id}", response_model=EquipmentUnitOut)
def update_equipment_unit(
    unit_id: int,
    unit_update: EquipmentUnitUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Atualiza os detalhes de uma unidade de equipamento.
    """
    db_unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidade de equipamento não encontrada.")

    update_data = unit_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_unit, key, value)
    
    db.commit()
    db.refresh(db_unit)
    return db_unit

@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Deleta uma unidade de equipamento.
    """
    db_unit = db.query(EquipmentUnit).filter(EquipmentUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidade de equipamento não encontrada.")
        
    db.delete(db_unit)
    db.commit()
    return