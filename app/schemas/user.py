# app/schemas/user.py

from pydantic import BaseModel, EmailStr

# Schema base com os campos comuns
class UserBase(BaseModel):
    username: str
    email: EmailStr

# Schema para a criação de um usuário (recebe a senha)
class UserCreate(UserBase):
    password: str

# Schema para o corpo da requisição de login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema para a resposta da API (não envia a senha de volta)
class UserOut(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True # Permite que o Pydantic leia dados de um objeto ORM (SQLAlchemy)

# Schema para a resposta do token
class Token(BaseModel):
    access_token: str
    token_type: str

# --- NOVO: Schemas para o fluxo de "Esqueci minha senha" ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str