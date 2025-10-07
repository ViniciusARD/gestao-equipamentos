# app/routes/two_factor_auth.py

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

    otp_secret = pyotp.random_base32()
    provisioning_uri = pyotp.totp.TOTP(otp_secret).provisioning_uri(
        name=current_user.email,
        issuer_name="EquipControl"
    )
    
    return {"otp_secret": otp_secret, "provisioning_uri": provisioning_uri}

@router.get("/qr-code")
def get_2fa_qr_code(provisioning_uri: str):
    """
    Gera uma imagem QR Code a partir da URI de provisionamento.
    """
    img = qrcode.make(provisioning_uri)
    buf = BytesIO()
    img.save(buf, "PNG")
    buf.seek(0)
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
    # O frontend agora envia o otp_secret no corpo da requisição.
    # Vamos verificar se ele está presente.
    if not hasattr(request, 'otp_secret') or not request.otp_secret:
         raise HTTPException(status_code=400, detail="Segredo OTP não fornecido.")

    if not verify_otp(request.otp_secret, request.otp_code):
        raise HTTPException(status_code=400, detail="Código OTP inválido.")

    current_user.otp_secret = request.otp_secret
    current_user.otp_enabled = True
    db.commit()

    return {"message": "2FA ativado com sucesso."}


@router.post("/disable")
def disable_2fa(
    request: TwoFactorDisableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Desativa o 2FA para o usuário após verificar senha e um código OTP.
    """
    if not current_user.otp_enabled:
        raise HTTPException(status_code=400, detail="2FA não está ativo.")

    if not verify_password(request.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Senha incorreta.")

    if not verify_otp(current_user.otp_secret, request.otp_code):
        raise HTTPException(status_code=401, detail="Código OTP inválido.")

    current_user.otp_secret = None
    current_user.otp_enabled = False
    db.commit()

    return {"message": "2FA desativado com sucesso."}