# app/security.py

"""
Módulo de Segurança e Autenticação

Este módulo centraliza todas as funcionalidades relacionadas à segurança,
autenticação e autorização da aplicação. Inclui hashing de senhas, criação
e verificação de tokens JWT, e dependências do FastAPI para proteger rotas.

Dependências:
- passlib, bcrypt: Para hashing de senhas.
- python-jose: Para manipulação de JSON Web Tokens (JWT).
- fastapi: Para o sistema de injeção de dependência e segurança de rotas.
- sqlalchemy: Para acessar o banco de dados e validar usuários/tokens.
- app.config: Para chaves secretas e configurações de tokens.
- app.models: Para os modelos de dados User e TokenBlacklist.
"""

from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uuid
import pyotp

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist

# Define o esquema de autenticação Bearer (ex: "Authorization: Bearer <token>")
bearer_scheme = HTTPBearer()

# Configura o contexto de hashing de senhas, utilizando o algoritmo bcrypt.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha em texto plano corresponde a um hash armazenado.

    Args:
        plain_password (str): A senha fornecida pelo usuário.
        hashed_password (str): O hash da senha armazenado no banco de dados.

    Returns:
        bool: True se a senha for válida, False caso contrário.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Gera o hash de uma senha em texto plano.

    Args:
        password (str): A senha a ser criptografada.

    Returns:
        str: O hash da senha.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Cria um novo token de acesso (Access Token) JWT.

    Inclui um ID de token único (jti) para permitir a invalidação (logout).

    Args:
        data (dict): Os dados a serem incluídos no payload (geralmente o ID do usuário).
        expires_delta (timedelta | None): Duração opcional da validade. Se não for
                                          fornecido, usa o padrão das configurações.

    Returns:
        str: O token JWT codificado.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "jti": str(uuid.uuid4())  # Adiciona um ID único para o token
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """
    Cria um novo token de atualização (Refresh Token) JWT com validade mais longa.

    Args:
        data (dict): Os dados a serem incluídos no payload (geralmente o ID do usuário).

    Returns:
        str: O refresh token JWT codificado.
    """
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência do FastAPI que valida o token JWT e retorna o usuário correspondente.

    Esta função é usada para proteger rotas. Ela:
    1. Extrai o token do cabeçalho de autorização.
    2. Decodifica e valida o token.
    3. Verifica se o token está na blacklist (foi revogado via logout).
    4. Busca e retorna o usuário do banco de dados.
    5. Lança exceções HTTP se qualquer etapa falhar.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        jti: str = payload.get("jti")  # Pega o JTI do token
        if user_id is None or jti is None:
            raise credentials_exception
        
        # --- VERIFICAÇÃO DA BLACKLIST ---
        # Consulta o banco para ver se o ID deste token está na lista de revogados.
        token_in_blacklist = db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first()
        if token_in_blacklist:
            raise credentials_exception  # Se estiver na blacklist, o token é inválido.

    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Conta inativa.")

    return user

def get_current_requester_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependência que garante que o usuário tenha no mínimo a permissão de 'requester'."""
    if current_user.role not in ["requester", "manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Permissões de solicitante são necessárias."
        )
    return current_user

def get_current_manager_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependência que garante que o usuário tenha no mínimo a permissão de 'manager'."""
    if current_user.role not in ["manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Permissões de gerente são necessárias."
        )
    return current_user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependência que garante que o usuário tenha a permissão de 'admin'."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Permissões de administrador são necessárias."
        )
    return current_user

def get_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
    """Dependência simples que extrai e retorna a string do token JWT."""
    return credentials.credentials

def create_verification_token(email: str) -> str:
    """Cria um token JWT específico para verificação de email (válido por 24 horas)."""
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"exp": expire, "sub": email, "scope": "email_verification"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_verification_token(token: str) -> str | None:
    """Verifica o token de verificação de email e retorna o email se for válido."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("scope") == "email_verification":
            email: str = payload.get("sub")
            return email
        return None
    except JWTError:
        return None

def create_password_reset_token(email: str) -> str:
    """Cria um token JWT para redefinição de senha (válido por 15 minutos)."""
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": email, "scope": "password_reset"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password_reset_token(token: str) -> str | None:
    """Verifica o token de redefinição de senha e retorna o email se for válido."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("scope") == "password_reset":
            email: str = payload.get("sub")
            return email
        return None
    except JWTError:
        return None

def verify_otp(otp_secret: str, otp_code: str) -> bool:
    """
    Verifica um código OTP (One-Time Password) gerado por um app autenticador.

    Args:
        otp_secret (str): O segredo compartilhado armazenado para o usuário.
        otp_code (str): O código de 6 dígitos fornecido pelo usuário.

    Returns:
        bool: True se o código for válido, False caso contrário.
    """
    totp = pyotp.TOTP(otp_secret)
    return totp.verify(otp_code)