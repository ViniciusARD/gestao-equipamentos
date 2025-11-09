# tests/app/test_auth_routes.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User

# Nota: Não precisamos importar 'pytest' aqui se estivermos apenas usando fixtures.

# --- Testes de Registro (app/routes/auth.py) ---

def test_register_user_success(client: TestClient):
    """
    Testa o registro de um novo usuário com sucesso.
    Isso testa o endpoint POST /auth/register
    """
    response = client.post(
        # --- CORREÇÃO AQUI ---
        # A rota de registro está em /auth/register
        "/auth/register",
        # ---------------------
        json={
            "username": "New User",
            "email": "newuser@example.com",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "sector_id": None,
            "terms_accepted": True,
        },
    )
    
    # Verifica o corpo da resposta em caso de falha para depuração
    if response.status_code != 201:
        print(f"Erro no registro: {response.json()}")

    assert response.status_code == 201  # 201 Created
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "New User"
    assert "id" in data
    assert "password_hash" not in data # Garante que o hash não foi retornado

def test_register_user_passwords_do_not_match(client: TestClient):
    """Testa o registro onde as senhas não são iguais."""
    response = client.post(
        # --- CORREÇÃO AQUI ---
        "/auth/register",
        # ---------------------
        json={
            "username": "Mismatch User",
            "email": "mismatch@example.com",
            "password": "Password123!",
            "password_confirm": "DIFFERENT_PASSWORD", # Senha errada
            "terms_accepted": True,
        },
    )
    
    assert response.status_code == 400
    # Verifica a mensagem de erro exata do auth.py
    assert "as senhas não coincidem" in response.json()["detail"].lower()

def test_register_user_email_exists(client: TestClient, test_user: User):
    """Testa o registro com um e-mail que já existe (usando o test_user)."""
    response = client.post(
        # --- CORREÇÃO AQUI ---
        "/auth/register",
        # ---------------------
        json={
            "username": "Another User",
            "email": "test@example.com",  # E-mail do 'test_user'
            "password": "Password123!",
            "password_confirm": "Password123!",
            "terms_accepted": True,
        },
    )
    
    # --- CORREÇÃO AQUI ---
    # A rota auth.py retorna 409 (Conflict) se o e-mail já existe e está verificado
    assert response.status_code == 409
    # ---------------------
    assert "email já registrado" in response.json()["detail"].lower()

# --- Testes de Login (app/routes/auth.py) ---

def test_login_user_success(client: TestClient, test_user: User):
    """
    Testa o login com sucesso de um usuário existente.
    Isso testa o endpoint POST /auth/login
    """
    response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "ValidPassword123!",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["login_step"] == "completed"
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_user_not_found(client: TestClient):
    """Testa o login com um e-mail que não existe."""
    response = client.post(
        "/auth/login",
        json={
            "email": "ghost@example.com",
            "password": "ValidPassword123!",
        },
    )
    
    assert response.status_code == 401
    assert "email ou senha incorretos" in response.json()["detail"].lower()

def test_login_user_wrong_password(client: TestClient, test_user: User):
    """Testa o login com a senha errada."""
    response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "WRONG_PASSWORD",
        },
    )
    
    assert response.status_code == 401
    assert "email ou senha incorretos" in response.json()["detail"].lower()

# --- Testes de Rotas Protegidas (ex: app/routes/users.py) ---

def test_get_me_success(client: TestClient, test_user: User):
    """Testa se o endpoint /users/me funciona com um token válido."""
    
    # 1. Fazer login para obter um token
    login_response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "ValidPassword123!"},
    )
    access_token = login_response.json()["access_token"]

    # 2. Usar o token para acessar a rota protegida
    headers = {"Authorization": f"Bearer {access_token}"}
    # Assumindo que você tem uma rota /users/me que usa get_current_user
    response = client.get("/users/me", headers=headers) 
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["id"] == test_user.id
    assert data["username"] == test_user.username

def test_get_me_no_token(client: TestClient):
    """Testa a falha ao acessar /users/me sem enviar um token."""
    response = client.get("/users/me")  # Sem header de autorização
    
    # --- CORREÇÃO AQUI ---
    # FastAPI retorna 403 por padrão para dependências de segurança não atendidas
    assert response.status_code == 403
    # A mensagem padrão do FastAPI para 403 de dependência é "Not authenticated"
    assert "not authenticated" in response.json()["detail"].lower()
    # ---------------------

def test_get_me_bad_token(client: TestClient):
    """Testa a falha ao acessar /users/me com um token inválido/expirado."""
    headers = {"Authorization": "Bearer not-a-real-token"}
    response = client.get("/users/me", headers=headers)
    
    # Com um token inválido, a sua lógica de 'get_current_user' deve 
    # (corretamente) retornar 401
    assert response.status_code == 401
    assert "não foi possível validar" in response.json()["detail"].lower()