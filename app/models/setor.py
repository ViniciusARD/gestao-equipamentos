# app/models/setor.py

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Setor(Base):
    __tablename__ = 'setores'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)

    users = relationship("User", back_populates="setor")