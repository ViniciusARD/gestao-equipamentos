# app/models/activity_log.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'activity_logs'.

Esta tabela é usada para auditoria e registro de eventos importantes no sistema,
como logins, criação de usuários, alterações de status de reservas, etc.

Dependências:
- sqlalchemy: Para a definição do modelo e suas colunas.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class ActivityLog(Base):
    """
    Representa uma entrada de log de atividade no banco de dados.
    """
    __tablename__ = 'activity_logs'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    
    # ID do usuário que realizou a ação. Pode ser nulo para ações do sistema.
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Nível do log (ex: 'INFO', 'WARNING', 'ERROR') para categorizar a importância do evento.
    level = Column(String(10), nullable=False)
    
    # Mensagem descritiva detalhando o evento que ocorreu.
    message = Column(Text, nullable=False)
    
    # Data e hora em que o log foi criado. 'server_default=func.now()' garante
    # que o banco de dados preencha este campo automaticamente com o timestamp atual.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relacionamento ORM ---
    # Define a relação com a tabela 'users', criando a referência inversa no modelo User.
    user = relationship("User", back_populates="activity_logs")