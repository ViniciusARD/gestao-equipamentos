# app/schemas/dashboard.py

from pydantic import BaseModel
from typing import List

class StatsItem(BaseModel):
    name: str
    count: int

class DashboardStats(BaseModel):
    top_equipments: List[StatsItem]
    top_sectors: List[StatsItem]
    top_users: List[StatsItem]
    reservation_status_counts: List[StatsItem]