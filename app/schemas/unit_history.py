# app/schemas/unit_history.py

"""
Define o schema Pydantic para a serialização dos dados de Histórico de Unidade.

Este módulo contém o schema de saída (output) para os eventos de histórico
de uma unidade de equipamento, formatando a resposta da API para ser
consumida pelo frontend.

Dependências:
- pydantic: Para a criação do modelo de dados (schema).
- app.schemas.user.UserOut: Para aninhar os dados do usuário na resposta.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Importar UserOut para exibir detalhes do usuário no histórico
from .user import UserOut

class UnitHistoryOut(BaseModel):
    """
    Schema de saída para um evento de histórico de uma unidade de equipamento.
    """
    id: int
    unit_id: int
    event_type: str                  # O tipo de evento (ex: 'created', 'returned_ok')
    notes: Optional[str] = None      # Observações sobre o evento
    created_at: datetime             # Data e hora do evento
    user_id: Optional[int] = None    # ID do usuário que registrou o evento
    reservation_id: Optional[int] = None # ID da reserva associada (se houver)
    
    # Aninha os dados do usuário que registrou o evento para uma resposta mais completa.
    user: Optional[UserOut] = None

    class Config:
        """
        Configuração do Pydantic que permite mapear automaticamente os atributos
        de um objeto ORM (SQLAlchemy) para os campos deste schema.
        """
        from_attributes = True