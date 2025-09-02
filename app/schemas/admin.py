# app/schemas/admin.py

from pydantic import BaseModel
from enum import Enum

# --- NOVO: Cria uma classe Enum para os status permitidos ---
# Isto permite que o FastAPI crie um menu dropdown na documentação
class ReservationStatusEnum(str, Enum):
    approved = "approved"
    rejected = "rejected"
    returned = "returned"

# --- Schema atualizado para usar a classe Enum ---
class ReservationStatusUpdate(BaseModel):
    # Agora o status é do tipo da nossa Enum
    status: ReservationStatusEnum