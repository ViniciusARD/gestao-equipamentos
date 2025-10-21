# app/routes/auth.py

"""
Módulo de Rotas para Autenticação

Este arquivo define todos os endpoints (rotas) relacionados à autenticação,
registro, gerenciamento de sessão e recuperação de conta dos usuários.

Dependências:
- FastAPI: Para a criação do roteador e gerenciamento das requisições.
- SQLAlchemy: Para a interação com o banco de dados.
- Módulos de utilitários: security, email_utils, logging_utils, etc.
- Schemas Pydantic: Para validação e serialização dos dados.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
import pyotp
import qrcode
from io import BytesIO

from app.database import get_db
from app.models.user import User
from app.models.sector import Sector
from app.models.token_blacklist import TokenBlacklist
from app.schemas.user import (
    UserCreate, UserOut, Token, UserLogin, ForgotPasswordRequest,
    ResetPasswordRequest, LoginResponse, TwoFactorRequest,
    TwoFactorSetupResponse, TwoFactorEnableRequest, TwoFactorDisableRequest,
    RefreshTokenRequest
)
from app.security import (
    get_password_hash, verify_password, create_access_token,
    create_password_reset_token, verify_password_reset_token,
    get_current_user, get_token, create_verification_token,
    verify_verification_token, verify_otp, create_refresh_token
)
from app.email_utils import send_verification_email, send_reset_password_email
from app.logging_utils import create_log
from app.config import settings
from app.password_validator import validate_password

# Cria um roteador FastAPI para agrupar todos os endpoints de autenticação
router = APIRouter(
    prefix="/auth",  # Define um prefixo comum para todas as rotas neste módulo
    tags=["Authentication"]  # Agrupa estas rotas na documentação da API
)

# Constante para o limite de tentativas de login antes de bloquear a conta
LOGIN_ATTEMPT_LIMIT = 5

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Registra um novo usuário, mas o deixa inativo até a verificação por e-mail.
    Se o e-mail já existir e a conta não estiver verificada, reenvia o e-mail de verificação.
    """
    # Validação inicial dos dados
    if user.password != user.password_confirm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="As senhas não coincidem.")

    password_errors = validate_password(user.password)
    if password_errors:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errors": password_errors})

    if not user.terms_accepted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você deve aceitar os Termos de Uso e a Política de Privacidade para se cadastrar.")

    # Verifica se o e-mail já está em uso
    db_user_by_email = db.query(User).filter(User.email == user.email).first()
    if db_user_by_email:
        if db_user_by_email.is_verified:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já registrado")
        else:
            # Se o usuário existe mas não verificou o e-mail, reenvia o e-mail de verificação
            verification_token = create_verification_token(email=db_user_by_email.email)
            background_tasks.add_task(send_verification_email, db_user_by_email.email, db_user_by_email.username, verification_token)
            create_log(db, None, "INFO", f"Tentativa de registro com e-mail não verificado existente: {user.email}. Reenviando e-mail de verificação.")
            return db_user_by_email

    # Valida se o setor fornecido existe
    if user.sector_id:
        sector = db.query(Sector).filter(Sector.id == user.sector_id).first()
        if not sector:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado.")

    # Cria o novo usuário no banco de dados
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        sector_id=user.sector_id,
        is_active=False,  # Usuário começa inativo até verificar o e-mail
        is_verified=False,
        terms_accepted=True,
        terms_accepted_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    create_log(db, new_user.id, "INFO", f"Novo usuário registrado: '{new_user.username}' ({new_user.email}). Aguardando verificação de e-mail.")

    # Envia o e-mail de verificação em segundo plano
    verification_token = create_verification_token(email=new_user.email)
    background_tasks.add_task(send_verification_email, new_user.email, new_user.username, verification_token)

    return new_user

@router.get("/verify-email")
def verify_user_email(token: str, db: Session = Depends(get_db)):
    """Verifica o token enviado por e-mail e ativa a conta do usuário."""
    email = verify_verification_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    if user.is_verified:
        return {"message": "Email já verificado."}

    user.is_verified = True
    user.is_active = True
    db.commit()

    create_log(db, user.id, "INFO", f"Usuário '{user.username}' verificou o e-mail e ativou a conta.")
    return {"message": "Sua conta foi verificada com sucesso!"}

@router.post("/login", response_model=LoginResponse)
async def login_for_access_token(user_credentials: UserLogin, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Autentica um usuário e retorna tokens de acesso.
    Implementa bloqueio por tentativas e fluxo de 2FA.
    """
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email ou senha incorretos",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user:
        create_log(db, None, "WARNING", f"Tentativa de login para um e-mail não existente: {user_credentials.email}")
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Sua conta está inativa. Entre em contato com um administrador.")

    # Lógica de bloqueio por tentativas de senha
    if not verify_password(user_credentials.password, user.password_hash):
        user.login_attempts += 1
        if user.login_attempts >= LOGIN_ATTEMPT_LIMIT:
            user.is_active = False
            db.commit()
            create_log(db, user.id, "ERROR", f"Usuário '{user.username}' desativado por exceder o limite de tentativas de login.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Sua conta foi desativada por exceder as {LOGIN_ATTEMPT_LIMIT} tentativas de login. Contate o suporte.")
        db.commit()
        remaining_attempts = LOGIN_ATTEMPT_LIMIT - user.login_attempts
        create_log(db, user.id, "WARNING", f"Tentativa de login falhou para o usuário '{user.username}'. Tentativas restantes: {remaining_attempts}")
        raise credentials_exception

    # Se o login for bem-sucedido, zera o contador de tentativas
    user.login_attempts = 0
    db.commit()

    # Verifica se o usuário já validou o e-mail
    if not user.is_verified:
        verification_token = create_verification_token(email=user.email)
        background_tasks.add_task(send_verification_email, user.email, user.username, verification_token)
        return LoginResponse(login_step="verification_required", message="Sua conta ainda não foi verificada. Um novo link de verificação foi enviado para o seu e-mail.")

    if not user.terms_accepted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você precisa aceitar os Termos de Uso para fazer login.")

    # Se o 2FA estiver ativo, inicia o fluxo de verificação
    if user.otp_enabled:
        temp_token_data = {"sub": str(user.id), "scope": "2fa_verification"}
        temp_token = create_access_token(temp_token_data, expires_delta=timedelta(minutes=5))
        return LoginResponse(login_step="2fa_required", temp_token=temp_token)

    # Se tudo estiver correto, gera os tokens de acesso e de atualização
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    create_log(db, user.id, "INFO", f"Usuário '{user.username}' logado com sucesso.")
    return LoginResponse(login_step="completed", access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@router.post("/login/2fa", response_model=Token)
def login_2fa_verification(request: TwoFactorRequest, db: Session = Depends(get_db)):
    """Verifica o código 2FA e finaliza o processo de login."""
    try:
        payload = jwt.decode(request.temp_token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("scope") != "2fa_verification":
            raise HTTPException(status_code=401, detail="Token inválido para verificação 2FA.")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token temporário inválido ou expirado.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.otp_enabled:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou 2FA não está ativo.")

    if not verify_otp(user.otp_secret, request.otp_code):
        create_log(db, user.id, "WARNING", "Tentativa de login com código 2FA inválido.")
        raise HTTPException(status_code=401, detail="Código 2FA inválido.")

    # Se o código 2FA for válido, gera os tokens finais
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    create_log(db, user.id, "INFO", f"Usuário '{user.username}' logado com sucesso via 2FA.")
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh_access_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Gera um novo access token a partir de um refresh token válido."""
    try:
        payload = jwt.decode(request.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Refresh token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token inválido ou expirado")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo")

    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Inicia o fluxo de redefinição de senha."""
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        # Se o usuário existir, envia o e-mail de redefinição
        reset_token = create_password_reset_token(email=user.email)
        background_tasks.add_task(send_reset_password_email, user.email, user.username, reset_token)
        create_log(db, user.id, "INFO", f"Usuário '{user.username}' solicitou a redefinição de senha.")
    else:
        # Se não existir, registra o evento, mas não informa o erro ao cliente por segurança
        create_log(db, None, "INFO", f"Tentativa de recuperação de senha para e-mail não existente: {request.email}.")
    
    # Por segurança, sempre retorna a mesma mensagem para não confirmar se um e-mail existe ou não.
    return {"message": "Se um usuário com este email existir, um link de redefinição será enviado."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Finaliza o fluxo de redefinição de senha."""
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if request.new_password != request.new_password_confirm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="As senhas não coincidem.")

    password_errors = validate_password(request.new_password)
    if password_errors:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"errors": password_errors})

    user.password_hash = get_password_hash(request.new_password)
    db.commit()

    create_log(db, user.id, "INFO", f"Usuário '{user.username}' redefiniu sua senha com sucesso.")
    return {"message": "Sua senha foi redefinida com sucesso."}

@router.post("/logout")
def logout(db: Session = Depends(get_db), token: str = Depends(get_token)):
    """Invalida o token JWT atual adicionando-o à blacklist."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        exp = payload.get("exp")
        user_id = payload.get("sub")

        if not jti:
            raise HTTPException(status_code=400, detail="Token inválido.")

        # Verifica se o token já está na blacklist
        is_blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first()
        if is_blacklisted:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este token já foi invalidado.")
        
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)

        # Adiciona o token à blacklist
        db_token = TokenBlacklist(jti=jti, expires_at=expires_at)
        db.add(db_token)
        db.commit()

        create_log(db, user_id, "INFO", f"Usuário ID {user_id} fez logout.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Token inválido.")
    
    return {"message": "Logout realizado com sucesso."}