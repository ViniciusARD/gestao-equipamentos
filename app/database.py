# app/database.py

"""
Módulo de Configuração do Banco de Dados

Este módulo configura a conexão com o banco de dados e fornece utilitários
para interagir com ele através do SQLAlchemy ORM.

Principais componentes:
- `engine`: O "motor" de conexão do SQLAlchemy, configurado com a URL do banco de dados.
- `SessionLocal`: Uma fábrica para criar novas sessões de banco de dados.
- `Base`: Uma classe base declarativa da qual todos os modelos de dados (tabelas) herdarão.
- `get_db`: Uma função de dependência do FastAPI para injetar uma sessão de banco de dados em rotas.

Dependências:
- sqlalchemy: A biblioteca ORM para Python.
- app.config: Para obter a string de conexão do banco de dados (DATABASE_URL).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.config import settings

# Cria a URL de conexão a partir das configurações carregadas do arquivo .env
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Cria o "motor" (engine) do SQLAlchemy. A engine é o ponto central de comunicação
# com o banco de dados e gerencia um pool de conexões para otimizar o desempenho.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cria uma fábrica de sessões (SessionLocal). Cada instância de SessionLocal
# representará uma "conversa" individual com o banco de dados.
# autocommit=False e autoflush=False são configurações padrão para ter mais controle
# sobre as transações de banco de dados.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Cria uma classe Base para os nossos modelos ORM. Todos os modelos que representam
# tabelas no banco de dados deverão herdar desta classe.
Base = declarative_base()

# Função geradora de dependência para o FastAPI.
def get_db():
    """
    Função geradora de dependência para o FastAPI.

    Esta função cria uma nova sessão de banco de dados (`db`) para cada requisição,
    disponibiliza essa sessão para a rota que a solicitou (usando `yield`),
    e garante que a sessão seja fechada (`db.close()`) ao final da requisição.

    O bloco try...finally garante que a sessão seja fechada mesmo que ocorram
    erros durante o processamento da requisição, liberando a conexão.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()