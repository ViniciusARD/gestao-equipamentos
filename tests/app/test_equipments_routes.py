# tests/app/test_equipments_routes.py

"""
Testes de Integração para as Rotas de Equipamentos (app/routes/equipments.py)

Testa o CRUD de Tipos de Equipamentos e Unidades de Equipamentos,
verificando as permissões de acesso (usuário vs. gerente).
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.reservation import Reservation

# Fixtures: client, db_session, auth_headers (user), manager_auth_headers,
# test_equipment_type, test_equipment_unit, test_approved_reservation

# --- Testes de Tipos de Equipamento (/types) ---

def test_manager_can_create_equipment_type(client: TestClient, manager_auth_headers: dict, db_session: Session):
    """Testa se um gerente pode criar um novo tipo de equipamento."""
    response = client.post(
        "/equipments/types",
        headers=manager_auth_headers,
        json={"name": "Projetor Teste", "category": "Audiovisual", "description": "Proj."},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Projetor Teste"
    
    # Verifica no DB
    db_type = db_session.get(EquipmentType, data["id"])
    assert db_type is not None

def test_user_cannot_create_equipment_type(client: TestClient, auth_headers: dict):
    """Testa se um usuário comum (não-gerente) falha ao tentar criar um tipo."""
    response = client.post(
        "/equipments/types",
        headers=auth_headers, # Headers de usuário comum
        json={"name": "Projetor Falho", "category": "Audiovisual"},
    )
    assert response.status_code == 403 # HTTP 403 Forbidden
    assert "permissões de gerente" in response.json()["detail"].lower()

def test_list_equipment_types_as_user(client: TestClient, auth_headers: dict, test_equipment_type: EquipmentType):
    """Testa se um usuário comum pode listar os tipos de equipamento."""
    response = client.get("/equipments/types", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == test_equipment_type.name
    assert "available_units" in data["items"][0] # Verifica se o schema de stats é usado

def test_get_type_with_units_as_user(client: TestClient, auth_headers: dict, test_equipment_unit: EquipmentUnit):
    """Testa se um usuário comum pode ver um tipo e suas unidades."""
    type_id = test_equipment_unit.type_id
    response = client.get(f"/equipments/types/{type_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == type_id
    assert len(data["units"]) == 1
    assert data["units"][0]["id"] == test_equipment_unit.id
    assert data["units"][0]["identifier_code"] == "NTB-TEST-001"

def test_manager_can_delete_type(client: TestClient, manager_auth_headers: dict, test_equipment_type: EquipmentType):
    """Testa se um gerente pode deletar um tipo de equipamento (sem reservas)."""
    response = client.delete(f"/equipments/types/{test_equipment_type.id}", headers=manager_auth_headers)
    assert response.status_code == 204

def test_manager_cannot_delete_type_with_active_reservation(
    client: TestClient, 
    manager_auth_headers: dict, 
    test_approved_reservation: Reservation
):
    """Testa a falha ao deletar um tipo que possui unidades com reservas ativas."""
    type_id = test_approved_reservation.equipment_unit.type_id
    response = client.delete(f"/equipments/types/{type_id}", headers=manager_auth_headers)
    assert response.status_code == 409 # HTTP 409 Conflict
    assert "reservas ativas ou pendentes" in response.json()["detail"].lower()

# --- Testes de Unidades de Equipamento (/units) ---

def test_manager_can_create_equipment_unit(
    client: TestClient, 
    manager_auth_headers: dict, 
    test_equipment_type: EquipmentType
):
    """Testa se um gerente pode adicionar uma nova unidade a um tipo."""
    response = client.post(
        "/equipments/units",
        headers=manager_auth_headers,
        json={
            "type_id": test_equipment_type.id,
            "identifier_code": "NTB-TEST-002",
            "serial_number": "SN-TEST-002",
            "status": "available",
            "quantity": 1
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert isinstance(data, list) # Retorna uma lista de unidades criadas
    assert data[0]["identifier_code"] == "NTB-TEST-002"

def test_manager_cannot_create_unit_with_duplicate_code(
    client: TestClient, 
    manager_auth_headers: dict, 
    test_equipment_type: EquipmentType,
    test_equipment_unit: EquipmentUnit # Unidade "NTB-TEST-001" já existe
):
    """Testa a falha ao criar uma unidade com código de identificação duplicado."""
    response = client.post(
        "/equipments/units",
        headers=manager_auth_headers,
        json={
            "type_id": test_equipment_type.id,
            "identifier_code": "NTB-TEST-001", # Código duplicado
            "serial_number": "SN-TEST-NEW",
            "quantity": 1
        }
    )
    assert response.status_code == 409
    assert "código de identificação" in response.json()["detail"].lower()

def test_get_unit_history(client: TestClient, manager_auth_headers: dict, test_equipment_unit: EquipmentUnit):
    """Testa se o histórico da unidade (criado no POST /units) pode ser acessado."""
    # O histórico de 'criação' deve ser criado no momento do POST.
    # Vamos criar uma nova unidade para garantir que ela tenha um histórico.
    res_post = client.post(
        "/equipments/units",
        headers=manager_auth_headers,
        json={"type_id": test_equipment_unit.type_id, "identifier_code": "HISTORY-001", "serial_number": "SN-HISTORY", "quantity": 1}
    )
    assert res_post.status_code == 201
    new_unit_id = res_post.json()[0]["id"]
    
    # Agora, buscamos o histórico
    response = client.get(f"/equipments/units/{new_unit_id}/history", headers=manager_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["event_type"] == "created"
    assert data[0]["unit_id"] == new_unit_id