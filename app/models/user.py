# app/models/user.py

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship # Importar relationship
from app.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False, default='user')

    # Adiciona o relacionamento inverso para reservas e configura a deleção em cascata
    reservations = relationship("Reservation", back_populates="user", cascade="all, delete-orphan")