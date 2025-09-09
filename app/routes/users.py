# app/routes/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate # Adicionar UserUpdate
from app.security import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retorna os detalhes do usuário atualmente autenticado.
    """
    return current_user

@router.put("/me", response_model=UserOut)
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permite que o usuário autenticado atualize seu próprio nome de usuário.
    """
    # Verifica se o novo nome de usuário já está em uso por outra pessoa
    if user_update.username:
        existing_user = db.query(User).filter(User.username == user_update.username).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=409, detail="Este nome de usuário já está em uso.")
        current_user.username = user_update.username
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permite que o usuário autenticado delete sua própria conta.
    """
    db.delete(current_user)
    db.commit()
    return