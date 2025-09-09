# app/schemas/logs.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ActivityLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    level: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True