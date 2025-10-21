# app/models/user.py

"""
Define o modelo ORM do SQLAlchemy para a tabela 'users'.
Esta tabela armazena todas as informações dos usuários do sistema.

Dependências:
- sqlalchemy: Para a definição do modelo, colunas e relacionamentos.
- app.database.Base: A classe base declarativa para os modelos ORM.
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property  # Importa a funcionalidade de propriedade híbrida
from app.database import Base

class User(Base):
    """
    Representa um usuário no banco de dados.

    Cada atributo da classe mapeia para uma coluna na tabela 'users'.
    """
    __tablename__ = 'users'

    # --- Colunas da Tabela ---
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False, default='user')  # Ex: 'user', 'requester', 'manager', 'admin'
    
    # Chave estrangeira que liga o usuário a um setor. Opcional (nullable=True).
    sector_id = Column(Integer, ForeignKey('sectors.id'), nullable=True)

    is_active = Column(Boolean, default=True)      # Se a conta do usuário está ativa ou não
    is_verified = Column(Boolean, default=False)   # Se o e-mail do usuário foi verificado
    otp_secret = Column(String(32), nullable=True) # Segredo para autenticação de dois fatores (2FA)
    otp_enabled = Column(Boolean, default=False)   # Se o 2FA está ativado para o usuário

    terms_accepted = Column(Boolean, default=False, nullable=False) # Se o usuário aceitou os termos
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True) # Data e hora da aceitação dos termos
    
    # Campo para controle de tentativas de login malsucedidas
    login_attempts = Column(Integer, default=0, nullable=False)

    # --- Relacionamentos ORM ---
    # Define a relação com a tabela 'sectors'. 'back_populates' cria a referência inversa no modelo Sector.
    sector = relationship("Sector", back_populates="users")
    
    # Define a relação com a tabela 'reservations'. 'cascade' garante que, se um usuário for deletado,
    # todas as suas reservas também sejam.
    reservations = relationship("Reservation", back_populates="user", cascade="all, delete-orphan")
    
    # Define a relação um-para-um com a tabela 'google_oauth_tokens'. 'uselist=False' indica que
    # um usuário terá no máximo um token.
    google_token = relationship("GoogleOAuthToken", back_populates="user", cascade="all, delete-orphan", uselist=False)

    # --- Propriedade Híbrida ---
    @hybrid_property
    def has_google_token(self):
        """
        Propriedade computada que verifica se um usuário tem um token do Google associado.
        
        Útil para ser usada nos schemas Pydantic e na lógica da aplicação,
        sem precisar criar um campo extra no banco de dados.
        """
        return self.google_token is not None