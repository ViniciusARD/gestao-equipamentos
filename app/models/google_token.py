# app/models/google_token.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'google_oauth_tokens'.

Esta tabela armazena os tokens de autorização OAuth2 para a integração
com a API do Google, permitindo, por exemplo, a criação de eventos no
Google Calendar.

Dependências:
- sqlalchemy: Para a definição do modelo, colunas e relacionamentos.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class GoogleOAuthToken(Base):
    """
    Armazena o token OAuth2 (em formato JSON) de um usuário específico.

    Este token é usado para autenticar requisições à API do Google em nome do usuário.
    """
    __tablename__ = 'google_oauth_tokens'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    
    # Chave estrangeira que conecta o token ao usuário. Deve ser única,
    # garantindo que cada usuário tenha apenas um token armazenado.
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    
    # Armazena o token de credenciais completo, em formato JSON.
    # Inclui o access_token, refresh_token, scopes, etc.
    token_json = Column(Text, nullable=False)

    # --- Relacionamentos ORM ---
    # Define o relacionamento com a tabela 'users'.
    # 'back_populates' cria a referência bidirecional, ligando este relacionamento
    # ao atributo 'google_token' no modelo User.
    user = relationship("User", back_populates="google_token")