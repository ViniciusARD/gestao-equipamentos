# app/schemas/reservation.py

from pydantic import BaseModel
from datetime import datetime

# Importamos os schemas de output para que possamos mostrar os detalhes do usuário
# e do equipamento quando uma reserva for retornada pela API.
from .user import UserOut
from .equipment import EquipmentUnitOut

# Define a estrutura base para uma reserva, com os campos que chegam na API.
class ReservationBase(BaseModel):
    unit_id: int
    start_time: datetime
    end_time: datetime

# Schema usado especificamente para a criação de uma reserva. Herda da base.
class ReservationCreate(ReservationBase):
    pass

# Schema usado para a resposta da API (output).
# Ele inclui todos os campos do banco de dados e os objetos aninhados.
class ReservationOut(ReservationBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    
    # Estes campos serão preenchidos automaticamente pelo SQLAlchemy
    # graças à configuração "from_attributes = True"
    user: UserOut
    equipment_unit: EquipmentUnitOut

    class Config:
        from_attributes = True