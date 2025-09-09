# app/models/token_blacklist.py

from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class TokenBlacklist(Base):
    __tablename__ = 'token_blacklist'

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(36), nullable=False, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)