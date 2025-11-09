# tests/conftest.py

"""
Arquivo de Configuração do Pytest (conftest.py)

Este arquivo define fixtures reutilizáveis que são injetadas automaticamente
pelo Pytest nos módulos de teste. Ele é essencial para configurar o ambiente
de teste, como o banco de dados e o cliente da aplicação.

Principais Fixtures:
- db_session: Cria um banco de dados de teste limpo (em arquivo) para cada
  função de teste, garantindo o isolamento.
- client: Fornece um 'TestClient' do FastAPI que usa o banco de dados de teste.
- test_user: Cria um usuário padrão no banco de dados de teste para ser
  usado em testes de login e de rotas protegidas.
"""

# --- Importações Padrão ---
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# --- Configuração do Banco de Dados de Teste ---
# Define o caminho para um arquivo de banco de dados SQLite de teste.
# Usar um arquivo em vez de ':memory:' pode ajudar a depurar e é mais
# próximo de um ambiente real, embora um pouco mais lento.
TEST_DB_FILE = "./test.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

# --- Ordem de Importação Crítica ---

# 1. Importa a 'Base' e 'get_db' da aplicação principal.
from app.database import Base, get_db

# 2. Importa TODOS os modelos ORM para que a 'Base.metadata' os conheça.
from app.models.user import User
from app.models.sector import Sector
from app.models.reservation import Reservation
from app.models.google_token import GoogleOAuthToken
from app.models.activity_log import ActivityLog
from app.models.token_blacklist import TokenBlacklist
from app.models.equipment_type import EquipmentType
from app.models.equipment_unit import EquipmentUnit
from app.models.unit_history import UnitHistory

# 3. Importa dependências necessárias para as fixtures.
from app.security import get_password_hash

# --- Configuração do Engine e Sessão de Teste ---
# Cria o engine do SQLAlchemy para o banco de dados SQLite.
# 'check_same_thread': Necessário para o SQLite permitir conexões em
# diferentes threads, o que o Pytest pode fazer.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
# Cria uma fábrica de sessões de teste.
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Fixture do Pytest para criar e limpar o banco de dados para CADA teste.

    O 'scope="function"' garante que cada teste receba um banco de dados
    novo, proporcionando isolamento total entre os testes.

    Criação e Limpeza (Ciclo de Vida):
    1. Garante que o arquivo 'test.db' de um teste anterior seja removido.
    2. Cria todas as tabelas (Base.metadata.create_all).
    3. Cria uma nova sessão (db = TestingSessionLocal()).
    4. Fornece (yield) a sessão para o teste.
    5. Após o teste, fecha a sessão (db.close()).
    6. Destrói todas as tabelas (Base.metadata.drop_all).
    7. Força o engine a liberar conexões (engine.dispose()) para que o S.O.
       (especialmente o Windows) libere o "lock" do arquivo 'test.db'.
    8. Remove o arquivo 'test.db'.
    """
    # Garante que não haja um .db antigo de um teste que falhou
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except PermissionError:
            # Se a remoção falhar (ex: lock do S.O.), o dispose()
            # abaixo deve resolver isso para a próxima execução.
            pass

    # Cria todas as tabelas no arquivo ./test.db
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        # "yield" é o ponto onde a execução é passada para o teste
        yield db
    finally:
        # Após o teste (mesmo que falhe), este bloco é executado
        db.close()
        # Destrói todas as tabelas
        Base.metadata.drop_all(bind=engine)
        
        # Força o engine a soltar todas as conexões
        # Isso é crucial para o Windows (WinError 32) liberar o lock do 'test.db'
        engine.dispose() 
        
        # Remove o arquivo de banco de dados
        if os.path.exists(TEST_DB_FILE):
            os.remove(TEST_DB_FILE)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Fixture do Pytest para criar um 'TestClient' do FastAPI.

    Este cliente é usado para fazer requisições HTTP (GET, POST, etc.)
    à nossa aplicação FastAPI em memória, simulando um usuário.

    A importação do 'app' é feita DENTRO da fixture para garantir que
    a configuração da aplicação (leitura de .env, etc.) ocorra no
    momento certo.

    Ele também sobrescreve a dependência 'get_db' da aplicação real
    para usar a sessão de banco de dados de teste ('db_session').
    """
    
    # 4. Importa 'app' (de main) por ÚLTIMO e DENTRO da fixture.
    from main import app

    def override_get_db():
        """
        Função de substituição (override) da dependência 'get_db'.
        Garante que as rotas da aplicação usem a sessão de teste (db_session)
        em vez da sessão de produção.
        """
        yield db_session

    # Aplica a substituição da dependência na aplicação FastAPI
    app.dependency_overrides[get_db] = override_get_db
    
    # 'with TestClient(app) as c:' gerencia o ciclo de vida da app de teste
    with TestClient(app) as c:
        yield c # Fornece o cliente para o teste
    
    # Limpa os overrides após o teste para evitar interferência
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session: Session) -> User:
    """
    Fixture que cria um usuário padrão (User) no banco de dados de teste.

    Este usuário é pré-cadastrado, verificado e ativo, e já aceitou os termos.
    É usado pela maioria dos testes que precisam de um usuário autenticado
    para testar login ou rotas protegidas.
    """
    user = User(
        username="Test User",
        email="test@example.com",
        password_hash=get_password_hash("ValidPassword123!"),
        role="user",       # Permissão padrão
        is_active=True,    # Conta ativa
        is_verified=True,  # E-mail verificado
        terms_accepted=True  # Termos aceitos (corrige 403 no login)
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user