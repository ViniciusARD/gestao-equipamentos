# app/routes/users.py

"""
Módulo de Rotas para Gerenciamento do Perfil do Usuário

Este arquivo define os endpoints que permitem a um usuário autenticado
gerenciar suas próprias informações, como visualizar, atualizar e deletar
seu perfil.

Dependências:
- FastAPI: Para a criação do roteador e gerenciamento de dependências.
- SQLAlchemy: Para a interação com o banco de dados.
- Módulos de modelos e schemas: Para a estrutura de dados e validação.
- Módulos de utilitários: security (para obter o usuário atual) e logging_utils.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.sector import Sector
from app.schemas.user import UserOut, UserUpdate
from app.security import get_current_user
from app.logging_utils import create_log

# Cria um roteador FastAPI para agrupar os endpoints de usuário
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retorna os detalhes do usuário atualmente autenticado.

    Esta rota é protegida e utiliza a dependência `get_current_user` para
    obter os dados do usuário a partir do token JWT válido.
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
    # Atualiza o nome de usuário se um novo valor for fornecido
    if user_update.username:
        current_user.username = user_update.username
    
    # Atualiza o setor do usuário
    if user_update.sector_id is not None:
        # Verifica se o setor para o qual o usuário quer mudar existe
        sector = db.query(Sector).filter(Sector.id == user_update.sector_id).first()
        if not sector:
            raise HTTPException(status_code=404, detail="Setor não encontrado.")
        current_user.sector_id = user_update.sector_id
    else: # Permite que o usuário remova sua associação a um setor
        current_user.sector_id = None

    # Salva as alterações no banco de dados
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

    Esta é uma operação destrutiva e permanente.
    """
    # Armazena dados para o log antes de deletar o usuário
    user_id_log = current_user.id
    username_log = current_user.username
    
    # Deleta o usuário do banco de dados
    db.delete(current_user)
    db.commit()
    
    # Cria um log registrando a autoexclusão da conta
    create_log(db, user_id_log, "WARNING", f"Usuário '{username_log}' (ID: {user_id_log}) deletou a própria conta.")

    return