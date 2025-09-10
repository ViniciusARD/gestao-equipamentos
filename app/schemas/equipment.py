# app/schemas/equipment.py

from pydantic import BaseModel
from typing import Optional, List

# --- Schemas de base e de output para EquipmentType ---
# Definidos primeiro para que possam ser usados nos schemas de Unit.

class EquipmentTypeBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None

class EquipmentTypeOut(EquipmentTypeBase):
    id: int

    class Config:
        from_attributes = True

# --- Schemas para EquipmentUnit (Unidade do Equipamento) ---

class EquipmentUnitBase(BaseModel):
    identifier_code: Optional[str] = None
    status: str = 'available'

class EquipmentUnitCreate(EquipmentUnitBase):
    type_id: int

class EquipmentUnitUpdate(BaseModel):
    identifier_code: Optional[str] = None
    status: Optional[str] = None

# --- CORREÇÃO APLICADA AQUI ---
# O schema de output da Unidade agora inclui o objeto completo do Tipo.
class EquipmentUnitOut(EquipmentUnitBase):
    id: int
    type_id: int
    equipment_type: EquipmentTypeOut  # <--- Esta é a linha que corrige o bug

    class Config:
        from_attributes = True

# --- Schemas restantes para EquipmentType ---

class EquipmentTypeCreate(EquipmentTypeBase):
    pass

class EquipmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

# Schema especial para quando quisermos ver um tipo e todas as suas unidades juntas.
# Ele se beneficia da correção acima, pois agora as unidades virão com seus tipos.
class EquipmentTypeWithUnitsOut(EquipmentTypeOut):
    units: List[EquipmentUnitOut] = []