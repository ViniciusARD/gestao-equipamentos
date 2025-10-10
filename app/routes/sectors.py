# app/routes/sectors.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.sector import Sector
from app.schemas.sector import SectorCreate, SectorOut, SectorUpdate
from app.security import get_current_admin_user
from app.models.user import User

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
    """(Admin) Creates a new sector."""
    db_sector = db.query(Sector).filter(Sector.name == sector.name).first()
    if db_sector:
        raise HTTPException(status_code=400, detail="A sector with this name already exists.")
    new_sector = Sector(**sector.dict())
    db.add(new_sector)
    db.commit()
    db.refresh(new_sector)
    return new_sector

@router.get("/", response_model=List[SectorOut])
def list_sectors(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None)
):
    """Lists all available sectors (public access)."""
    query = db.query(Sector)
    if search:
        query = query.filter(Sector.name.ilike(f"%{search}%"))
    return query.order_by(Sector.name).all()


@router.put("/{sector_id}", response_model=SectorOut)
def update_sector(
    sector_id: int,
    sector_update: SectorUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Updates a sector's name."""
    db_sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not db_sector:
        raise HTTPException(status_code=404, detail="Sector not found.")
    
    update_data = sector_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sector, key, value)
        
    db.commit()
    db.refresh(db_sector)
    return db_sector

@router.delete("/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Deletes a sector."""
    db_sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not db_sector:
        raise HTTPException(status_code=404, detail="Sector not found.")
    db.delete(db_sector)
    db.commit()
    return