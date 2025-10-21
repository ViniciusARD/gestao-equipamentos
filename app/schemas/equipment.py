# app/schemas/equipment.py

"""
Define os schemas Pydantic para validação e serialização de dados de equipamentos.

Este módulo contém as classes que definem a forma dos dados para os Tipos de
Equipamento e para as Unidades de Equipamento, tanto para entrada (criação,
atualização) quanto para saída (respostas da API).

Dependências:
- pydantic: Para a criação dos modelos de dados (schemas).
- app.schemas.user: Para aninhar informações do usuário em respostas relacionadas.
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from .user import UserOut
from datetime import datetime

# --- Schemas para EquipmentType (Tipo de Equipamento) ---

class EquipmentTypeBase(BaseModel):
    """Schema base para tipos de equipamento, com os campos essenciais."""
    name: str
    category: str
    description: Optional[str] = None

class EquipmentTypeCreate(EquipmentTypeBase):
    """Schema usado para criar um novo tipo de equipamento. Herda de Base."""
    pass

class EquipmentTypeUpdate(BaseModel):
    """
    Schema para atualizar um tipo de equipamento existente.
    Todos os campos são opcionais, permitindo atualizações parciais.
    """
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

class EquipmentTypeOut(EquipmentTypeBase):
    """Schema de saída para um tipo de equipamento, incluindo o ID."""
    id: int
    
    # Configuração para mapear o modelo SQLAlchemy para este schema Pydantic.
    model_config = ConfigDict(from_attributes=True)

class EquipmentTypeStatsOut(EquipmentTypeOut):
    """
    Schema de saída que estende EquipmentTypeOut para incluir estatísticas
    sobre as unidades associadas.
    """
    total_units: int
    available_units: int
    reserved_units: int
    maintenance_units: int

# --- Schema para Informações Básicas de Reserva (usado em EquipmentUnitOut) ---

class ReservationBasicOut(BaseModel):
    """Schema simplificado para exibir informações de uma reserva ativa em uma unidade."""
    end_time: datetime
    user: UserOut  # Aninha os dados do usuário que fez a reserva.
    
    model_config = ConfigDict(from_attributes=True)


# --- Schemas para EquipmentUnit (Unidade do Equipamento) ---

class EquipmentUnitBase(BaseModel):
    """Schema base para unidades de equipamento."""
    identifier_code: str
    serial_number: str
    status: str = 'available'

class EquipmentUnitCreate(EquipmentUnitBase):
    """Schema para criar uma ou mais unidades de equipamento."""
    type_id: int  # ID do tipo de equipamento ao qual a unidade pertence.
    quantity: int = Field(1, description="Número de unidades a criar. Deve ser 1 se um número de série for fornecido.")

class EquipmentUnitUpdate(BaseModel):
    """Schema para atualizar uma unidade de equipamento. Todos os campos são opcionais."""
    identifier_code: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None

class EquipmentUnitOut(EquipmentUnitBase):
    """
    Schema de saída completo para uma unidade de equipamento.
    Inclui detalhes do tipo de equipamento e da reserva ativa, se houver.
    """
    id: int
    type_id: int
    equipment_type: EquipmentTypeOut  # Aninha os dados do tipo de equipamento.
    active_reservation: Optional[ReservationBasicOut] = None # Campo para a reserva ativa.
    
    model_config = ConfigDict(from_attributes=True)

# --- Schema de Saída Completo para EquipmentType com suas Unidades ---

class EquipmentTypeWithUnitsOut(EquipmentTypeOut):
    """
    Schema de saída que retorna um tipo de equipamento junto com uma lista
    completa de todas as suas unidades associadas.
    """
    units: List[EquipmentUnitOut] = []