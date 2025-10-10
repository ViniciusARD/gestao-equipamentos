# app/schemas/user.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from .sector import SectorOut

# Schema base com os campos comuns
class UserBase(BaseModel):
    username: str
    email: EmailStr

# Schema para a criação de um usuário (recebe a senha)
class UserCreate(UserBase):
    password: str
    password_confirm: str
    sector_id: Optional[int] = None
    terms_accepted: bool

# Schema para o corpo da requisição de login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema para a resposta da API (não envia a senha de volta)
class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    is_verified: bool
    otp_enabled: bool
    sector: Optional[SectorOut] = None

    class Config:
        from_attributes = True

# Schema para a resposta do token
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

# NOVO SCHEMA
class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Schema para login com 2FA
class LoginResponse(BaseModel):
    login_step: str 
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    temp_token: Optional[str] = None

class TwoFactorRequest(BaseModel):
    temp_token: str
    otp_code: str

# Schemas para o fluxo de "Esqueci minha senha" ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    new_password_confirm: str

 # Schema para atualização do perfil do usuário ---
class UserUpdate(BaseModel):
    username: Optional[str] = None
    sector_id: Optional[int] = None

# Schemas para 2FA
class TwoFactorSetupResponse(BaseModel):
    otp_secret: str
    provisioning_uri: str

class TwoFactorEnableRequest(BaseModel):
    otp_code: str
    otp_secret: str

class TwoFactorDisableRequest(BaseModel):
    password: str
    otp_code: str