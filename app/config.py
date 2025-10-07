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
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # <-- NOVO

    # Novas variáveis para envio de email
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_STARTTLS: bool
    MAIL_SSL_TLS: bool

    class Config:
        env_file = ".env"

settings = Settings()