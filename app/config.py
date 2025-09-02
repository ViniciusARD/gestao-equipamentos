# app/config.py

# A importação foi corrigida para usar a nova biblioteca pydantic_settings
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Variáveis lidas do arquivo .env
    DATABASE_URL: str
    SECRET_KEY: str
    JWT_SECRET_KEY: str

    # Variáveis com valores padrão
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 # O token expira em 60 minutos

    class Config:
        # Aponta para o arquivo .env na pasta raiz do projeto
        env_file = ".env"

# Cria uma instância das configurações que será usada em todo o projeto
settings = Settings()