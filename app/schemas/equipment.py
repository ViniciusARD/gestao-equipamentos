# app/schemas/equipment.py

from pydantic import BaseModel
from typing import Optional, List

# --- Schemas para EquipmentUnit (Unidade do Equipamento) ---

class EquipmentUnitBase(BaseModel):
    identifier_code: Optional[str] = None
    status: str = 'available'

class EquipmentUnitCreate(EquipmentUnitBase):
    type_id: int

class EquipmentUnitUpdate(BaseModel):
    identifier_code: Optional[str] = None
    status: Optional[str] = None

# --- Schemas para EquipmentType (Tipo do Equipamento) ---

class EquipmentTypeBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None

class EquipmentTypeCreate(EquipmentTypeBase):
    pass

class EquipmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

# --- Schemas de Resposta (Output) ---
# Estes definem como os dados serão retornados pela API.

class EquipmentUnitOut(EquipmentUnitBase):
    id: int
    type_id: int

    class Config:
        from_attributes = True

class EquipmentTypeOut(EquipmentTypeBase):
    id: int

    class Config:
        from_attributes = True

# Um schema especial para quando quisermos ver um tipo e todas as suas unidades juntas.
class EquipmentTypeWithUnitsOut(EquipmentTypeOut):
    units: List[EquipmentUnitOut] = []