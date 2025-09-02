# app/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
# A dependência OAuth2PasswordRequestForm foi removida daqui
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
# Importamos o novo schema UserLogin que criamos
from app.schemas.user import UserCreate, UserOut, Token, UserLogin
from app.security import get_password_hash, verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

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

# --- ESTA É A ROTA DE LOGIN ATUALIZADA ---
@router.post("/login", response_model=Token)
def login_for_access_token(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Autentica um usuário via JSON e retorna um token de acesso.
    """
    # 1. Buscamos o usuário pelo email que veio no corpo do JSON
    user = db.query(User).filter(User.email == user_credentials.email).first()

    # 2. Verificamos se o usuário existe e a senha está correta
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Criamos o token de acesso
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}

