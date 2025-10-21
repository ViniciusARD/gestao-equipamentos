# app/schemas/sector.py

"""
Define os schemas Pydantic para validação e serialização de dados de Setor.

Este módulo contém as classes que definem a forma dos dados para a criação,
atualização e exibição de setores.

Dependências:
- pydantic: Para a criação dos modelos de dados (schemas).
- typing: Para a definição de campos opcionais.
"""

from pydantic import BaseModel
from typing import Optional

class SectorBase(BaseModel):
    """Schema base para um setor, contendo o campo essencial."""
    name: str

class SectorCreate(SectorBase):
    """
    Schema usado para criar um novo setor.
    Herda o campo 'name' da classe base.
    """
    pass

class SectorUpdate(BaseModel):
    """
    Schema para atualizar um setor existente.
    O campo 'name' é opcional para permitir atualizações parciais (patch).
    """
    name: Optional[str] = None

class SectorOut(SectorBase):
    """
    Schema de saída para um setor, usado nas respostas da API.
    Inclui o 'id' do setor, além do 'name'.
    """
    id: int

    class Config:
        """
        Configuração do Pydantic que permite mapear automaticamente os atributos
        de um objeto ORM (SQLAlchemy) para os campos deste schema.
        """
        from_attributes = True