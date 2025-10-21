# app/schemas/dashboard.py

from pydantic import BaseModel
from typing import List

class StatsItem(BaseModel):
    name: str
    count: int

class DashboardStats(BaseModel):
    total_users: int
    total_equipments: int
    total_reservations: int
    top_equipments: List[StatsItem]
    top_sectors: List[StatsItem]
    top_users: List[StatsItem]
    reservation_status_counts: List[StatsItem]
    reservations_by_day: List[StatsItem]