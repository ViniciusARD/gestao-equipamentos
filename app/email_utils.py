# app/email_utils.py

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pathlib import Path
from app.config import settings
from app.models.reservation import Reservation

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

async def send_reservation_status_email(reservation: Reservation):
    """
    Envia um e-mail notificando o usuário sobre a mudança de status da sua reserva.
    """
    status_map = {
        'approved': {'subject': 'Sua reserva foi APROVADA!', 'template': 'reservation_approved.html'},
        'rejected': {'subject': 'Sua reserva foi REJEITADA', 'template': 'reservation_rejected.html'}
    }

    status_info = status_map.get(reservation.status)
    if not status_info:
        return

    template_body = {
        "username": reservation.user.username,
        "equipment_name": reservation.equipment_unit.equipment_type.name,
        "unit_identifier": reservation.equipment_unit.identifier_code or f"ID {reservation.equipment_unit.id}",
        "start_time": reservation.start_time.strftime('%d/%m/%Y às %H:%M'),
        "end_time": reservation.end_time.strftime('%d/%m/%Y às %H:%M'),
    }

    message = MessageSchema(
        subject=status_info['subject'],
        recipients=[reservation.user.email],
        template_body=template_body,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message, template_name=status_info['template'])