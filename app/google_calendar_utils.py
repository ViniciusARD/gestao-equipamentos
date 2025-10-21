# app/google_calendar_utils.py

"""
Módulo Utilitário para Integração com Google Calendar

Este módulo contém as funções para interagir com a API do Google Calendar.
É responsável por criar um serviço de API autenticado a partir do token
do usuário e por inserir novos eventos na agenda do usuário com base
nos detalhes de uma reserva aprovada.

Dependências:
- googleapiclient, google.oauth2: Bibliotecas do Google para a interação com a API.
- app.models.reservation: Para tipagem e acesso aos dados da reserva.
"""

import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build, Resource
from googleapiclient.errors import HttpError

from app.models.reservation import Reservation

def get_calendar_service(user_token: str) -> Resource:
    """
    Cria um serviço do Google Calendar a partir do token JSON do usuário.

    Este serviço é a interface autenticada para realizar chamadas à API.

    Args:
        user_token (str): A string JSON contendo as credenciais OAuth2 do usuário.

    Returns:
        Resource: Um objeto de recurso da API do Google Calendar, pronto para uso.
    """
    # Carrega as credenciais do usuário a partir da string JSON do token
    creds = Credentials.from_authorized_user_info(json.loads(user_token))
    # Constrói o objeto de serviço para a API do Calendar, versão 'v3'
    service = build('calendar', 'v3', credentials=creds)
    return service

def create_calendar_event(service: Resource, reservation: Reservation):
    """
    Cria um evento no Google Calendar para uma reserva aprovada.

    O evento é criado na agenda primária do usuário associado ao 'service'.

    Args:
        service (Resource): O objeto de serviço do Google Calendar já autenticado.
        reservation (Reservation): O objeto da reserva com todos os detalhes.

    Returns:
        dict: Um dicionário representando o evento criado pela API, ou None em caso de erro.
    """
    
    # Monta o corpo (body) do evento com os detalhes da reserva
    event_body = {
        'summary': f"Reserva de Equipamento: {reservation.equipment_unit.equipment_type.name}",
        'location': 'Sala de Equipamentos da Instituição',
        'description': (
            f'Reserva da unidade "{reservation.equipment_unit.identifier_code or reservation.equipment_unit.id}"'
            f' (Tipo: {reservation.equipment_unit.equipment_type.name}).\n'
            f'Reservado por: {reservation.user.username}.'
        ),
        'start': {
            'dateTime': reservation.start_time.isoformat(), # Formato ISO 8601
            'timeZone': 'America/Sao_Paulo',
        },
        'end': {
            'dateTime': reservation.end_time.isoformat(), # Formato ISO 8601
            'timeZone': 'America/Sao_Paulo',
        },
        'reminders': {
            'useDefault': False, # Usa lembretes personalizados
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60},  # Lembrete por e-mail 1 dia antes
                {'method': 'popup', 'minutes': 60},       # Lembrete em popup 1 hora antes
            ],
        },
    }

    try:
        # Chama a API para inserir o evento na agenda primária ('primary') do usuário
        event = service.events().insert(calendarId='primary', body=event_body).execute()
        print(f"Evento criado: {event.get('htmlLink')}")
        return event
    except HttpError as error:
        # Em caso de erro na chamada da API, imprime o erro e retorna None
        print(f"Ocorreu um erro: {error}")
        return None