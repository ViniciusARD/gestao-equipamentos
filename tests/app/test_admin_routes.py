# tests/app/test_admin_routes.py

"""
Testes de Integração para as Rotas de Administração (app/routes/admin.py)

Este módulo testa os endpoints de gerenciamento acessíveis por Gerentes e Admins,
como aprovação de reservas, gerenciamento de usuários e logs.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import pytest
from app.models.user import User
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit

# Fixtures: client, db_session, test_user, test_requester_user, test_manager_user,
# test_admin_user, admin_auth_headers, manager_auth_headers, 
# test_pending_reservation, test_approved_reservation

# Mock para evitar que os testes tentem enviar e-mails ou criar eventos no Google Calendar
@pytest.fixture(autouse=True)
def mock_background_tasks(monkeypatch):
    """Mocka as funções de segundo plano para não executá-las."""
    monkeypatch.setattr("app.routes.admin.approve_and_create_calendar_event", lambda reservation_id: None)
    monkeypatch.setattr("app.routes.admin.task_send_reservation_email", lambda reservation_id, email_type: None)


# --- Testes de Gerenciamento de Reservas ---

def test_manager_can_list_all_reservations(
    client: TestClient, 
    manager_auth_headers: dict, 
    test_pending_reservation: Reservation
):
    """Testa se um gerente pode listar todas as reservas no sistema."""
    response = client.get("/admin/reservations", headers=manager_auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == test_pending_reservation.id
    assert data["items"][0]["status"] == "pending"

def test_manager_can_approve_reservation(
    client: TestClient, 
    manager_auth_headers: dict, 
    test_pending_reservation: Reservation,
    db_session: Session
):
    """Testa se um gerente pode aprovar uma reserva pendente."""
    res_id = test_pending_reservation.id
    unit_id = test_pending_reservation.unit_id

    response = client.patch(
        f"/admin/reservations/{res_id}",
        headers=manager_auth_headers,
        json={"status": "approved"}
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "approved"
    
    # Verifica se a reserva e a unidade foram atualizadas no DB
    db_res = db_session.get(Reservation, res_id)
    db_unit = db_session.get(EquipmentUnit, unit_id)
    assert db_res.status == "approved"
    assert db_unit.status == "reserved" # Unidade deve ser marcada como reservada

def test_manager_can_reject_reservation(
    client: TestClient, 
    manager_auth_headers: dict, 
    test_pending_reservation: Reservation,
    db_session: Session
):
    """Testa se um gerente pode rejeitar uma reserva pendente."""
    res_id = test_pending_reservation.id
    unit_id = test_pending_reservation.unit_id

    response = client.patch(
        f"/admin/reservations/{res_id}",
        headers=manager_auth_headers,
        json={"status": "rejected"}
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"
    
    # Verifica se a reserva e a unidade foram atualizadas no DB
    db_res = db_session.get(Reservation, res_id)
    db_unit = db_session.get(EquipmentUnit, unit_id)
    assert db_res.status == "rejected"
    assert db_unit.status == "available" # Unidade deve voltar a ficar disponível

# --- Testes de Gerenciamento de Usuários ---

def test_admin_can_list_users(client: TestClient, admin_auth_headers: dict, test_user: User):
    """Testa se um admin pode listar todos os usuários."""
    # O admin_auth_headers cria o test_admin_user, então teremos 2 usuários no total
    response = client.get("/admin/users", headers=admin_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2 # Pode haver mais (requester, manager, etc)
    assert any(u["email"] == test_user.email for u in data["items"])

def test_manager_cannot_list_users(client: TestClient, manager_auth_headers: dict):
    """Testa se um gerente (não-admin) falha ao tentar listar usuários."""
    response = client.get("/admin/users", headers=manager_auth_headers)
    assert response.status_code == 403 # HTTP 403 Forbidden
    assert "permissões de administrador" in response.json()["detail"].lower()

def test_manager_can_view_users(client: TestClient, manager_auth_headers: dict):
    """Testa se um gerente pode usar a rota de visualização de usuários."""
    response = client.get("/admin/users/view", headers=manager_auth_headers)
    assert response.status_code == 200
    # --- CORREÇÃO AQUI ---
    data = response.json() # Esta linha estava faltando
    assert data["total"] >= 1

def test_admin_can_change_user_role(
    client: TestClient, 
    admin_auth_headers: dict, 
    test_user: User, 
    db_session: Session
):
    """Testa se um admin pode alterar a permissão de outro usuário."""
    assert test_user.role == "user" # Verifica o estado inicial
    
    response = client.patch(
        f"/admin/users/{test_user.id}/role",
        headers=admin_auth_headers,
        json={"role": "manager"}
    )
    
    assert response.status_code == 200
    assert response.json()["role"] == "manager"
    
    # Verifica a mudança no DB
    db_session.refresh(test_user)
    assert test_user.role == "manager"

def test_admin_cannot_change_own_role(client: TestClient, admin_auth_headers: dict, test_admin_user: User):
    """Testa se um admin falha ao tentar remover a própria permissão."""
    response = client.patch(
        f"/admin/users/{test_admin_user.id}/role",
        headers=admin_auth_headers,
        json={"role": "user"}
    )
    assert response.status_code == 400
    assert "remover a própria permissão" in response.json()["detail"].lower()

def test_admin_can_delete_user(
    client: TestClient, 
    admin_auth_headers: dict, 
    test_user: User, 
    db_session: Session
):
    """Testa se um admin pode deletar outro usuário (sem reservas ativas)."""
    user_id = test_user.id
    response = client.delete(f"/admin/users/{user_id}", headers=admin_auth_headers)
    
    assert response.status_code == 204
    
    # Verifica se foi removido do DB
    deleted_user = db_session.get(User, user_id)
    assert deleted_user is None

def test_admin_cannot_delete_user_with_active_reservation(
    client: TestClient, 
    admin_auth_headers: dict, 
    test_approved_reservation: Reservation
):
    """Testa a falha ao deletar um usuário que possui reservas ativas."""
    user_to_delete_id = test_approved_reservation.user_id
    response = client.delete(f"/admin/users/{user_to_delete_id}", headers=admin_auth_headers)
    
    assert response.status_code == 409 # HTTP 409 Conflict
    assert "reservas pendentes ou aprovadas" in response.json()["detail"].lower()