# tests/app/test_security.py

"""
Testes de Unidade para Funções de Segurança (app/security.py)

Este módulo testa as funções críticas de segurança, como hashing de senhas,
criação e verificação de tokens JWT. O objetivo é garantir que a
criptografia de senhas funcione e que os tokens JWT sejam gerados e
validados corretamente, incluindo seus escopos e tempos de expiração.
"""

import pytest
from app.security import (
    get_password_hash, verify_password, create_access_token,
    create_verification_token, verify_verification_token,
    create_password_reset_token, verify_password_reset_token
)
from app.config import settings
from jose import jwt, JWTError
from datetime import timedelta

# --- Testes de Senha ---

def test_get_password_hash_and_verify():
    """
    Testa o ciclo de hashing e verificação de senha.
    Garante que:
    1. O hash gerado seja diferente da senha original.
    2. A verificação funcione para a senha correta.
    3. A verificação falhe para uma senha incorreta.
    """
    password = "mypassword123"
    hashed_password = get_password_hash(password)
    
    # O hash nunca deve ser igual à senha original
    assert hashed_password != password
    
    # A verificação deve funcionar para a senha correta
    assert verify_password(password, hashed_password)
    
    # A verificação deve falhar para senhas erradas
    assert not verify_password("wrongpassword", hashed_password)

# --- Testes de Token ---

@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    """
    Fixture do Pytest que "trava" (mocka) as configurações de segurança.

    Isso é crucial para garantir que os testes de token JWT usem chaves
    secretas e algoritmos consistentes, independentemente do que está
    configurado no arquivo .env do ambiente de desenvolvimento.
    'autouse=True' faz com que esta fixture seja aplicada a todos os
    testes neste módulo automaticamente.
    """
    monkeypatch.setattr(settings, 'JWT_SECRET_KEY', 'test_secret_key_for_pytest')
    monkeypatch.setattr(settings, 'ALGORITHM', 'HS256')
    monkeypatch.setattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES', 15)

def test_create_access_token():
    """
    Testa a criação de um token de acesso (access token) padrão.
    Verifica se o payload decodificado contém os dados corretos ('sub'),
    o ID do token ('jti') e um tempo de expiração ('exp').
    """
    data = {"sub": "testuser"}
    token = create_access_token(data)
    
    # Decodifica o token para verificar seu conteúdo
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert payload["sub"] == "testuser"
    assert "jti" in payload  # Verifica se o ID do token (jti) foi incluído
    assert "exp" in payload  # Verifica se a data de expiração foi incluída

def test_create_access_token_custom_expiry():
    """
    Testa a criação de um token de acesso com um tempo de expiração
    personalizado, diferente do padrão.
    """
    data = {"sub": "testuser_custom"}
    token = create_access_token(data, expires_delta=timedelta(minutes=1))
    
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "testuser_custom"

# --- Testes de Tokens de Verificação (Email/Senha) ---

def test_email_verification_token_flow():
    """
    Testa o ciclo de vida completo de um token de verificação de e-mail.
    Cria um token, o verifica e garante que tokens inválidos ou com
    chaves erradas falhem.
    """
    email = "test@example.com"
    token = create_verification_token(email)
    
    # Verifica se o token é válido e retorna o e-mail correto
    verified_email = verify_verification_token(token)
    assert verified_email == email
    
    # Testa tokens inválidos
    assert verify_verification_token("invalid.token.string") is None
    # Testa um token válido decodificado com a chave errada
    with pytest.raises(JWTError):
        jwt.decode(token, "wrong_key", algorithms=[settings.ALGORITHM])

def test_password_reset_token_flow():
    """
    Testa o ciclo de vida completo de um token de redefinição de senha.
    Cria um token e o verifica.
    """
    email = "reset@example.com"
    token = create_password_reset_token(email)
    
    verified_email = verify_password_reset_token(token)
    assert verified_email == email
    
    assert verify_password_reset_token("invalid.token.string") is None

def test_token_scopes_dont_mix():
    """
    Testa uma regra de segurança crítica: que tokens de escopos diferentes
    não possam ser usados de forma intercambiável.
    
    Garante que um token de 'verificação de e-mail' não possa ser usado
    para 'redefinir senha', e vice-versa.
    """
    verification_token = create_verification_token("test@scope.com")
    reset_token = create_password_reset_token("reset@scope.com")

    # Um token de reset não deve funcionar para verificar e-mail
    assert verify_verification_token(reset_token) is None
    
    # Um token de verificação não deve funcionar para resetar senha
    assert verify_password_reset_token(verification_token) is None