# tests/app/test_auth_routes.py

"""
Testes de Integração para as Rotas de Autenticação (app/routes/auth.py)

Este módulo testa o comportamento completo dos endpoints de autenticação,
incluindo registro, login e acesso a rotas protegidas. Ele utiliza as
fixtures 'client' e 'test_user' definidas em 'conftest.py'.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User

# Nota: As fixtures 'client' e 'test_user' são injetadas automaticamente
# pelo Pytest nos argumentos das funções de teste.

# --- Testes de Registro (/auth/register) ---

def test_register_user_success(client: TestClient):
    """
    Testa o registro de um novo usuário com dados válidos.
    Verifica se o endpoint POST /auth/register retorna 201 (Created)
    e se os dados do usuário são retornados corretamente, sem o hash da senha.
    """
    response = client.post(
        "/auth/register",
        json={
            "username": "New User",
            "email": "newuser@example.com",
            "password": "Password123!",
            "password_confirm": "Password123!",
            "sector_id": None,
            "terms_accepted": True,
        },
    )
    
    # Adiciona uma verificação de depuração caso o teste falhe
    if response.status_code != 201:
        print(f"Erro no registro: {response.json()}")

    assert response.status_code == 201  # 201 Created
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "New User"
    assert "id" in data
    assert "password_hash" not in data # Garante que o hash da senha não foi retornado

def test_register_user_passwords_do_not_match(client: TestClient):
    """
    Testa a falha de registro quando as senhas não coincidem.
    Verifica se o endpoint POST /auth/register retorna 400 (Bad Request)
    e se a mensagem de erro específica é fornecida.
    """
    response = client.post(
        "/auth/register",
        json={
            "username": "Mismatch User",
            "email": "mismatch@example.com",
            "password": "Password123!",
            "password_confirm": "DIFFERENT_PASSWORD", # Senha divergente
            "terms_accepted": True,
        },
    )
    
    assert response.status_code == 400
    # Verifica a mensagem de erro definida na rota 'auth.py'
    assert "as senhas não coincidem" in response.json()["detail"].lower()

def test_register_user_email_exists(client: TestClient, test_user: User):
    """
    Testa a falha de registro ao tentar usar um e-mail que já existe.
    Utiliza a fixture 'test_user' para garantir que o e-mail 'test@example.com'
    já esteja no banco de dados.
    Verifica se o endpoint POST /auth/register retorna 409 (Conflict).
    """
    response = client.post(
        "/auth/register",
        json={
            "username": "Another User",
            "email": "test@example.com",  # E-mail do 'test_user'
            "password": "Password123!",
            "password_confirm": "Password123!",
            "terms_accepted": True,
        },
    )
    
    # A rota auth.py retorna 409 (Conflict) se o e-mail já existe e está verificado
    assert response.status_code == 409
    assert "email já registrado" in response.json()["detail"].lower()

# --- Testes de Login (/auth/login) ---

def test_login_user_success(client: TestClient, test_user: User):
    """
    Testa o login bem-sucedido de um usuário existente (o 'test_user').
    Verifica se o endpoint POST /auth/login retorna 200 (OK) e se
    os tokens de acesso e atualização são fornecidos corretamente.
    """
    response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "ValidPassword123!", # Senha definida no conftest.py
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["login_step"] == "completed"
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_user_not_found(client: TestClient):
    """
    Testa a falha de login ao usar um e-mail que não existe no banco de dados.
    Verifica se o endpoint POST /auth/login retorna 401 (Unauthorized).
    """
    response = client.post(
        "/auth/login",
        json={
            "email": "ghost@example.com", # E-mail não cadastrado
            "password": "ValidPassword123!",
        },
    )
    
    assert response.status_code == 401
    assert "email ou senha incorretos" in response.json()["detail"].lower()

def test_login_user_wrong_password(client: TestClient, test_user: User):
    """
    Testa a falha de login ao usar a senha errada para um usuário existente.
    Verifica se o endpoint POST /auth/login retorna 401 (Unauthorized).
    """
    response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com", # E-mail do 'test_user'
            "password": "WRONG_PASSWORD", # Senha incorreta
        },
    )
    
    assert response.status_code == 401
    assert "email ou senha incorretos" in response.json()["detail"].lower()

# --- Testes de Rotas Protegidas (ex: /users/me) ---

def test_get_me_success(client: TestClient, test_user: User):
    """
    Testa o acesso a uma rota protegida (/users/me) com um token JWT válido.
    Primeiro, realiza o login para obter um token, e então usa esse token
    no cabeçalho 'Authorization' para acessar a rota.
    """
    
    # 1. Fazer login para obter um token
    login_response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "ValidPassword123!"},
    )
    access_token = login_response.json()["access_token"]

    # 2. Usar o token para acessar a rota protegida
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/users/me", headers=headers) 
    
    assert response.status_code == 200
    data = response.json()
    # Verifica se os dados retornados são do usuário que fez login
    assert data["email"] == test_user.email
    assert data["id"] == test_user.id
    assert data["username"] == test_user.username

def test_get_me_no_token(client: TestClient):
    """
    Testa a falha ao acessar uma rota protegida (/users/me) sem enviar um token.
    Verifica se a API retorna 403 (Forbidden), conforme o padrão do FastAPI
    para dependências de segurança não atendidas.
    """
    response = client.get("/users/me")  # Sem header de autorização
    
    assert response.status_code == 403
    # A mensagem padrão do FastAPI para 403 de dependência é "Not authenticated"
    assert "not authenticated" in response.json()["detail"].lower()

def test_get_me_bad_token(client: TestClient):
    """
    Testa a falha ao acessar uma rota protegida (/users/me) com um token
    inválido ou mal formatado.
    Verifica se a dependência 'get_current_user' captura o JWTError
    e retorna 401 (Unauthorized).
    """
    headers = {"Authorization": "Bearer not-a-real-token"} # Token inválido
    response = client.get("/users/me", headers=headers)
    
    # A lógica de 'get_current_user' em security.py deve retornar 401
    assert response.status_code == 401
    assert "não foi possível validar" in response.json()["detail"].lower()