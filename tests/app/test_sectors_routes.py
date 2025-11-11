# tests/app/test_sectors_routes.py

"""
Testes de Integração para as Rotas de Setores (app/routes/sectors.py)

Testa o CRUD de Setores, verificando as permissões de acesso (usuário vs. admin).
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.sector import Sector

# Fixtures: client, db_session, auth_headers (user), admin_auth_headers, test_sector

def test_admin_can_create_sector(client: TestClient, admin_auth_headers: dict, db_session: Session):
    """Testa se um admin pode criar um novo setor."""
    response = client.post(
        "/sectors/",
        headers=admin_auth_headers,
        json={"name": "Financeiro"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Financeiro"
    
    # Verifica no DB
    db_sector = db_session.get(Sector, data["id"])
    assert db_sector is not None
    assert db_sector.name == "Financeiro"

def test_user_cannot_create_sector(client: TestClient, auth_headers: dict):
    """Testa se um usuário comum (não-admin) falha ao tentar criar um setor."""
    response = client.post(
        "/sectors/",
        headers=auth_headers, # Headers de usuário comum
        json={"name": "Setor Falho"},
    )
    assert response.status_code == 403 # HTTP 403 Forbidden
    assert "permissões de administrador" in response.json()["detail"].lower()

def test_create_sector_duplicate_name(client: TestClient, admin_auth_headers: dict, test_sector: Sector):
    """Testa a falha ao criar um setor com nome duplicado."""
    response = client.post(
        "/sectors/",
        headers=admin_auth_headers,
        json={"name": test_sector.name}, # test_sector.name é "TI" (da fixture)
    )
    assert response.status_code == 400
    assert "name already exists" in response.json()["detail"].lower()

def test_authenticated_user_can_list_sectors(client: TestClient, auth_headers: dict, test_sector: Sector):
    """Testa se um usuário autenticado comum pode listar os setores (necessário para o cadastro)."""
    response = client.get("/sectors/", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == test_sector.name

def test_admin_can_update_sector(client: TestClient, admin_auth_headers: dict, test_sector: Sector, db_session: Session):
    """Testa se um admin pode atualizar o nome de um setor."""
    response = client.put(
        f"/sectors/{test_sector.id}",
        headers=admin_auth_headers,
        json={"name": "TI - Atualizado"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "TI - Atualizado"
    
    # Verifica no DB
    db_session.refresh(test_sector)
    assert test_sector.name == "TI - Atualizado"

def test_admin_can_delete_sector(client: TestClient, admin_auth_headers: dict, test_sector: Sector, db_session: Session):
    """Testa se um admin pode deletar um setor."""
    sector_id = test_sector.id
    response = client.delete(f"/sectors/{sector_id}", headers=admin_auth_headers)
    
    assert response.status_code == 204
    
    # Verifica no DB
    deleted_sector = db_session.get(Sector, sector_id)
    assert deleted_sector is None