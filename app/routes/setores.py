# app/routes/setores.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.setor import Setor
from app.schemas.setor import SetorCreate, SetorOut, SetorUpdate
from app.security import get_current_admin_user, get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/setores",
    tags=["Setores"]
)

@router.post("/", response_model=SetorOut, status_code=status.HTTP_201_CREATED)
def create_setor(
    setor: SetorCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Cria um novo setor."""
    db_setor = db.query(Setor).filter(Setor.name == setor.name).first()
    if db_setor:
        raise HTTPException(status_code=400, detail="Um setor com este nome já existe.")
    new_setor = Setor(**setor.dict())
    db.add(new_setor)
    db.commit()
    db.refresh(new_setor)
    return new_setor

@router.get("/", response_model=List[SetorOut])
def list_setores(
    db: Session = Depends(get_db),
    # Adicionamos o parâmetro de busca (search) opcional
    search: Optional[str] = Query(None),
    # A autenticação é necessária para proteger a rota de busca
    current_user: User = Depends(get_current_user)
):
    """Lista todos os setores disponíveis, com filtro de busca (acesso autenticado)."""
    query = db.query(Setor)
    if search:
        # Filtra o nome do setor se um termo de busca for fornecido
        query = query.filter(Setor.name.ilike(f"%{search}%"))
    return query.order_by(Setor.name).all()


@router.put("/{setor_id}", response_model=SetorOut)
def update_setor(
    setor_id: int,
    setor_update: SetorUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Atualiza o nome de um setor."""
    db_setor = db.query(Setor).filter(Setor.id == setor_id).first()
    if not db_setor:
        raise HTTPException(status_code=404, detail="Setor não encontrado.")
    
    update_data = setor_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_setor, key, value)
        
    db.commit()
    db.refresh(db_setor)
    return db_setor

@router.delete("/{setor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_setor(
    setor_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Deleta um setor."""
    db_setor = db.query(Setor).filter(Setor.id == setor_id).first()
    if not db_setor:
        raise HTTPException(status_code=404, detail="Setor não encontrado.")
    db.delete(db_setor)
    db.commit()
    return