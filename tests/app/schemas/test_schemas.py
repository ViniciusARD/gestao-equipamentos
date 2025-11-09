import pytest
from pydantic import ValidationError
from datetime import datetime, timedelta

# Importa os schemas que queremos testar
from app.schemas.user import UserCreate, UserLogin
from app.schemas.sector import SectorCreate
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.schemas.equipment import EquipmentTypeCreate, EquipmentUnitCreate
from app.schemas.admin import ReservationStatusUpdate, UserRoleUpdate

# --- Testes de Schemas de Usuário (user.py) ---

def test_user_create_valid():
    """Testa a criação de um usuário com dados válidos."""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password123!",
        "password_confirm": "Password123!",
        "sector_id": 1,
        "terms_accepted": True
    }
    user = UserCreate(**user_data)
    assert user.username == "testuser"
    assert user.email == "test@example.com"

def test_user_create_invalid_email():
    """Testa a falha de validação do Pydantic para um e-mail inválido."""
    with pytest.raises(ValidationError, match="valid email address"):
        UserCreate(
            username="bademail",
            email="not-an-email", # Inválido
            password="Password123!",
            password_confirm="Password123!",
            terms_accepted=True
        )

def test_user_login_valid():
    """Testa o schema de login."""
    login_data = {"email": "login@example.com", "password": "mypassword"}
    login = UserLogin(**login_data)
    assert login.email == "login@example.com"


# --- Testes de Schemas de Setor (sector.py) ---

def test_sector_create_valid():
    """Testa a criação de um setor válido."""
    sector_data = {"name": "Financeiro"}
    sector = SectorCreate(**sector_data)
    assert sector.name == "Financeiro"

def test_sector_create_invalid_missing_name():
    """Testa a falha ao criar um setor sem nome."""
    with pytest.raises(ValidationError, match="Field required"):
        SectorCreate() # 'name' é obrigatório


# --- Testes de Schemas de Equipamento (equipment.py) ---

def test_equipment_type_create_valid():
    """Testa a criação de um tipo de equipamento válido."""
    eq_type_data = {
        "name": "Notebook Dell",
        "category": "Notebook",
        "description": "Um notebook."
    }
    eq_type = EquipmentTypeCreate(**eq_type_data)
    assert eq_type.name == "Notebook Dell"

def test_equipment_unit_create_valid():
    """Testa a criação de uma unidade de equipamento válida."""
    unit_data = {
        "type_id": 1,
        "identifier_code": "NTB-001",
        "serial_number": "ABC123XYZ",
        "status": "available",
        "quantity": 1
    }
    unit = EquipmentUnitCreate(**unit_data)
    assert unit.identifier_code == "NTB-001"
    assert unit.quantity == 1


# --- Testes de Schemas de Reserva (reservation.py) ---

def test_reservation_create_valid():
    """Testa a criação de uma reserva válida."""
    now = datetime.now()
    later = now + timedelta(hours=2)
    reservation_data = {
        "unit_id": 10,
        "start_time": now,
        "end_time": later
    }
    reservation = ReservationCreate(**reservation_data)
    assert reservation.unit_id == 10
    assert reservation.start_time == now

def test_reservation_create_invalid_type():
    """Testa a falha de validação de tipo no Pydantic."""
    with pytest.raises(ValidationError, match="Input should be a valid integer"):
        ReservationCreate(
            unit_id="not-an-int", # Deve ser um int
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(hours=1)
        )

# --- Testes de Schemas de Admin (admin.py) ---

def test_reservation_status_update_valid_enum():
    """Testa se o schema de admin aceita os status do Enum."""
    update = ReservationStatusUpdate(status="approved")
    assert update.status == "approved"
    
    update = ReservationStatusUpdate(status="rejected")
    assert update.status == "rejected"

def test_reservation_status_update_invalid_enum():
    """Testa se o schema rejeita um status que não existe no Enum."""
    with pytest.raises(ValidationError):
        ReservationStatusUpdate(status="pending") # 'pending' não é um status que o admin pode *definir*

def test_user_role_update_valid():
    """Testa o schema de atualização de role."""
    update = UserRoleUpdate(role="manager")
    assert update.role == "manager"