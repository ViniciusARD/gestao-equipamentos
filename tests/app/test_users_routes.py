# tests/app/test_users_routes.py

"""
Testes de Integração para as Rotas de Usuário (app/routes/users.py)

Este módulo testa os endpoints que permitem a um usuário autenticado
gerenciar os dados do seu próprio perfil (/users/me).
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.reservation import Reservation # Importado para o novo teste

# Fixtures injetadas pelo conftest.py:
# client, db_session, test_user, test_requester_user, 
# auth_headers, requester_auth_headers, test_approved_reservation

def test_read_users_me(client: TestClient, auth_headers: dict, test_user: User):
    """Testa se o endpoint GET /users/me retorna os dados do usuário logado."""
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_user.username
    assert data["email"] == test_user.email
    assert data["id"] == test_user.id

def test_update_user_me_username_success(client: TestClient, auth_headers: dict, test_user: User):
    """
    Testa a atualização bem-sucedida do nome de usuário do próprio usuário.
    Verifica se a rota PUT /users/me retorna 200 OK e se o nome foi alterado.
    """
    update_data = {
        "username": "New Test Name"
    }
    
    response = client.put("/users/me", headers=auth_headers, json=update_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "New Test Name"
    assert data["email"] == test_user.email # Garante que o email não mudou

def test_update_user_me_sector_not_found(client: TestClient, auth_headers: dict, test_user: User):
    """
    Testa a falha ao tentar atualizar o setor do usuário para um ID que não existe.
    Verifica se a rota PUT /users/me retorna 404 (Not Found).
    """
    update_data = {
        "sector_id": 99999 # Um ID de setor que não existe no DB de teste
    }
    
    response = client.put("/users/me", headers=auth_headers, json=update_data)
    
    assert response.status_code == 404
    assert "setor não encontrado" in response.json()["detail"].lower()

def test_update_user_me_remove_sector(client: TestClient, auth_headers: dict, test_user: User):
    """
    Testa a atualização do perfil do usuário para remover a associação a um setor,
    enviando 'sector_id' como None.
    """
    update_data = {
        "sector_id": None # Remove o setor
    }

    response = client.put("/users/me", headers=auth_headers, json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["sector"] is None # Verifica se o setor foi removido

def test_delete_user_me_success(client: TestClient, auth_headers: dict, test_user: User, db_session: Session):
    """Testa a exclusão bem-sucedida da própria conta (sem reservas ativas)."""
    response = client.delete("/users/me", headers=auth_headers)
    
    assert response.status_code == 204 # HTTP 204 No Content
    
    # Verifica se o usuário foi removido do banco
    user_in_db = db_session.get(User, test_user.id)
    assert user_in_db is None

def test_delete_user_me_with_active_reservation_fails(
    client: TestClient, 
    requester_auth_headers: dict, 
    test_approved_reservation: Reservation
):
    """
    Testa a falha ao tentar deletar a própria conta quando 
    existem reservas ativas (status 'approved' ou 'pending').
    """
    # Usa o requester_auth_headers, que é o dono da test_approved_reservation
    response = client.delete("/users/me", headers=requester_auth_headers)
    
    assert response.status_code == 409 # HTTP 409 Conflict
    data = response.json()
    assert "reservas pendentes ou aprovadas" in data["detail"]