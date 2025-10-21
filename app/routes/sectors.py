# app/routes/sectors.py

"""
Módulo de Rotas para Gerenciamento de Setores

Este arquivo define os endpoints da API para criar, listar, atualizar e
deletar setores (departamentos) da instituição.

Dependências:
- FastAPI: Para a criação do roteador e gerenciamento das requisições.
- SQLAlchemy: Para a interação com o banco de dados.
- Módulos de modelos e schemas: Para a estrutura de dados e validação.
- Módulos de utilitários: security (para proteger as rotas) e logging_utils.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.database import get_db
from app.models.sector import Sector
from app.schemas.sector import SectorOut, SectorCreate, SectorUpdate
from app.schemas.pagination import Page
from app.security import get_current_user, get_current_admin_user
from app.models.user import User
from app.logging_utils import create_log

# Cria um roteador FastAPI para agrupar os endpoints de setores
router = APIRouter(
    prefix="/sectors",
    tags=["Sectors"]
)

@router.post("/", response_model=SectorOut, status_code=status.HTTP_201_CREATED)
def create_sector(
    sector: SectorCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Cria um novo setor.
    A rota é protegida e requer permissões de administrador.
    """
    # Verifica se já existe um setor com o mesmo nome para evitar duplicatas
    db_sector = db.query(Sector).filter(Sector.name == sector.name).first()
    if db_sector:
        raise HTTPException(status_code=400, detail="A sector with this name already exists.")
    
    # Cria a nova instância do modelo Sector e a salva no banco de dados
    new_sector = Sector(**sector.dict())
    db.add(new_sector)
    db.commit()
    db.refresh(new_sector)
    
    create_log(db, admin_user.id, "INFO", f"Admin '{admin_user.username}' criou o setor '{new_sector.name}' (ID: {new_sector.id}).")

    return new_sector

@router.get("/", response_model=Page[SectorOut])
def list_sectors(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=1000)
):
    """
    Lista todos os setores disponíveis com busca e paginação.
    Esta rota é pública para usuários autenticados.
    """
    query = db.query(Sector)
    
    # Aplica um filtro de busca se o parâmetro 'search' for fornecido
    if search:
        query = query.filter(Sector.name.ilike(f"%{search}%"))

    # Calcula o total de itens para a paginação
    total = query.count()
    
    # Aplica a ordenação, paginação e executa a consulta
    sectors = query.order_by(Sector.name).offset((page - 1) * size).limit(size).all()
    
    # Retorna os dados no formato do schema de paginação
    return {
        "items": sectors,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size)
    }

@router.put("/{sector_id}", response_model=SectorOut)
def update_sector(
    sector_id: int,
    sector_update: SectorUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Atualiza o nome de um setor.
    """
    db_sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not db_sector:
        raise HTTPException(status_code=404, detail="Sector not found.")
    
    old_name = db_sector.name  # Guarda o nome antigo para o log
    
    # Atualiza os campos do objeto com os dados da requisição
    update_data = sector_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sector, key, value)
        
    db.commit()
    db.refresh(db_sector)
    
    create_log(db, admin_user.id, "INFO", f"Admin '{admin_user.username}' atualizou o setor ID {sector_id} de '{old_name}' para '{db_sector.name}'.")

    return db_sector

@router.delete("/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    (Admin) Deleta um setor.
    """
    db_sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not db_sector:
        raise HTTPException(status_code=404, detail="Sector not found.")
    
    sector_name_log = db_sector.name # Guarda o nome para o log
    
    db.delete(db_sector)
    db.commit()
    
    create_log(db, admin_user.id, "WARNING", f"Admin '{admin_user.username}' deletou o setor '{sector_name_log}' (ID: {sector_id}).")

    return