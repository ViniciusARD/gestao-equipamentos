# app/models/equipment_unit.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EquipmentUnit(Base):
    __tablename__ = 'equipment_units'

    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey('equipment_types.id'), nullable=False)
    identifier_code = Column(String(50), unique=True, nullable=True)
    status = Column(String(20), nullable=False, default='available')

    # Relacionamento para acessar o tipo a partir de uma unidade
    equipment_type = relationship("EquipmentType", back_populates="units")