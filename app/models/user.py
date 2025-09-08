from sqlalchemy import Column, Integer, String
from app.database import Base  # Importa a Base do nosso novo arquivo de database

class User(Base):  # A classe agora herda de Base
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False, default='user')
