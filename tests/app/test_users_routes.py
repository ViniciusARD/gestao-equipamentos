# tests/app/test_users_routes.py

"""
Testes de Integração para as Rotas de Usuário (app/routes/users.py)

Este módulo testa os endpoints que permitem a um usuário autenticado
gerenciar os dados do seu próprio perfil, como atualizar o nome de usuário
ou o setor.
"""

from fastapi.testclient import TestClient
from app.models.user import User

# As fixtures 'client' e 'test_user' são injetadas pelo conftest.py

def get_auth_headers(client: TestClient) -> dict:
    """
    Função auxiliar para fazer login como 'test_user' e obter os headers
    de autorização necessários para rotas protegidas.
    """
    login_response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "ValidPassword123!"},
    )
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}

def test_update_user_me_username_success(client: TestClient, test_user: User):
    """
    Testa a atualização bem-sucedida do nome de usuário do próprio usuário.
    Verifica se a rota PUT /users/me retorna 200 OK e se o nome foi alterado.
    """
    headers = get_auth_headers(client)
    update_data = {
        "username": "New Test Name"
        # O sector_id é opcional e não está sendo enviado
    }
    
    response = client.put("/users/me", headers=headers, json=update_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "New Test Name"
    assert data["email"] == test_user.email # Garante que o email não mudou

def test_update_user_me_sector_not_found(client: TestClient, test_user: User):
    """
    Testa a falha ao tentar atualizar o setor do usuário para um ID que não existe.
    Verifica se a rota PUT /users/me retorna 404 (Not Found).
    """
    headers = get_auth_headers(client)
    update_data = {
        "sector_id": 99999 # Um ID de setor que não existe no DB de teste
    }
    
    response = client.put("/users/me", headers=headers, json=update_data)
    
    assert response.status_code == 404
    assert "setor não encontrado" in response.json()["detail"].lower()

def test_update_user_me_remove_sector(client: TestClient, test_user: User):
    """
    Testa a atualização do perfil do usuário para remover a associação a um setor,
    enviando 'sector_id' como None.
    """
    headers = get_auth_headers(client)
    update_data = {
        "sector_id": None # Remove o setor
    }

    response = client.put("/users/me", headers=headers, json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["sector"] is None # Verifica se o setor foi removido