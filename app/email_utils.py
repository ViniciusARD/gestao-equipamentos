# app/email_utils.py

"""
Módulo Utilitário para Envio de E-mails

Este módulo gerencia o envio de todos os e-mails transacionais da aplicação.
Ele configura a conexão com o servidor SMTP usando as credenciais do arquivo .env
e define funções assíncronas para enviar diferentes tipos de e-mails,
utilizando templates HTML para formatar o conteúdo.

Dependências:
- fastapi_mail: Para a configuração e envio dos e-mails.
- app.config: Para carregar as credenciais e configurações do servidor de e-mail.
- app.models: Para tipagem e acesso a dados de objetos como User e Reservation.
"""

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pathlib import Path
from typing import List
from datetime import datetime
from app.config import settings
from app.models.reservation import Reservation
from app.models.user import User

# Configura a conexão com o servidor SMTP utilizando as variáveis de ambiente
# carregadas pelo objeto `settings`.
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
    # Define o caminho para a pasta que contém os templates de e-mail (HTML)
    TEMPLATE_FOLDER=Path(__file__).parent / 'templates'
)

async def send_verification_email(email_to: str, username: str, token: str):
    """
    Envia um e-mail para o usuário com um link para verificar sua conta.

    Args:
        email_to (str): O endereço de e-mail do destinatário.
        username (str): O nome de usuário para personalizar a saudação.
        token (str): O token JWT de verificação a ser incluído no link.
    """
    # Monta o link de verificação que será inserido no corpo do e-mail
    verification_link = f"http://127.0.0.1:5500/frontend/verify-email.html?token={token}"
    template_body = {"username": username, "verification_link": verification_link}
    
    # Cria o objeto da mensagem
    message = MessageSchema(
        subject="Verifique sua conta - Sistema de Gestão de Equipamentos",
        recipients=[email_to],
        template_body=template_body,
        subtype="html"
    )
    
    # Envia o e-mail utilizando o template especificado
    fm = FastMail(conf)
    await fm.send_message(message, template_name="email_verification.html")

async def send_reset_password_email(email_to: str, username: str, token: str):
    """
    Envia um e-mail para o usuário com um link para redefinir sua senha.

    Args:
        email_to (str): O endereço de e-mail do destinatário.
        username (str): O nome de usuário para a saudação.
        token (str): O token JWT de redefinição de senha.
    """
    reset_link = f"http://127.0.0.1:5500/frontend/reset_password_form.html?token={token}"
    template_body = {"username": username, "reset_link": reset_link}
    
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
    Envia um e-mail notificando o usuário sobre a mudança de status de sua reserva (aprovada/rejeitada).

    Args:
        reservation (Reservation): O objeto da reserva contendo todos os detalhes.
    """
    # Mapeia o status da reserva para o assunto e template de e-mail correspondente
    status_map = {
        'approved': {'subject': 'Sua reserva foi APROVADA!', 'template': 'reservation_approved.html'},
        'rejected': {'subject': 'Sua reserva foi REJEITADA', 'template': 'reservation_rejected.html'}
    }
    status_info = status_map.get(reservation.status)
    if not status_info:
        return  # Não faz nada se o status não for 'approved' ou 'rejected'

    # Prepara os dados que serão usados no template HTML
    template_body = {
        "username": reservation.user.username,
        "equipment_name": reservation.equipment_unit.equipment_type.name,
        "unit_identifier": reservation.equipment_unit.identifier_code or f"ID {reservation.equipment_unit.id}",
        "equipment_serial_number": reservation.equipment_unit.serial_number,
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

async def send_reservation_pending_email(reservation: Reservation):
    """
    Envia um e-mail confirmando que a solicitação de reserva foi recebida e está pendente.

    Args:
        reservation (Reservation): O objeto da reserva.
    """
    template_body = {
        "username": reservation.user.username,
        "equipment_name": reservation.equipment_unit.equipment_type.name,
        "unit_identifier": reservation.equipment_unit.identifier_code or f"ID {reservation.equipment_unit.id}",
        "equipment_serial_number": reservation.equipment_unit.serial_number,
        "start_time": reservation.start_time.strftime('%d/%m/%Y às %H:%M'),
        "end_time": reservation.end_time.strftime('%d/%m/%Y às %H:%M'),
    }
    
    message = MessageSchema(
        subject="Sua solicitação de reserva foi recebida!",
        recipients=[reservation.user.email],
        template_body=template_body,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message, template_name="reservation_pending.html")

async def send_new_reservation_to_managers_email(managers: List[User], reservation: Reservation):
    """
    Envia um e-mail para todos os gerentes e administradores sobre uma nova solicitação de reserva.

    Args:
        managers (List[User]): Uma lista de objetos de usuário que são gerentes ou administradores.
        reservation (Reservation): O objeto da nova reserva.
    """
    recipients = [manager.email for manager in managers]
    if not recipients:
        return

    template_body = {
        "requester_name": reservation.user.username,
        "requester_email": reservation.user.email,
        "equipment_name": reservation.equipment_unit.equipment_type.name,
        "unit_identifier": reservation.equipment_unit.identifier_code or f"ID {reservation.equipment_unit.id}",
        "equipment_serial_number": reservation.equipment_unit.serial_number,
        "start_time": reservation.start_time.strftime('%d/%m/%Y às %H:%M'),
        "end_time": reservation.end_time.strftime('%d/%m/%Y às %H:%M'),
    }

    message = MessageSchema(
        subject="[Aprovação Necessária] Nova Solicitação de Reserva de Equipamento",
        recipients=recipients,
        template_body=template_body,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message, template_name="new_reservation_for_manager.html")

async def send_reservation_overdue_email(reservation: Reservation):
    """
    Envia um e-mail de lembrete de devolução para uma reserva atrasada.

    Args:
        reservation (Reservation): O objeto da reserva atrasada.
    """
    template_body = {
        "username": reservation.user.username,
        "equipment_name": reservation.equipment_unit.equipment_type.name,
        "unit_identifier": reservation.equipment_unit.identifier_code or f"ID {reservation.equipment_unit.id}",
        "equipment_serial_number": reservation.equipment_unit.serial_number,
        "end_time": reservation.end_time.strftime('%d/%m/%Y às %H:%M'),
    }
    
    message = MessageSchema(
        subject="[AVISO] Devolução de Equipamento Atrasada",
        recipients=[reservation.user.email],
        template_body=template_body,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message, template_name="reservation_overdue.html")

async def send_reservation_returned_email(reservation: Reservation):
    """
    Envia um e-mail de confirmação de devolução de equipamento.

    Args:
        reservation (Reservation): O objeto da reserva que foi devolvida.
    """
    template_body = {
        "username": reservation.user.username,
        "equipment_name": reservation.equipment_unit.equipment_type.name,
        "unit_identifier": reservation.equipment_unit.identifier_code or f"ID {reservation.equipment_unit.id}",
        "equipment_serial_number": reservation.equipment_unit.serial_number,
        "return_time": datetime.now().strftime('%d/%m/%Y às %H:%M'),
        "return_notes": reservation.return_notes
    }
    
    message = MessageSchema(
        subject="Confirmação de Devolução de Equipamento",
        recipients=[reservation.user.email],
        template_body=template_body,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message, template_name="reservation_returned.html")