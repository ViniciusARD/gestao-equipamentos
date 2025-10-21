# app/models/sector.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'sectors'.

Esta tabela armazena os setores ou departamentos da instituição,
permitindo agrupar os usuários.

Dependências:
- sqlalchemy: Para a definição do modelo, colunas e relacionamentos.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Sector(Base):
    """
    Representa um setor dentro da instituição (ex: "Tecnologia da Informação").

    Cada atributo da classe mapeia para uma coluna na tabela 'sectors'.
    """
    __tablename__ = 'sectors'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    
    # Nome do setor. Deve ser único e é indexado para otimizar buscas.
    name = Column(String(100), nullable=False, unique=True, index=True)

    # --- Relacionamentos ORM ---
    # Define o relacionamento um-para-muitos com a tabela 'users'.
    # Um setor pode ter muitos usuários.
    # 'back_populates' cria a referência bidirecional, ligando este relacionamento
    # ao atributo 'sector' no modelo User.
    users = relationship("User", back_populates="sector")