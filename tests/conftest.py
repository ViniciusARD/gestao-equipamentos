# tests/conftest.py

"""
Arquivo de Configuração do Pytest (conftest.py)

Este arquivo define fixtures reutilizáveis que são injetadas automaticamente
pelo Pytest nos módulos de teste. Ele é essencial para configurar o ambiente
de teste, como o banco de dados e o cliente da aplicação.

Principais Fixtures:
- db_session: Cria um banco de dados de teste limpo (em arquivo) para cada
  função de teste, garantindo o isolamento.
- client: Fornece um 'TestClient' do FastAPI que usa o banco de dados de teste.
- Vários usuários (test_user, test_requester_user, test_manager_user, test_admin_user):
  Cria usuários com diferentes perfis.
- Cabeçalhos de Autenticação (auth_headers, requester_auth_headers, etc.):
  Fornecem headers de login para os diferentes usuários.
- Entidades de teste (test_sector, test_equipment_type, etc.):
  Cria dados base para os testes de rotas.
"""

# --- Importações Padrão ---
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from datetime import datetime, timedelta, timezone

# --- Configuração do Banco de Dados de Teste ---
TEST_DB_FILE = "./test.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

# --- Ordem de Importação Crítica ---

# 1. Importa a 'Base' e 'get_db' da aplicação principal.
from app.database import Base, get_db

# 2. Importa TODOS os modelos ORM para que a 'Base.metadata' os conheça.
from app.models.user import User
from app.models.sector import Sector
from app.models.reservation import Reservation
from app.models.google_token import GoogleOAuthToken
from app.models.activity_log import ActivityLog
from app.models.token_blacklist import TokenBlacklist
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.unit_history import UnitHistory

# 3. Importa dependências necessárias para as fixtures.
from app.security import get_password_hash
from main import app # Importa a app principal

# --- Configuração do Engine e Sessão de Teste ---
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Fixture do Pytest para criar e limpar o banco de dados para CADA teste.
    Garante o isolamento total entre os testes.
    """
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except PermissionError:
            pass

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose() 
        if os.path.exists(TEST_DB_FILE):
            os.remove(TEST_DB_FILE)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Fixture do Pytest para criar um 'TestClient' do FastAPI.
    
    Substitui a dependência 'get_db' da aplicação para usar 
    a sessão de banco de dados de teste (db_session).
    """
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c 
    
    app.dependency_overrides.clear()

# --- Fixtures de Entidades Base ---

@pytest.fixture(scope="function")
def test_sector(db_session: Session) -> Sector:
    """Cria um setor 'TI' padrão para os testes."""
    sector = Sector(name="TI")
    db_session.add(sector)
    db_session.commit()
    db_session.refresh(sector)
    return sector

# --- Fixtures de Usuários e Autenticação ---

@pytest.fixture(scope="function")
def test_user(db_session: Session, test_sector: Sector) -> User:
    """Fixture que cria um usuário padrão (role='user') no banco de teste."""
    user = User(
        username="Test User",
        email="test@example.com",
        password_hash=get_password_hash("ValidPassword123!"),
        role="user",
        is_active=True,
        is_verified=True,
        terms_accepted=True,
        sector_id=test_sector.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_requester_user(db_session: Session, test_sector: Sector) -> User:
    """Cria um usuário com permissão de 'requester'."""
    user = User(
        username="Test Requester",
        email="requester@example.com",
        password_hash=get_password_hash("ValidPassword123!"),
        role="requester",
        is_active=True,
        is_verified=True,
        terms_accepted=True,
        sector_id=test_sector.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_manager_user(db_session: Session, test_sector: Sector) -> User:
    """Cria um usuário com permissão de 'manager'."""
    user = User(
        username="Test Manager",
        email="manager@example.com",
        password_hash=get_password_hash("ValidPassword123!"),
        role="manager",
        is_active=True,
        is_verified=True,
        terms_accepted=True,
        sector_id=test_sector.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_admin_user(db_session: Session, test_sector: Sector) -> User:
    """Cria um usuário com permissão de 'admin'."""
    user = User(
        username="Test Admin",
        email="admin@example.com",
        password_hash=get_password_hash("ValidPassword123!"),
        role="admin",
        is_active=True,
        is_verified=True,
        terms_accepted=True,
        sector_id=test_sector.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

# --- Fixtures de Cabeçalhos de Autenticação ---

def _get_auth_headers(client: TestClient, email: str, password: str) -> dict:
    """Função auxiliar interna para logar e retornar headers."""
    login_response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200, f"Falha no login para {email}"
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture(scope="function")
def auth_headers(client: TestClient, test_user: User) -> dict:
    """Retorna cabeçalhos de autorização para o 'test_user' padrão."""
    return _get_auth_headers(client, "test@example.com", "ValidPassword123!")

@pytest.fixture(scope="function")
def requester_auth_headers(client: TestClient, test_requester_user: User) -> dict:
    """Retorna cabeçalhos de autorização para o 'test_requester_user'."""
    return _get_auth_headers(client, "requester@example.com", "ValidPassword123!")

@pytest.fixture(scope="function")
def manager_auth_headers(client: TestClient, test_manager_user: User) -> dict:
    """Retorna cabeçalhos de autorização para o 'test_manager_user'."""
    return _get_auth_headers(client, "manager@example.com", "ValidPassword123!")

@pytest.fixture(scope="function")
def admin_auth_headers(client: TestClient, test_admin_user: User) -> dict:
    """Retorna cabeçalhos de autorização para o 'test_admin_user'."""
    return _get_auth_headers(client, "admin@example.com", "ValidPassword123!")

# --- Fixtures de Equipamentos e Reservas ---

@pytest.fixture(scope="function")
def test_equipment_type(db_session: Session) -> EquipmentType:
    """Cria um 'Tipo de Equipamento' (ex: Notebook) padrão."""
    eq_type = EquipmentType(
        name="Notebook Teste",
        category="Notebook",
        description="Equipamento para testes"
    )
    db_session.add(eq_type)
    db_session.commit()
    db_session.refresh(eq_type)
    return eq_type

@pytest.fixture(scope="function")
def test_equipment_unit(db_session: Session, test_equipment_type: EquipmentType) -> EquipmentUnit:
    """Cria uma 'Unidade de Equipamento' (ex: Notebook #001) padrão e disponível."""
    unit = EquipmentUnit(
        type_id=test_equipment_type.id,
        identifier_code="NTB-TEST-001",
        serial_number="SN-TEST-001",
        status="available"
    )
    db_session.add(unit)
    db_session.commit()
    db_session.refresh(unit)
    return unit

@pytest.fixture(scope="function")
def test_pending_reservation(db_session: Session, test_requester_user: User, test_equipment_unit: EquipmentUnit) -> Reservation:
    """Cria uma reserva com status 'pending' para testes de aprovação/rejeição."""
    res = Reservation(
        user_id=test_requester_user.id,
        unit_id=test_equipment_unit.id,
        start_time=datetime.now(timezone.utc) + timedelta(days=1),
        end_time=datetime.now(timezone.utc) + timedelta(days=2),
        status="pending"
    )
    test_equipment_unit.status = "pending" # Marca a unidade como pendente
    db_session.add(res)
    db_session.commit()
    db_session.refresh(res)
    return res

@pytest.fixture(scope="function")
def test_approved_reservation(db_session: Session, test_requester_user: User, test_equipment_unit: EquipmentUnit) -> Reservation:
    """Cria uma reserva com status 'approved' para testes (ex: falha ao deletar usuário)."""
    res = Reservation(
        user_id=test_requester_user.id,
        unit_id=test_equipment_unit.id,
        start_time=datetime.now(timezone.utc) + timedelta(days=1),
        end_time=datetime.now(timezone.utc) + timedelta(days=2),
        status="approved"
    )
    test_equipment_unit.status = "reserved" # Marca a unidade como reservada
    db_session.add(res)
    db_session.commit()
    db_session.refresh(res)
    return res