# app/models/equipment_unit.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EquipmentUnit(Base):
    __tablename__ = 'equipment_units'

    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey('equipment_types.id'), nullable=False)
    identifier_code = Column(String(50), unique=True, nullable=False)
    serial_number = Column(String(100), unique=True, nullable=False)
    status = Column(String(20), nullable=False, default='available')

    equipment_type = relationship("EquipmentType", back_populates="units")
    # Adiciona o relacionamento inverso e a cascata
    reservations = relationship("Reservation", back_populates="equipment_unit", cascade="all, delete-orphan")
    # <<-- NOVO RELACIONAMENTO -->>
    history = relationship("UnitHistory", back_populates="unit", cascade="all, delete-orphan")