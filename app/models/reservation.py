# app/models/reservation.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'reservations'.

Esta é uma tabela central que registra todas as solicitações de reserva,
ligando um usuário a uma unidade de equipamento por um período específico.

Dependências:
- sqlalchemy: Para a definição do modelo, colunas e relacionamentos.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Reservation(Base):
    """
    Representa uma reserva de uma unidade de equipamento por um usuário
    para um período específico.
    """
    __tablename__ = 'reservations'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    
    # Chave estrangeira que conecta a reserva ao usuário que a solicitou.
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Chave estrangeira que conecta a reserva à unidade física do equipamento.
    unit_id = Column(Integer, ForeignKey('equipment_units.id'), nullable=False)
    
    start_time = Column(DateTime(timezone=True), nullable=False) # Data e hora de início da reserva
    end_time = Column(DateTime(timezone=True), nullable=False)   # Data e hora de término da reserva
    
    # Status atual da reserva (ex: 'pending', 'approved', 'rejected', 'returned').
    status = Column(String(20), nullable=False, default='pending')
    
    # Campo para armazenar observações do gerente no momento da devolução.
    return_notes = Column(Text, nullable=True)

    # Data e hora em que a solicitação de reserva foi criada.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relacionamentos ORM ---
    # Define a relação com a tabela 'users', criando a referência inversa no modelo User.
    user = relationship("User", back_populates="reservations")
    
    # Define a relação com a tabela 'equipment_units', criando a referência inversa
    # no modelo EquipmentUnit.
    equipment_unit = relationship("EquipmentUnit", back_populates="reservations")