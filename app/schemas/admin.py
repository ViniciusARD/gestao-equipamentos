# app/schemas/admin.py

from pydantic import BaseModel
from enum import Enum

# --- Schemas para Reservas ---

class ReservationStatusEnum(str, Enum):
    approved = "approved"
    rejected = "rejected"
    returned = "returned"

class ReservationStatusUpdate(BaseModel):
    status: ReservationStatusEnum

# --- Schemas para Gerenciamento de Usuários ---

class UserRoleEnum(str, Enum):
    user = "user"
    admin = "admin"

class UserRoleUpdate(BaseModel):
    role: UserRoleEnum