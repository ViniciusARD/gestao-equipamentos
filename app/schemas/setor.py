# app/schemas/setor.py

from pydantic import BaseModel
from typing import Optional

class SetorBase(BaseModel):
    name: str

class SetorCreate(SetorBase):
    pass

class SetorUpdate(BaseModel):
    name: Optional[str] = None

class SetorOut(SetorBase):
    id: int

    class Config:
        from_attributes = True