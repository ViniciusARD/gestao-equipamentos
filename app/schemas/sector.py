# app/schemas/sector.py

from pydantic import BaseModel
from typing import Optional

class SectorBase(BaseModel):
    name: str

class SectorCreate(SectorBase):
    pass

class SectorUpdate(BaseModel):
    name: Optional[str] = None

class SectorOut(SectorBase):
    id: int

    class Config:
        from_attributes = True