# app/schemas/pagination.py

from pydantic import BaseModel, Field
from typing import List, TypeVar, Generic

T = TypeVar('T')

class Page(BaseModel, Generic[T]):
    """Schema para respostas paginadas."""
    items: List[T] = Field(description="Lista de itens para a página atual")
    total: int = Field(description="Total de itens")
    page: int = Field(description="Número da página atual")
    size: int = Field(description="Número de itens por página")
    pages: int = Field(description="Total de páginas")