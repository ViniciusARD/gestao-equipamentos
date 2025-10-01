# app/schemas/unit_history.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Importar UserOut para exibir detalhes do usuário no histórico
from .user import UserOut

class UnitHistoryOut(BaseModel):
    id: int
    unit_id: int
    event_type: str
    notes: Optional[str] = None
    created_at: datetime
    user_id: Optional[int] = None
    reservation_id: Optional[int] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True