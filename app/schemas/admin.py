# app/schemas/admin.py

from pydantic import BaseModel
from enum import Enum
from typing import Optional

# --- Schemas para Reservas ---

class ReservationStatusEnum(str, Enum):
    approved = "approved"
    rejected = "rejected"
    returned = "returned"

class ReservationStatusUpdate(BaseModel):
    status: ReservationStatusEnum
    # <<-- NOVOS CAMPOS -->>
    return_status: Optional[str] = None # 'ok' or 'maintenance'
    return_notes: Optional[str] = None


# --- Schemas para Gerenciamento de Usuários ---

class UserRoleEnum(str, Enum):
    user = "user"
    requester = "requester"
    manager = "manager"
    admin = "admin"

class UserRoleUpdate(BaseModel):
    role: UserRoleEnum

# --- NOVO SCHEMA ---
class UserSectorUpdate(BaseModel):
    setor_id: Optional[int] = None