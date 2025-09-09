# app/models/reservation.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Reservation(Base):
    __tablename__ = 'reservations'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    unit_id = Column(Integer, ForeignKey('equipment_units.id'), nullable=False)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), nullable=False, default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Adiciona o back_populates para consistência
    user = relationship("User", back_populates="reservations")
    equipment_unit = relationship("EquipmentUnit", back_populates="reservations")