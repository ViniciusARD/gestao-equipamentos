# tests/conftest.py

"""
Arquivo de configuração do Pytest (Versão FINAL com correção de lógica)

Esta versão corrige a fixture 'test_user' para incluir 'terms_accepted=True',
resolvendo os erros 403 Forbidden no login.
"""

# --- Importações Padrão ---
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# --- A ABORDAGEM "DIFERENTE": USAR UM ARQUIVO DE BD ---
TEST_DB_FILE = "./test.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"


# --- ORDEM DE IMPORTAÇÃO CRÍTICA (Mantendo a melhor prática) ---

# 1. Importe a 'Base' e 'get_db' PRIMEIRO
from app.database import Base, get_db

# 2. Importe TODOS os seus modelos.
from app.models.user import User
from app.models.sector import Sector
from app.models.reservation import Reservation
from app.models.google_token import GoogleOAuthToken
from app.models.activity_log import ActivityLog
from app.models.token_blacklist import TokenBlacklist
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.unit_history import UnitHistory

# 3. Importe dependências para fixtures
from app.security import get_password_hash


# --- Configuração do Banco de Dados de Teste (com arquivo) ---

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Fixture do Pytest para criar e limpar o banco de dados em ARQUIVO
    para CADA teste. 'scope="function"' é a chave aqui.
    """
    # Garante que não haja um .db antigo de um teste que falhou
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except PermissionError:
            # Se falhar aqui, o engine.dispose() abaixo deve resolver
            # para o próximo teste
            pass

    # Cria todas as tabelas no arquivo ./test.db
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        # "yield" é o que será injetado no teste
        yield db
    finally:
        # Limpa e fecha a sessão
        db.close()
        # Destrói todas as tabelas
        Base.metadata.drop_all(bind=engine)
        
        # Força o engine a soltar todas as conexões
        # para que o Windows (WinError 32) libere o lock do 'test.db'
        engine.dispose() 
        
        # Remove o arquivo de banco de dados
        if os.path.exists(TEST_DB_FILE):
            os.remove(TEST_DB_FILE)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Fixture para criar um "TestClient".
    
    Importamos o 'app' AQUI, dentro da fixture.
    """
    
    # 4. Importe 'app' (de main) por ÚLTIMO e DENTRO da fixture.
    from main import app

    def override_get_db():
        """Substitui o 'get_db' real pelo 'db_session' do teste."""
        yield db_session

    # Aplica a substituição
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    # Limpa os overrides
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session: Session) -> User:
    """
    Fixture para criar um usuário padrão.
    Agora inclui 'terms_accepted=True'.
    """
    user = User(
        username="Test User",
        email="test@example.com",
        password_hash=get_password_hash("ValidPassword123!"),
        role="user",
        is_active=True,
        is_verified=True,
        terms_accepted=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user