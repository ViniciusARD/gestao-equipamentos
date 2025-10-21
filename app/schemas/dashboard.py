# app/schemas/dashboard.py

"""
Define os schemas Pydantic para a resposta do painel de análise (Dashboard).

Este módulo estrutura os dados de saída para o endpoint de estatísticas,
garantindo um formato consistente e validado para ser consumido pelo frontend.

Dependências:
- pydantic: Para a criação dos modelos de dados (schemas).
- typing: Para a definição de listas de tipos específicos.
"""

from pydantic import BaseModel
from typing import List

class StatsItem(BaseModel):
    """
    Schema genérico para um item em uma lista de estatísticas ou ranking.
    Ex: um equipamento popular, com seu nome e a contagem de reservas.
    """
    name: str
    count: int

class DashboardStats(BaseModel):
    """
    Schema principal que define a estrutura completa da resposta do endpoint
    de estatísticas do dashboard.
    """
    # --- KPIs (Key Performance Indicators) Gerais ---
    total_users: int
    total_equipments: int
    total_reservations: int
    
    # --- Rankings (Top 5) ---
    top_equipments: List[StatsItem]
    top_sectors: List[StatsItem]
    top_users: List[StatsItem]
    
    # --- Distribuições ---
    reservation_status_counts: List[StatsItem]
    reservations_by_day: List[StatsItem]