# app/email_utils.py

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pathlib import Path
from app.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(__file__).parent / 'templates'
)

async def send_verification_email(email_to: str, username: str, token: str):
    """Envia o email de verificação de conta."""
    verification_link = f"http://127.0.0.1:5500/frontend/verify-email.html?token={token}"

    template_body = {
        "username": username,
        "verification_link": verification_link,
    }

    message = MessageSchema(
        subject="Verifique sua conta - Sistema de Gestão de Equipamentos",
        recipients=[email_to],
        template_body=template_body,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message, template_name="email_verification.html")


async def send_reset_password_email(email_to: str, username: str, token: str):
    """
    Envia o email de redefinição de senha para o usuário.
    """
    # --- ALTERAÇÃO AQUI ---
    # O link agora aponta para um endereço web local, que é confiável para os clientes de e-mail.
    reset_link = f"http://127.0.0.1:5500/frontend/reset_password_form.html?token={token}"

    template_body = {
        "username": username,
        "reset_link": reset_link,
    }

    message = MessageSchema(
        subject="Redefinição de Senha - Sistema de Gestão de Equipamentos",
        recipients=[email_to],
        template_body=template_body,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message, template_name="password_reset.html")