# tests/app/test_reservations_routes.py

"""
Testes de Integração para as Rotas de Reservas (app/routes/reservations.py)

Este módulo testa os endpoints que um usuário 'requester' usa para criar
e visualizar suas próprias reservas.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
import pytest
from app.database import get_db

# Fixtures injetadas pelo conftest.py:
# client, db_session, test_requester_user, requester_auth_headers, 
# test_equipment_unit, test_approved_reservation

# Mock para evitar que o teste tente enviar e-mails reais
@pytest.fixture(autouse=True)
def mock_background_tasks(monkeypatch):
    """Mocka a função que envia e-mails em segundo plano."""
    monkeypatch.setattr("app.routes.reservations.task_send_creation_emails", lambda reservation_id: None)

def test_create_reservation_success(
    client: TestClient, 
    requester_auth_headers: dict, 
    test_equipment_unit: EquipmentUnit
):
    """Testa a criação bem-sucedida de uma nova reserva."""
    start_time = datetime.now(timezone.utc) + timedelta(days=3)
    end_time = datetime.now(timezone.utc) + timedelta(days=4)
    
    response = client.post(
        "/reservations/",
        headers=requester_auth_headers,
        json={
            "unit_id": test_equipment_unit.id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }
    )
    
    assert response.status_code == 201 # HTTP 201 Created
    data = response.json()
    assert data["status"] == "pending"
    assert data["unit_id"] == test_equipment_unit.id
    assert "id" in data
    
    # Verifica se o status da unidade foi atualizado no DB
    db_unit = client.app.dependency_overrides[get_db]().__next__().get(EquipmentUnit, test_equipment_unit.id)
    assert db_unit.status == "pending"

def test_create_reservation_conflict(
    client: TestClient, 
    requester_auth_headers: dict, 
    test_approved_reservation: Reservation,
    db_session: Session  # <-- 1. ADICIONA O db_session
):
    """
    Testa a falha ao tentar criar uma reserva que conflita
    com o horário de uma reserva existente (aprovada ou pendente).
    """
    # Pega os dados da reserva fixture (que é de days=1 a days=2)
    existing_res = test_approved_reservation

    # --- INÍCIO DA CORREÇÃO ---
    # O fixture 'test_approved_reservation' define o status da unidade como 'reserved'.
    # Isso faria a rota /reservations retornar 400 (Bad Request) antes de
    # checar o conflito de horário (que retorna 409).
    # Manualmente, redefinimos o status para 'available' para que o teste
    # possa de fato testar a lógica de CONFLITO (409).
    unit = db_session.get(EquipmentUnit, existing_res.unit_id)
    unit.status = "available"
    db_session.commit()
    # --- FIM DA CORREÇÃO ---
    
    # Tenta reservar no mesmo horário
    response = client.post(
        "/reservations/",
        headers=requester_auth_headers,
        json={
            "unit_id": existing_res.unit_id,
            "start_time": (datetime.now(timezone.utc) + timedelta(days=1, hours=2)).isoformat(),
            "end_time": (datetime.now(timezone.utc) + timedelta(days=1, hours=5)).isoformat(),
        }
    )
    
    assert response.status_code == 409 # HTTP 409 Conflict
    assert "já existe uma reserva" in response.json()["detail"].lower()

def test_create_reservation_unit_not_available(
    client: TestClient, 
    requester_auth_headers: dict, 
    test_equipment_unit: EquipmentUnit,
    db_session: Session
):
    """Testa a falha ao tentar reservar uma unidade em manutenção."""
    # Coloca a unidade em manutenção
    test_equipment_unit.status = "maintenance"
    db_session.commit()
    
    start_time = datetime.now(timezone.utc) + timedelta(days=5)
    end_time = datetime.now(timezone.utc) + timedelta(days=6)
    
    response = client.post(
        "/reservations/",
        headers=requester_auth_headers,
        json={
            "unit_id": test_equipment_unit.id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
        }
    )
    
    assert response.status_code == 400 # HTTP 400 Bad Request
    assert "não está disponível para reserva" in response.json()["detail"].lower()

def test_get_my_reservations(
    client: TestClient, 
    requester_auth_headers: dict, 
    test_approved_reservation: Reservation
):
    """Testa se o endpoint /my-reservations retorna as reservas do usuário logado."""
    response = client.get("/reservations/my-reservations", headers=requester_auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == test_approved_reservation.id
    assert data["items"][0]["status"] == "approved"

def test_get_my_upcoming_reservations(
    client: TestClient, 
    requester_auth_headers: dict, 
    test_approved_reservation: Reservation
):
    """Testa o endpoint de próximas reservas."""
    response = client.get("/reservations/upcoming", headers=requester_auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == test_approved_reservation.id