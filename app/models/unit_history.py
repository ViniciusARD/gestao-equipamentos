# app/models/unit_history.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class UnitHistory(Base):
    __tablename__ = 'unit_history'

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey('equipment_units.id'), nullable=False)
    event_type = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    reservation_id = Column(Integer, ForeignKey('reservations.id'), nullable=True)

    # Relacionamentos
    unit = relationship("EquipmentUnit", back_populates="history")
    user = relationship("User")