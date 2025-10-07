# app/google_calendar_utils.py

import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build, Resource
from googleapiclient.errors import HttpError

from app.models.reservation import Reservation

def get_calendar_service(user_token: str) -> Resource:
    """Cria um serviço do Google Calendar a partir do token JSON do usuário."""
    creds = Credentials.from_authorized_user_info(json.loads(user_token))
    service = build('calendar', 'v3', credentials=creds)
    return service

def create_calendar_event(service: Resource, reservation: Reservation):
    """Cria um evento no Google Calendar para uma reserva aprovada."""
    
    event_body = {
        'summary': f"Reserva de Equipamento: {reservation.equipment_unit.equipment_type.name}",
        'location': 'Sala de Equipamentos da Instituição',
        'description': f'Reserva da unidade "{reservation.equipment_unit.identifier_code or reservation.equipment_unit.id}"'
                       f' (Tipo: {reservation.equipment_unit.equipment_type.name}).\n'
                       f'Reservado por: {reservation.user.username}.',
        'start': {
            'dateTime': reservation.start_time.isoformat(),
            'timeZone': 'America/Sao_Paulo',
        },
        'end': {
            'dateTime': reservation.end_time.isoformat(),
            'timeZone': 'America/Sao_Paulo',
        },
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60}, # Lembrete 1 dia antes
                {'method': 'popup', 'minutes': 60},     # Lembrete 1 hora antes
            ],
        },
    }

    try:
        event = service.events().insert(calendarId='primary', body=event_body).execute()
        print(f"Evento criado: {event.get('htmlLink')}")
        return event
    except HttpError as error:
        print(f"Ocorreu um erro: {error}")
        return None