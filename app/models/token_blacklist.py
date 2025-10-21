# app/models/token_blacklist.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'token_blacklist'.

Esta tabela é usada para invalidar tokens JWT antes de sua expiração (logout).
Quando um usuário faz logout, o JTI (JWT ID) do seu token é adicionado aqui.

Dependências:
- sqlalchemy: Para a definição do modelo e suas colunas.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class TokenBlacklist(Base):
    """
    Representa um token JWT que foi revogado (colocado na lista negra).
    """
    __tablename__ = 'token_blacklist'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    
    # Armazena o 'JWT ID' (jti), um identificador único para cada token JWT.
    # Deve ser único para garantir que cada token possa ser invalidado individualmente.
    jti = Column(String(36), nullable=False, unique=True)
    
    # Armazena a data e hora em que o token originalmente expiraria.
    # Isso permite que uma tarefa de limpeza possa remover periodicamente os tokens
    # já expirados da blacklist, mantendo a tabela otimizada.
    expires_at = Column(DateTime(timezone=True), nullable=False)