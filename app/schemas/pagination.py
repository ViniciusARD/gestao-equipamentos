# app/schemas/pagination.py

"""
Define um schema Pydantic genérico para respostas paginadas.

Este módulo fornece uma estrutura padronizada para endpoints que retornam
listas de dados, incluindo metadados essenciais para a construção de
controles de paginação no frontend.

Dependências:
- pydantic: Para a criação do modelo de dados (schema).
- typing: Para a utilização de tipos genéricos que tornam o schema reutilizável.
"""

from pydantic import BaseModel, Field
from typing import List, TypeVar, Generic

# Cria um "Type Variable" genérico. Isso permite que a classe Page possa
# conter uma lista de qualquer tipo de schema (ex: Page[UserOut], Page[EquipmentOut]).
T = TypeVar('T')

class Page(BaseModel, Generic[T]):
    """
    Schema genérico para respostas paginadas da API.
    """
    # Uma lista contendo os itens da página atual. O tipo dos itens é definido por T.
    items: List[T] = Field(description="Lista de itens para a página atual")
    
    # O número total de itens existentes no banco de dados para a consulta realizada.
    total: int = Field(description="Total de itens")
    
    # O número da página atual que está sendo retornada.
    page: int = Field(description="Número da página atual")
    
    # O número de itens por página solicitado na requisição.
    size: int = Field(description="Número de itens por página")
    
    # O número total de páginas disponíveis, calculado com base no total de itens e no tamanho da página.
    pages: int = Field(description="Total de páginas")