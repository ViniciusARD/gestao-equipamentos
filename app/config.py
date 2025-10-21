# app/config.py

"""
Módulo de Configuração da Aplicação

Este módulo define e carrega as configurações da aplicação utilizando a biblioteca
Pydantic. Ele centraliza todas as variáveis de ambiente necessárias para a
execução do sistema, como configurações de banco de dados, chaves secretas
para JWT, integração com a API do Google e credenciais para o serviço de
envio de e-mails.

As configurações são lidas de um arquivo .env na raiz do projeto.

Dependências:
- pydantic_settings: Para carregar e validar as variáveis de ambiente.
"""

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Define a estrutura das variáveis de configuração da aplicação.

    A classe herda de BaseSettings, que automaticamente lê as variáveis
    de um arquivo .env ou do ambiente do sistema.
    """
    # --- Variáveis lidas diretamente do arquivo .env (obrigatórias) ---
    DATABASE_URL: str          # URL de conexão com o banco de dados PostgreSQL
    SECRET_KEY: str            # Chave secreta para operações internas do FastAPI (ex: cookies)
    JWT_SECRET_KEY: str        # Chave secreta específica para codificar e decodificar tokens JWT

    # --- Novas variáveis para a integração com o Google ---
    GOOGLE_CLIENT_ID: str      # ID do cliente OAuth2 do Google
    GOOGLE_CLIENT_SECRET: str  # Chave secreta do cliente OAuth2 do Google

    # --- Variáveis para envio de email (lidas do .env) ---
    MAIL_USERNAME: str         # Nome de usuário do servidor de e-mail (ex: seu e-mail do Gmail)
    MAIL_PASSWORD: str         # Senha do servidor de e-mail (recomenda-se senha de aplicativo)
    MAIL_FROM: str             # E-mail remetente que aparecerá nas mensagens
    MAIL_PORT: int             # Porta do servidor SMTP (ex: 587 para TLS)
    MAIL_SERVER: str           # Endereço do servidor SMTP (ex: "smtp.gmail.com")
    MAIL_STARTTLS: bool        # Se deve usar STARTTLS para a conexão
    MAIL_SSL_TLS: bool         # Se deve usar uma conexão SSL/TLS direta

    # --- Variáveis com valores padrão (podem ser sobrescritas no .env) ---
    ALGORITHM: str = "HS256"  # Algoritmo de criptografia para os tokens JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # Tempo de validade do token de acesso em minutos
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # Tempo de validade do refresh token em dias

    class Config:
        """
        Classe de configuração interna para o Pydantic, que especifica de onde
        carregar as variáveis de ambiente.
        """
        env_file = ".env"  # Nome do arquivo de onde as variáveis serão lidas

# Cria uma instância única da classe Settings que será importada e utilizada
# em toda a aplicação para acessar as configurações.
settings = Settings()