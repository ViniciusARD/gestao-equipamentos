# app/models/unit_history.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'unit_history'.

Esta tabela registra o histórico de eventos de uma unidade de equipamento
específica, como sua criação, devolução ou envio para manutenção.

Dependências:
- sqlalchemy: Para a definição do modelo, colunas e relacionamentos.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class UnitHistory(Base):
    """
    Representa um evento no histórico de uma unidade de equipamento.
    """
    __tablename__ = 'unit_history'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    
    # Chave estrangeira que conecta o evento à unidade de equipamento específica.
    unit_id = Column(Integer, ForeignKey('equipment_units.id'), nullable=False)
    
    # Tipo do evento (ex: 'created', 'returned_ok', 'sent_to_maintenance').
    event_type = Column(String(50), nullable=False)
    
    # Observações adicionais sobre o evento (ex: descrição de um defeito).
    notes = Column(Text, nullable=True)
    
    # Data e hora em que o evento foi registrado.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # ID do gerente ou administrador que registrou o evento (pode ser nulo).
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # ID da reserva associada ao evento, se aplicável (ex: na devolução).
    reservation_id = Column(Integer, ForeignKey('reservations.id'), nullable=True)

    # --- Relacionamentos ORM ---
    # Relacionamento com a unidade de equipamento.
    unit = relationship("EquipmentUnit", back_populates="history")
    
    # Relacionamento com o usuário (gerente/admin) que registrou o evento.
    user = relationship("User")