# app/models/equipment_type.py

from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base

class EquipmentType(Base):
    __tablename__ = 'equipment_types'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    # Relacionamento para acessar todas as unidades de um tipo
    units = relationship("EquipmentUnit", back_populates="equipment_type")