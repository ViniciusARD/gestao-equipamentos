# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.config import settings

# Cria a URL de conexão a partir das configurações
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Cria o "motor" (engine) do SQLAlchemy
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cria uma fábrica de sessões (SessionLocal)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Cria uma classe Base para os nossos modelos ORM
Base = declarative_base()

# Função para obter uma sessão do banco de dados (será usada com Injeção de Dependência)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()