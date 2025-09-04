# app/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Variáveis lidas do arquivo .env
    DATABASE_URL: str
    SECRET_KEY: str
    JWT_SECRET_KEY: str
    
    # Novas variáveis para a integração com o Google
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # Variáveis com valores padrão
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"

settings = Settings()