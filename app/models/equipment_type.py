# app/models/equipment_type.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'equipment_types'.

Esta tabela representa a categoria ou o "modelo" de um equipamento
(ex: "Projetor Epson", "Notebook Dell Vostro"), em oposição a uma
unidade física individual.

Dependências:
- sqlalchemy: Para a definição do modelo, colunas e relacionamentos.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base

class EquipmentType(Base):
    """
    Representa um tipo de equipamento, como "Projetor Epson" ou "Notebook Dell".

    Agrupa características comuns a várias unidades físicas.
    """
    __tablename__ = 'equipment_types'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    
    # Nome do tipo de equipamento (ex: "MacBook Pro 14\" (M3 Pro)"). Deve ser único.
    name = Column(String(100), nullable=False, unique=True)
    
    # Categoria geral do equipamento (ex: "Notebook", "Audiovisual").
    category = Column(String(50), nullable=False)
    
    # Descrição detalhada do tipo de equipamento.
    description = Column(Text, nullable=True)

    # --- Relacionamentos ORM ---
    # Define o relacionamento um-para-muitos com a tabela 'equipment_units'.
    # Um tipo de equipamento pode ter várias unidades físicas.
    # 'back_populates' cria a referência bidirecional com o modelo EquipmentUnit.
    units = relationship("EquipmentUnit", back_populates="equipment_type")