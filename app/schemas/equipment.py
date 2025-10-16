# app/schemas/equipment.py

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from .user import UserOut
from datetime import datetime

# --- Schemas de base e de output para EquipmentType ---
class EquipmentTypeBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None

class EquipmentTypeOut(EquipmentTypeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Schema para listagem com contagem de unidades
class EquipmentTypeStatsOut(EquipmentTypeOut):
    total_units: int
    available_units: int
    reserved_units: int
    maintenance_units: int

# --- Novo Schema para informações básicas de reserva ---
class ReservationBasicOut(BaseModel):
    end_time: datetime
    user: UserOut
    model_config = ConfigDict(from_attributes=True)


# --- Schemas para EquipmentUnit (Unidade do Equipamento) ---
class EquipmentUnitBase(BaseModel):
    identifier_code: Optional[str] = None
    status: str = 'available'

class EquipmentUnitCreate(EquipmentUnitBase):
    type_id: int
    quantity: int = Field(1, gt=0, description="Number of units to create.")

class EquipmentUnitUpdate(BaseModel):
    identifier_code: Optional[str] = None
    status: Optional[str] = None

class EquipmentUnitOut(EquipmentUnitBase):
    id: int
    type_id: int
    equipment_type: EquipmentTypeOut
    active_reservation: Optional[ReservationBasicOut] = None # Campo atualizado
    model_config = ConfigDict(from_attributes=True)

# --- Schemas restantes para EquipmentType ---
class EquipmentTypeCreate(EquipmentTypeBase):
    pass

class EquipmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

class EquipmentTypeWithUnitsOut(EquipmentTypeOut):
    units: List[EquipmentUnitOut] = []