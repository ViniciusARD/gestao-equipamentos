# app/models/google_token.py

from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class GoogleOAuthToken(Base):
    __tablename__ = 'google_oauth_tokens'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    token_json = Column(Text, nullable=False)

    user = relationship("User", back_populates="google_token")