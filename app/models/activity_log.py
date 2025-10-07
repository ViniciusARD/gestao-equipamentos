# app/models/activity_log.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.database import Base

class ActivityLog(Base):
    __tablename__ = 'activity_logs'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    level = Column(String(10), nullable=False) # INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())