# app/routes/equipments.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.user import User
from app.schemas.equipment import (
    EquipmentTypeCreate, EquipmentTypeOut,
    EquipmentUnitCreate, EquipmentUnitOut, EquipmentTypeWithUnitsOut
)
from app.security import get_current_user

# Cria um novo "roteador" para agrupar todas as rotas de equipamentos
router = APIRouter(
    prefix="/equipments",
    tags=["Equipments Management"] # Agrupa na documentação da API
)

# --- Rotas para TIPOS de Equipamento ---

@router.post("/types", response_model=EquipmentTypeOut, status_code=status.HTTP_201_CREATED)
def create_equipment_type(
    equipment_type: EquipmentTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Rota protegida
):
    """
    Cria um novo tipo de equipamento (ex: "Notebook Dell Vostro").
    Requer autenticação.
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
def list_equipment_types(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    Lista todos os tipos de equipamentos cadastrados.
    """
    types = db.query(EquipmentType).offset(skip).limit(limit).all()
    return types

@router.get("/types/{type_id}", response_model=EquipmentTypeWithUnitsOut)
def get_equipment_type_with_units(type_id: int, db: Session = Depends(get_db)):
    """
    Busca um tipo de equipamento pelo seu ID e retorna os detalhes
    junto com todas as suas unidades físicas.
    """
    db_type = db.query(EquipmentType).filter(EquipmentType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Tipo de equipamento não encontrado.")
    return db_type

# --- Rotas para UNIDADES de Equipamento ---

@router.post("/units", response_model=EquipmentUnitOut, status_code=status.HTTP_201_CREATED)
def create_equipment_unit(
    unit: EquipmentUnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Rota protegida
):
    """
    Cria uma nova unidade física para um tipo de equipamento existente 
    (ex: "Notebook #001" do tipo "Notebook Dell Vostro").
    Requer autenticação.
    """
    # Verifica se o tipo de equipamento ao qual a unidade pertencerá existe
    db_type = db.query(EquipmentType).filter(EquipmentType.id == unit.type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="O tipo de equipamento especificado não existe.")

    new_unit = EquipmentUnit(**unit.dict())
    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)
    return new_unit

@router.get("/units", response_model=List[EquipmentUnitOut])
def list_all_units(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    Lista todas as unidades de equipamentos cadastradas no sistema.
    """
    units = db.query(EquipmentUnit).offset(skip).limit(limit).all()
    return units