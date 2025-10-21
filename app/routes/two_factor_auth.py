# app/routes/two_factor_auth.py

"""
Módulo de Rotas para Autenticação de Dois Fatores (2FA)

Este arquivo define os endpoints para configurar, gerar QR code, ativar e
desativar a autenticação de dois fatores para a conta de um usuário.

Dependências:
- FastAPI: Para a criação do roteador e gerenciamento de requisições.
- pyotp: Para a geração e verificação de senhas de uso único (OTP).
- qrcode: Para a criação da imagem do QR Code.
- Módulos da aplicação: database, models, schemas, security, logging_utils.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
import pyotp
import qrcode
from io import BytesIO

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    TwoFactorSetupResponse, TwoFactorEnableRequest, TwoFactorDisableRequest
)
from app.security import get_current_user, verify_password, verify_otp
from app.logging_utils import create_log

router = APIRouter(
    prefix="/2fa",
    tags=["Two-Factor Authentication"]
)

@router.get("/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(current_user: User = Depends(get_current_user)):
    """
    Gera um novo segredo OTP para o usuário, mas não o ativa ainda.
    Retorna o segredo e uma URI de provisionamento para o QR code.
    """
    if current_user.otp_enabled:
        raise HTTPException(status_code=400, detail="A autenticação de dois fatores já está ativa.")

    # Gera um segredo OTP aleatório no formato base32
    otp_secret = pyotp.random_base32()
    
    # Cria uma URI de provisionamento padrão (otpauth://) que pode ser lida por apps autenticadores
    provisioning_uri = pyotp.totp.TOTP(otp_secret).provisioning_uri(
        name=current_user.email,  # Identificador do usuário no app autenticador
        issuer_name="EquipControl"   # Nome da aplicação que aparecerá no app
    )
    
    return {"otp_secret": otp_secret, "provisioning_uri": provisioning_uri}

@router.get("/qr-code")
def get_2fa_qr_code(provisioning_uri: str):
    """
    Gera uma imagem QR Code a partir da URI de provisionamento.
    """
    img = qrcode.make(provisioning_uri)
    buf = BytesIO()  # Cria um buffer de bytes em memória
    img.save(buf, "PNG")
    buf.seek(0)  # Retorna o cursor para o início do buffer
    
    # Retorna os bytes da imagem PNG diretamente na resposta HTTP
    return Response(content=buf.getvalue(), media_type="image/png")

@router.post("/enable")
def enable_2fa(
    request: TwoFactorEnableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifica o código OTP inicial e ativa o 2FA para o usuário.
    """
    if not hasattr(request, 'otp_secret') or not request.otp_secret:
         raise HTTPException(status_code=400, detail="Segredo OTP não fornecido.")

    # Verifica se o código OTP fornecido é válido para o segredo gerado
    if not verify_otp(request.otp_secret, request.otp_code):
        raise HTTPException(status_code=400, detail="Código OTP inválido.")

    # Se o código for válido, salva o segredo e ativa o 2FA no perfil do usuário
    current_user.otp_secret = request.otp_secret
    current_user.otp_enabled = True
    db.commit()

    create_log(db, current_user.id, "INFO", f"Usuário '{current_user.username}' ativou a autenticação de dois fatores (2FA).")

    return {"message": "2FA ativado com sucesso."}


@router.post("/disable")
def disable_2fa(
    request: TwoFactorDisableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Desativa o 2FA para o usuário após verificar a senha e um código OTP.
    """
    if not current_user.otp_enabled:
        raise HTTPException(status_code=400, detail="2FA não está ativo.")

    # Exige a senha do usuário como uma camada extra de segurança
    if not verify_password(request.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Senha incorreta.")

    # Exige também um código OTP válido para confirmar a ação
    if not verify_otp(current_user.otp_secret, request.otp_code):
        raise HTTPException(status_code=401, detail="Código OTP inválido.")

    # Se ambas as verificações passarem, remove o segredo e desativa o 2FA
    current_user.otp_secret = None
    current_user.otp_enabled = False
    db.commit()

    create_log(db, current_user.id, "WARNING", f"Usuário '{current_user.username}' desativou a autenticação de dois fatores (2FA).")

    return {"message": "2FA desativado com sucesso."}