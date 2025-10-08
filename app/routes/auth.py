# app/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, Response
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
import pyotp
import qrcode
from io import BytesIO

from app.database import get_db
from app.models.user import User
from app.models.setor import Setor
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

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

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
    if user.password != user.password_confirm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="As senhas não coincidem.")

    password_errors = validate_password(user.password)
    if password_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": password_errors}
        )

    if not user.terms_accepted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você deve aceitar os Termos de Uso e a Política de Privacidade para se cadastrar.")

    db_user_by_email = db.query(User).filter(User.email == user.email).first()
    if db_user_by_email:
        if db_user_by_email.is_verified:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já registrado")
        else:
            # Reenvia o e-mail de verificação se o usuário não for verificado
            verification_token = create_verification_token(email=db_user_by_email.email)
            background_tasks.add_task(
                send_verification_email,
                email_to=db_user_by_email.email,
                username=db_user_by_email.username,
                token=verification_token
            )
            # Retorna o usuário existente, mas com um status 200 em vez de 201
            # para indicar que nenhuma nova entidade foi criada.
            # O frontend tratará isso como um sucesso de qualquer maneira.
            return db_user_by_email

    db_user_by_username = db.query(User).filter(User.username == user.username).first()
    if db_user_by_username:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nome de usuário já existe")

    if user.setor_id:
        setor = db.query(Setor).filter(Setor.id == user.setor_id).first()
        if not setor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado.")

    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        setor_id=user.setor_id,
        is_active=False,
        is_verified=False,
        terms_accepted=True,
        terms_accepted_at=datetime.now(timezone.utc)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    verification_token = create_verification_token(email=new_user.email)
    background_tasks.add_task(
        send_verification_email,
        email_to=new_user.email,
        username=new_user.username,
        token=verification_token
    )

    return new_user

@router.get("/verify-email")
def verify_user_email(token: str, db: Session = Depends(get_db)):
    """
    Verifica o token enviado por e-mail e ativa a conta do usuário.
    """
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

    return {"message": "Sua conta foi verificada com sucesso!"}


@router.post("/login", response_model=LoginResponse)
async def login_for_access_token(user_credentials: UserLogin, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user or not verify_password(user_credentials.password, user.password_hash):
        create_log(db, None, "WARNING", f"Tentativa de login falhou para o email: {user_credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        # Se o usuário não for verificado, reenviar o e-mail de verificação
        verification_token = create_verification_token(email=user.email)
        background_tasks.add_task(
            send_verification_email,
            email_to=user.email,
            username=user.username,
            token=verification_token
        )
        raise HTTPException(status_code=403, detail="Sua conta ainda não foi verificada. Um novo link de verificação foi enviado para o seu e-mail.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Sua conta está inativa.")


    if not user.terms_accepted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você precisa aceitar os Termos de Uso para fazer login.")

    if user.otp_enabled:
        temp_token_data = {"sub": str(user.id), "scope": "2fa_verification"}
        temp_token = create_access_token(temp_token_data, expires_delta=timedelta(minutes=5))
        return {"login_step": "2fa_required", "temp_token": temp_token}

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    create_log(db, user.id, "INFO", f"Usuário '{user.username}' logado com sucesso.")
    return {
        "login_step": "completed",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/login/2fa", response_model=Token)
def login_2fa_verification(request: TwoFactorRequest, db: Session = Depends(get_db)):
    """Verifica o código 2FA e finaliza o login."""
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

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    create_log(db, user.id, "INFO", f"Usuário '{user.username}' logado com sucesso via 2FA.")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

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

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Inicia o fluxo de redefinição de senha.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return {"message": "Se um usuário com este email existir, um link de redefinição será enviado."}

    reset_token = create_password_reset_token(email=user.email)
    
    background_tasks.add_task(
        send_reset_password_email,
        email_to=user.email,
        username=user.username,
        token=reset_token
    )
    
    return {"message": "Se um usuário com este email existir, um link de redefinição será enviado."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Finaliza o fluxo de redefinição de senha.
    """
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": password_errors}
        )

    user.password_hash = get_password_hash(request.new_password)
    db.commit()

    return {"message": "Sua senha foi redefinida com sucesso."}

@router.post("/logout")
def logout(db: Session = Depends(get_db), token: str = Depends(get_token)):
    """
    Invalida o token JWT atual adicionando-o à blacklist.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        exp = payload.get("exp")
        user_id = payload.get("sub")

        if not jti:
            raise HTTPException(status_code=400, detail="Token inválido.")

        is_blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first()
        if is_blacklisted:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este token já foi invalidado.")
        
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)

        db_token = TokenBlacklist(jti=jti, expires_at=expires_at)
        db.add(db_token)
        db.commit()

        create_log(db, user_id, "INFO", f"Usuário ID {user_id} fez logout.")

    except JWTError:
        raise HTTPException(status_code=400, detail="Token inválido.")
    
    return {"message": "Logout realizado com sucesso."}