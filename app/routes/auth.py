# app/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from jose import jwt, JWTError

from app.database import get_db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist # Importar blacklist
from app.schemas.user import UserCreate, UserOut, Token, UserLogin, ForgotPasswordRequest, ResetPasswordRequest
from app.security import get_password_hash, verify_password, create_access_token, create_password_reset_token, verify_password_reset_token, get_current_user, get_token
from app.email_utils import send_reset_password_email
from app.logging_utils import create_log # Importar a função de log
from app.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

templates = Jinja2Templates(directory="app/templates")

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registra um novo usuário no sistema.
    """
    db_user_by_email = db.query(User).filter(User.email == user.email).first()
    if db_user_by_email:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já registrado")

    db_user_by_username = db.query(User).filter(User.username == user.username).first()
    if db_user_by_username:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nome de usuário já existe")

    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# --- ROTA DE LOGIN ---
@router.post("/login", response_model=Token)
def login_for_access_token(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user or not verify_password(user_credentials.password, user.password_hash):
        # Log de falha de login
        create_log(db, None, "WARNING", f"Tentativa de login falhou para o email: {user_credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    # Log de sucesso de login
    create_log(db, user.id, "INFO", f"Usuário '{user.username}' logado com sucesso.")
    return {"access_token": access_token, "token_type": "bearer"}

# --- ADICIONE ESTAS DUAS NOVAS ROTAS AO FINAL DO ARQUIVO ---
@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Inicia o fluxo de redefinição de senha.
    Recebe um email, gera um token e envia o link de redefinição por email.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Não informamos se o email existe ou não por segurança
        return {"message": "Se um usuário com este email existir, um link de redefinição será enviado."}

    reset_token = create_password_reset_token(email=user.email)
    
    # Usamos BackgroundTasks para não fazer o usuário esperar o envio do email
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
    Recebe o token e a nova senha, valida o token e atualiza a senha.
    """
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    user.password_hash = get_password_hash(request.new_password)
    db.commit()

    return {"message": "Sua senha foi redefinida com sucesso."}

# --- NOVA ROTA DE LOGOUT ---
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

        # --- MELHORIA ADICIONADA AQUI ---
        # Verifica se o token já está na blacklist antes de tentar adicionar
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

