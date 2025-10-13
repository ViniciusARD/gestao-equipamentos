# app/models/user.py

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False, default='user')
    
    sector_id = Column(Integer, ForeignKey('sectors.id'), nullable=True)

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    otp_secret = Column(String(32), nullable=True)
    otp_enabled = Column(Boolean, default=False)

    terms_accepted = Column(Boolean, default=False, nullable=False)
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    # NOVO CAMPO
    login_attempts = Column(Integer, default=0, nullable=False)

    # --- RELACIONAMENTOS ---
    sector = relationship("Sector", back_populates="users")
    reservations = relationship("Reservation", back_populates="user", cascade="all, delete-orphan")