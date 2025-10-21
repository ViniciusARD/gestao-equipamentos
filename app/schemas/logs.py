# app/schemas/logs.py

"""
Define o schema Pydantic para a serialização dos dados de Log de Atividade.

Este módulo contém o schema de saída (output) para os registros de log
da aplicação, garantindo uma estrutura consistente para as respostas da API.

Dependências:
- pydantic: Para a criação do modelo de dados (schema).
- datetime, typing: Para a correta tipagem dos campos.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ActivityLogOut(BaseModel):
    """
    Schema de saída para um registro de log de atividade.
    """
    id: int
    user_id: Optional[int]  # O ID do usuário pode ser nulo para logs do sistema
    level: str              # Nível do log (ex: INFO, WARNING, ERROR)
    message: str            # Mensagem descritiva do log
    created_at: datetime    # Data e hora em que o log foi criado

    class Config:
        """
        Configuração do Pydantic que permite mapear automaticamente os atributos
        de um objeto ORM (SQLAlchemy) para os campos deste schema.
        """
        from_attributes = True