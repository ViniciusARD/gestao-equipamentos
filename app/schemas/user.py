# app/schemas/user.py

"""
Define os schemas Pydantic para validação e serialização de dados do usuário.

Este módulo contém as classes que definem a forma dos dados de usuário
para entrada (ex: criação, login) e saída (ex: resposta da API), garantindo
a validação automática dos dados e controlando quais informações são expostas.

Dependências:
- pydantic: Para a criação dos modelos de dados (schemas).
- app.schemas.sector: Para aninhar o schema de setor nas respostas de usuário.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from .sector import SectorOut

# --- Schemas Base e de Criação ---

class UserBase(BaseModel):
    """Schema base com os campos comuns a todos os outros schemas de usuário."""
    username: str
    email: EmailStr  # EmailStr valida automaticamente o formato do e-mail.

class UserCreate(UserBase):
    """
    Schema para a criação de um novo usuário.
    Recebe a senha e a confirmação para validação na rota.
    """
    password: str
    password_confirm: str
    sector_id: Optional[int] = None  # O setor do usuário é opcional.
    terms_accepted: bool             # Confirmação de que os termos foram aceitos.

class UserUpdate(BaseModel):
    """Schema para a atualização do perfil do usuário (pelo próprio usuário)."""
    username: Optional[str] = None
    sector_id: Optional[int] = None

# --- Schemas de Autenticação e Token ---

class UserLogin(BaseModel):
    """Schema para o corpo da requisição de login."""
    email: EmailStr
    password: str

class Token(BaseModel):
    """Schema para a resposta da API ao gerar tokens."""
    access_token: str
    refresh_token: str
    token_type: str

class RefreshTokenRequest(BaseModel):
    """Schema para a requisição de um novo access token usando um refresh token."""
    refresh_token: str

class LoginResponse(BaseModel):
    """
    Schema para a resposta de login, que pode ser em múltiplos passos (ex: 2FA).
    """
    login_step: str  # Ex: 'completed', '2fa_required', 'verification_required'
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    temp_token: Optional[str] = None # Token temporário para o fluxo de 2FA
    message: Optional[str] = None    # Mensagem informativa (ex: para verificação de e-mail)

# --- Schemas para Autenticação de Dois Fatores (2FA) ---

class TwoFactorRequest(BaseModel):
    """Schema para a verificação do código 2FA durante o login."""
    temp_token: str
    otp_code: str

class TwoFactorSetupResponse(BaseModel):
    """Schema para a resposta ao iniciar a configuração do 2FA."""
    otp_secret: str      # O segredo que o usuário salvará no app autenticador.
    provisioning_uri: str # A URI para gerar o QR Code.

class TwoFactorEnableRequest(BaseModel):
    """Schema para a requisição de ativação do 2FA."""
    otp_code: str    # O código fornecido pelo usuário para validar o setup.
    otp_secret: str  # O segredo que foi gerado no passo de setup.

class TwoFactorDisableRequest(BaseModel):
    """Schema para a requisição de desativação do 2FA."""
    password: str  # A senha do usuário, para segurança.
    otp_code: str  # Um código OTP válido, como confirmação final.

# --- Schemas para Recuperação de Senha ---

class ForgotPasswordRequest(BaseModel):
    """Schema para a solicitação de redefinição de senha."""
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    """Schema para a submissão da nova senha com o token de redefinição."""
    token: str
    new_password: str
    new_password_confirm: str

# --- Schema de Saída (Resposta da API) ---

class UserOut(UserBase):
    """
    Schema para a resposta da API ao retornar dados de um usuário.
    Omite campos sensíveis como a senha.
    """
    id: int
    role: str
    is_active: bool
    is_verified: bool
    otp_enabled: bool
    has_google_token: bool  # Propriedade computada do modelo SQLAlchemy
    sector: Optional[SectorOut] = None # Aninha os dados do setor no usuário

    class Config:
        """
        Configuração do Pydantic para mapear automaticamente os atributos
        de um objeto ORM (SQLAlchemy) para este schema.
        """
        from_attributes = True