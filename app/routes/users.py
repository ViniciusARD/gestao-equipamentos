# app/routes/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.sector import Sector
from app.schemas.user import UserOut, UserUpdate
from app.security import get_current_user
from app.logging_utils import create_log

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
    Permite que o usuário autenticado atualize seu nome de usuário e setor.
    """
    if user_update.username:
        current_user.username = user_update.username
    
    if user_update.sector_id is not None:
        sector = db.query(Sector).filter(Sector.id == user_update.sector_id).first()
        if not sector:
            raise HTTPException(status_code=404, detail="Setor não encontrado.")
        current_user.sector_id = user_update.sector_id
    else: # Permite remover o setor
        current_user.sector_id = None


    db.commit()
    db.refresh(current_user)
    
    create_log(db, current_user.id, "INFO", f"Usuário '{current_user.username}' atualizou seu próprio perfil.")

    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permite que o usuário autenticado delete sua própria conta.
    """
    user_id_log = current_user.id
    username_log = current_user.username
    
    db.delete(current_user)
    db.commit()
    
    create_log(db, user_id_log, "WARNING", f"Usuário '{username_log}' (ID: {user_id_log}) deletou a própria conta.")

    return