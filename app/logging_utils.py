# app/logging_utils.py

from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog

def create_log(db: Session, user_id: int | None, level: str, message: str):
    """
    Cria e salva uma nova entrada de log no banco de dados.
    """
    log_entry = ActivityLog(
        user_id=user_id,
        level=level.upper(),
        message=message
    )
    db.add(log_entry)
    db.commit()