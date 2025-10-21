# app/schemas/admin.py

"""
Define os schemas Pydantic para as ações de gerenciamento e administração.

Este módulo contém os modelos de dados para as requisições (inputs) dos
endpoints de administração, como a atualização de status de reservas e o
gerenciamento de permissões e status de usuários.

Dependências:
- pydantic: Para a criação dos modelos de dados (schemas).
- enum: Para definir conjuntos de valores permitidos para campos específicos.
"""

from pydantic import BaseModel
from enum import Enum
from typing import Optional

# --- Schemas para Gerenciamento de Reservas ---

class ReservationStatusEnum(str, Enum):
    """
    Enumeração para os status permitidos ao atualizar uma reserva.
    Isso garante que a API só aceite valores predefinidos.
    """
    approved = "approved"
    rejected = "rejected"
    returned = "returned"

class ReservationStatusUpdate(BaseModel):
    """
    Schema para o corpo da requisição de atualização do status de uma reserva.
    """
    status: ReservationStatusEnum  # O novo status, validado pela enumeração.
    
    # Campos opcionais para o processo de devolução
    return_status: Optional[str] = None # 'ok' ou 'maintenance'
    return_notes: Optional[str] = None  # Observações do gerente sobre a devolução.


# --- Schemas para Gerenciamento de Usuários ---

class UserRoleEnum(str, Enum):
    """
    Enumeração para as permissões (roles) de usuário permitidas.
    """
    user = "user"
    requester = "requester"
    manager = "manager"
    admin = "admin"

class UserRoleUpdate(BaseModel):
    """Schema para o corpo da requisição de atualização da permissão de um usuário."""
    role: UserRoleEnum

class UserSectorUpdate(BaseModel):
    """
    Schema para o corpo da requisição de atualização do setor de um usuário.
    Permite definir um setor ou remover o usuário de qualquer setor (enviando null).
    """
    sector_id: Optional[int] = None

class UserStatusUpdate(BaseModel):
    """Schema para o corpo da requisição de ativação ou desativação de um usuário."""
    is_active: bool