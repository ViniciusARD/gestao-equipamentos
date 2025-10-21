# app/models/equipment_unit.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'equipment_units'.

Esta tabela representa uma unidade física e individual de um equipamento,
sendo o item que é efetivamente emprestado pelos usuários.

Dependências:
- sqlalchemy: Para a definição do modelo, colunas e relacionamentos.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EquipmentUnit(Base):
    """
    Representa um item físico específico no inventário (ex: o notebook com
    o número de série XYZ). É esta unidade que é efetivamente reservada.
    """
    __tablename__ = 'equipment_units'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    
    # Chave estrangeira que conecta a unidade ao seu tipo de equipamento.
    type_id = Column(Integer, ForeignKey('equipment_types.id'), nullable=False)
    
    # Código de identificação único para a unidade (ex: patrimônio, etiqueta).
    identifier_code = Column(String(50), unique=True, nullable=False)
    
    # Número de série do fabricante, que também deve ser único.
    serial_number = Column(String(100), unique=True, nullable=False)
    
    # Status atual da unidade (ex: 'available', 'reserved', 'maintenance').
    status = Column(String(20), nullable=False, default='available')

    # --- Relacionamentos ORM ---
    # Relacionamento muitos-para-um com EquipmentType.
    # 'back_populates' cria a referência bidirecional com o modelo EquipmentType.
    equipment_type = relationship("EquipmentType", back_populates="units")
    
    # Relacionamento um-para-muitos com Reservation.
    # Uma unidade pode ter muitas reservas ao longo do tempo.
    # 'cascade="all, delete-orphan"' garante que se uma unidade for deletada,
    # todas as reservas associadas a ela também sejam.
    reservations = relationship("Reservation", back_populates="equipment_unit", cascade="all, delete-orphan")
    
    # Relacionamento um-para-muitos com UnitHistory.
    # Registra todos os eventos históricos associados a esta unidade.
    # A cascata também se aplica aqui, deletando o histórico se a unidade for removida.
    history = relationship("UnitHistory", back_populates="unit", cascade="all, delete-orphan")