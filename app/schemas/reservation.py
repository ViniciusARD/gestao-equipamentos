# app/schemas/reservation.py

"""
Define os schemas Pydantic para validação e serialização de dados de Reserva.

Este módulo contém as classes que definem a forma dos dados para a criação
de uma reserva (entrada) e para a sua exibição (saída), garantindo a
validação e a estruturação correta das informações enviadas pela API.

Dependências:
- pydantic: Para a criação dos modelos de dados (schemas).
- app.schemas.user.UserOut: Para aninhar os dados do usuário na resposta.
- app.schemas.equipment.EquipmentUnitOut: Para aninhar os dados da unidade na resposta.
"""

from pydantic import BaseModel
from datetime import datetime

# Importamos os schemas de output para que possamos mostrar os detalhes do usuário
# e do equipamento quando uma reserva for retornada pela API.
from .user import UserOut
from .equipment import EquipmentUnitOut

class ReservationBase(BaseModel):
    """
    Schema base para uma reserva, com os campos essenciais recebidos na API.
    """
    unit_id: int       # ID da unidade de equipamento a ser reservada.
    start_time: datetime # Data e hora de início da reserva.
    end_time: datetime   # Data e hora de término da reserva.

class ReservationCreate(ReservationBase):
    """
    Schema usado especificamente para a criação de uma nova reserva.
    Atualmente, herda todos os campos da classe base sem adicionar novos.
    """
    pass

class ReservationOut(ReservationBase):
    """
    Schema usado para a resposta da API (output) ao retornar dados de uma reserva.
    
    Ele inclui todos os campos do banco de dados e os objetos aninhados
    para fornecer uma resposta completa e contextualizada.
    """
    id: int
    user_id: int
    status: str
    created_at: datetime
    
    # --- Campos de Relacionamento Aninhados ---
    # Estes campos serão preenchidos automaticamente pelo SQLAlchemy
    # graças à configuração "from_attributes = True" abaixo.
    user: UserOut                # Objeto completo do usuário que fez a reserva.
    equipment_unit: EquipmentUnitOut # Objeto completo da unidade de equipamento reservada.

    class Config:
        """
        Configuração do Pydantic que permite mapear automaticamente os atributos
        de um objeto ORM (SQLAlchemy) para os campos deste schema.
        """
        from_attributes = True