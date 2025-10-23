# app/routes/admin.py

"""
Módulo de Rotas para Administração e Gerenciamento

Este arquivo define os endpoints para as funcionalidades acessíveis por Gerentes
e Administradores, como gerenciamento de reservas, usuários e visualização
de logs do sistema.

Dependências:
- FastAPI: Para a criação do roteador, dependências e tarefas em segundo plano.
- SQLAlchemy: Para a interação com o banco de dados.
- Módulos da aplicação: models, schemas, security, email_utils, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, desc, asc, case
from typing import List, Optional
from datetime import datetime, timezone
import asyncio
import math

from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.sector import Sector
from app.models.reservation import Reservation
from app.models.equipment_unit import EquipmentUnit
from app.models.equipment_type import EquipmentType
from app.models.google_token import GoogleOAuthToken
from app.models.unit_history import UnitHistory
from app.schemas.reservation import ReservationOut
from app.schemas.admin import ReservationStatusUpdate, UserRoleUpdate, UserSectorUpdate, UserStatusUpdate
from app.schemas.user import UserOut
from app.schemas.pagination import Page
from app.security import get_current_admin_user, get_current_manager_user
from app.google_calendar_utils import get_calendar_service, create_calendar_event
from app.models.activity_log import ActivityLog
from app.schemas.logs import ActivityLogOut
from app.email_utils import send_reservation_status_email, send_reservation_overdue_email, send_reservation_returned_email
from app.logging_utils import create_log

# Cria um roteador para agrupar todos os endpoints de administração
router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)

# --- TAREFAS EM SEGUNDO PLANO ---

def approve_and_create_calendar_event(reservation_id: int):
    """
    (SÍNCRONA) Tarefa em segundo plano para criar evento no Google Calendar.
    Cria sua própria sessão de banco de dados para operar de forma independente da requisição principal.
    """
    db = SessionLocal()
    try:
        # Busca a reserva e os dados do usuário associado
        reservation = db.query(Reservation).options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        ).filter(Reservation.id == reservation_id).first()
        if not reservation: return

        # Verifica se o usuário da reserva tem uma conta Google conectada
        google_token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == reservation.user.id).first()
        
        if google_token:
            create_log(db, reservation.user.id, "INFO", f"Tentando criar evento no Google Calendar para a reserva ID {reservation.id}.")
            try:
                # Tenta criar o evento no calendário do usuário
                service = get_calendar_service(google_token.token_json)
                create_calendar_event(service, reservation)
                create_log(db, reservation.user.id, "INFO", f"Evento criado com sucesso no Google Calendar para a reserva ID {reservation.id}.")
            except Exception as e:
                create_log(db, reservation.user.id, "ERROR", f"Falha ao criar evento no Google Calendar para a reserva ID {reservation.id}: {e}")
        else:
            create_log(db, reservation.user.id, "INFO", f"Usuário '{reservation.user.username}' não possui conta Google conectada. Evento para reserva ID {reservation.id} não foi criado.")
    finally:
        db.close() # Garante que a sessão seja fechada

async def task_send_reservation_email(reservation_id: int, email_type: str):
    """
    (ASSÍNCRONA) Tarefa em segundo plano para enviar e-mails de status, devolução ou atraso.
    Cria sua própria sessão de banco de dados.
    """
    db = SessionLocal()
    try:
        reservation = db.query(Reservation).options(
            joinedload(Reservation.user),
            joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
        ).filter(Reservation.id == reservation_id).first()
        if not reservation: return

        # Chama a função de envio de e-mail apropriada com base no tipo
        if email_type == 'status':
            await send_reservation_status_email(reservation)
        elif email_type == 'returned':
            await send_reservation_returned_email(reservation)
        elif email_type == 'overdue':
            await send_reservation_overdue_email(reservation)
    finally:
        db.close()

# --- ROTAS DE GERENCIAMENTO DE RESERVAS ---

@router.get("/reservations", response_model=Page[ReservationOut])
def list_all_reservations(
    db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_dir: Optional[str] = Query('asc'),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=1000)
):
    """(Gerente) Lista todas as reservas do sistema, com filtros avançados e paginação."""
    # Constrói a consulta base com joins para otimizar o carregamento de dados
    query = db.query(Reservation).join(Reservation.user).join(Reservation.equipment_unit).join(EquipmentUnit.equipment_type).options(
        joinedload(Reservation.user).joinedload(User.sector),
        joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
    )

    # Aplica filtros de busca por texto em múltiplos campos
    if search:
        search_term = f"%{search}%"
        filter_conditions = [
            User.username.ilike(search_term),
            User.email.ilike(search_term),
            EquipmentType.name.ilike(search_term),
            EquipmentUnit.identifier_code.ilike(search_term),
            EquipmentUnit.serial_number.ilike(search_term),
        ]
        if search.isdigit():
            filter_conditions.append(Reservation.id == int(search))
        query = query.filter(or_(*filter_conditions))

    # Aplica filtro por status, com um caso especial para "atrasadas"
    if status and status != "all":
        if status == "overdue":
            query = query.filter(Reservation.status == 'approved', Reservation.end_time < datetime.now(timezone.utc))
        else:
            query = query.filter(Reservation.status == status)
    
    # Aplica filtros de data
    if start_date: query = query.filter(Reservation.end_time >= start_date)
    if end_date: query = query.filter(Reservation.start_time <= end_date)

    # Lógica de ordenação
    sort_column_map = {
        'user': User.username,
        'equipment': EquipmentType.name,
        'status': Reservation.status,
        'start_time': Reservation.start_time,
        'end_time': Reservation.end_time,
        'created_at': Reservation.created_at
    }

    # Se uma ordenação específica for solicitada, aplica.
    if sort_by and sort_by in sort_column_map:
        sort_column = sort_column_map.get(sort_by)
        sort_direction = desc(sort_column) if sort_dir == 'desc' else asc(sort_column)
        query = query.order_by(sort_direction)
    else:
        # Caso contrário, aplica a ordenação padrão (pendentes primeiro, depois aprovadas, depois por data de início).
        status_sort_order = case(
            (Reservation.status == 'pending', 1),
            (Reservation.status == 'approved', 2),
            else_=3
        ).asc()
        query = query.order_by(status_sort_order, desc(Reservation.start_time))


    total = query.count()
    reservations = query.offset((page - 1) * size).limit(size).all()
    
    return {"items": reservations, "total": total, "page": page, "size": size, "pages": math.ceil(total / size)}

@router.patch("/reservations/{reservation_id}", response_model=ReservationOut)
def update_reservation_status(
    reservation_id: int, update_data: ReservationStatusUpdate, background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), manager_user: User = Depends(get_current_manager_user)
):
    """(Gerente) Atualiza o status de uma reserva (aprovar, rejeitar, devolver)."""
    db_reservation = db.query(Reservation).options(
        joinedload(Reservation.user), 
        joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)
    ).filter(Reservation.id == reservation_id).first()
    if not db_reservation: raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    unit = db_reservation.equipment_unit
    log_message = f"Gerente '{manager_user.username}' {update_data.status.value} a reserva ID {db_reservation.id} do usuário '{db_reservation.user.username}'."
    
    # Lógica para aprovação ou rejeição
    if update_data.status.value in ['approved', 'rejected']:
        unit.status = 'reserved' if update_data.status.value == 'approved' else 'available'
        if update_data.status.value == 'approved':
            # Adiciona a tarefa de criar evento no calendário
            background_tasks.add_task(approve_and_create_calendar_event, db_reservation.id)
        # Adiciona a tarefa de enviar e-mail de notificação de status
        background_tasks.add_task(task_send_reservation_email, db_reservation.id, 'status')

    # Lógica para devolução
    elif update_data.status.value == 'returned':
        db_reservation.return_notes = update_data.return_notes
        if update_data.return_status == 'maintenance':
            unit.status = 'maintenance'
            history_event = UnitHistory(unit_id=unit.id, event_type='sent_to_maintenance', notes=f"Devolvido com defeito por '{db_reservation.user.username}'. Obs: {update_data.return_notes}", user_id=manager_user.id, reservation_id=db_reservation.id)
            log_message += " e enviou a unidade para manutenção."
        else: # 'ok'
            unit.status = 'available'
            history_event = UnitHistory(unit_id=unit.id, event_type='returned_ok', notes=f"Devolvido por '{db_reservation.user.username}'. Obs: {update_data.return_notes}", user_id=manager_user.id, reservation_id=db_reservation.id)
        db.add(history_event)
        # Adiciona a tarefa de enviar e-mail de confirmação de devolução
        background_tasks.add_task(task_send_reservation_email, db_reservation.id, 'returned')

    db_reservation.status = update_data.status.value
    db.commit()
    db.refresh(db_reservation)
    create_log(db, manager_user.id, "INFO", log_message)
    return db_reservation

@router.post("/reservations/{reservation_id}/notify-overdue", status_code=status.HTTP_200_OK)
def notify_overdue_reservation(
    reservation_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db),
    manager_user: User = Depends(get_current_manager_user)
):
    """(Gerente) Envia um e-mail de notificação para uma reserva atrasada."""
    db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not db_reservation: raise HTTPException(status_code=404, detail="Reserva não encontrada.")

    # Valida se a reserva está de fato atrasada
    if db_reservation.status != 'approved' or db_reservation.end_time > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Esta reserva não está atrasada.")

    background_tasks.add_task(task_send_reservation_email, db_reservation.id, 'overdue')
    create_log(db, manager_user.id, "INFO", f"Gerente '{manager_user.username}' enviou notificação de atraso para la reserva ID {db_reservation.id}.")
    return {"message": "Notificação de atraso enviada com sucesso."}

# --- ROTAS DE GERENCIAMENTO DE USUÁRIOS ---

@router.get("/users", response_model=Page[UserOut])
def list_users(
    db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user),
    search: Optional[str] = Query(None), role: Optional[str] = Query(None),
    sector_id: Optional[int] = Query(None), page: int = Query(1, ge=1),
    size: int = Query(15, ge=1, le=1000), status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query('id'), sort_dir: Optional[str] = Query('asc')
):
    """(Admin) Lista todos os usuários, com busca, filtros e ordenação."""
    query = db.query(User).outerjoin(User.sector)

    if search:
        query = query.filter(or_(User.username.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    if role and role != "all":
        query = query.filter(User.role == role)
    if sector_id:
        query = query.filter(User.sector_id == sector_id)
    if status and status != "all":
        query = query.filter(User.is_active == (status == 'active'))

    # Lógica de ordenação dinâmica
    sort_column_map = {'id': User.id, 'username': User.username, 'email': User.email, 'sector': Sector.name, 'role': User.role, 'status': User.is_active}
    sort_column = sort_column_map.get(sort_by, User.id)
    query = query.order_by(desc(sort_column) if sort_dir == 'desc' else asc(sort_column))

    total = query.count()
    users = query.options(joinedload(User.sector)).offset((page - 1) * size).limit(size).all()
    return {"items": users, "total": total, "page": page, "size": size, "pages": math.ceil(total / size)}

@router.get("/users/view", response_model=Page[UserOut])
def view_users_for_manager(
    db: Session = Depends(get_db), manager_user: User = Depends(get_current_manager_user),
    search: Optional[str] = Query(None), role: Optional[str] = Query(None),
    sector_id: Optional[int] = Query(None), status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query('id'), sort_dir: Optional[str] = Query('asc'),
    page: int = Query(1, ge=1), size: int = Query(15, ge=1, le=1000)
):
    """(Gerente) Lista usuários para visualização, com filtros e ordenação."""
    # A lógica é idêntica a list_users, mas a dependência de segurança é diferente
    query = db.query(User).outerjoin(User.sector)
    # ... (lógica de filtros e ordenação idêntica a list_users) ...
    if search:
        query = query.filter(or_(User.username.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    if role and role != "all":
        query = query.filter(User.role == role)
    if sector_id:
        query = query.filter(User.sector_id == sector_id)
    if status and status != "all":
        query = query.filter(User.is_active == (status == 'active'))
    sort_column_map = {'id': User.id, 'username': User.username, 'email': User.email, 'sector': Sector.name, 'role': User.role, 'status': User.is_active}
    sort_column = sort_column_map.get(sort_by, User.id)
    query = query.order_by(desc(sort_column) if sort_dir == 'desc' else asc(sort_column))
    total = query.count()
    users = query.options(joinedload(User.sector)).offset((page - 1) * size).limit(size).all()
    return {"items": users, "total": total, "page": page, "size": size, "pages": math.ceil(total / size)}


@router.get("/users/{user_id}/history", response_model=List[ReservationOut])
def get_user_history(user_id: int, db: Session = Depends(get_db), manager_user: User = Depends(get_current_manager_user)):
    """(Gerente) Retorna o histórico de reservas de um usuário específico."""
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return db.query(Reservation).filter(Reservation.user_id == user_id).options(joinedload(Reservation.equipment_unit).joinedload(EquipmentUnit.equipment_type)).order_by(Reservation.start_time.desc()).all()

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_admin(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    """(Admin) Deleta um usuário pelo seu ID."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user: raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if db_user.id == admin_user.id: raise HTTPException(status_code=400, detail="Um administrador não pode deletar a própria conta por esta rota.")
    
    # Verifica se o usuário a ser deletado possui reservas ativas
    active_reservations = db.query(Reservation).filter(
        Reservation.user_id == user_id,
        Reservation.status.in_(['pending', 'approved'])
    ).first()

    if active_reservations:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Não é possível deletar o usuário '{db_user.username}'. Ele possui reservas pendentes ou aprovadas."
        )

    user_email_log = db_user.email
    
    # --- INÍCIO DA ALTERAÇÃO ---
    # 1. Cria o log da exclusão ANTES de deletar o usuário.
    create_log(db, admin_user.id, "WARNING", f"Admin '{admin_user.username}' deletou o usuário '{user_email_log}' (ID: {user_id}).")

    # 2. Re-busca o usuário para garantir que a instância está "attached" (anexada)
    # à sessão antes de deletar, pois o create_log realiza um commit.
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if user_to_delete:
        db.delete(user_to_delete)
        db.commit()
    # --- FIM DA ALTERAÇÃO ---
    return

@router.patch("/users/{user_id}/role", response_model=UserOut)
def set_user_role(user_id: int, role_update: UserRoleUpdate, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    """(Admin) Define a permissão (role) de um usuário."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user: raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if db_user.id == admin_user.id and role_update.role.value != "admin":
        raise HTTPException(status_code=400, detail="Um administrador não pode remover a própria permissão.")
    
    old_role = db_user.role
    db_user.role = role_update.role.value
    db.commit()
    db.refresh(db_user)
    create_log(db, admin_user.id, "INFO", f"Admin '{admin_user.username}' alterou a permissão do usuário '{db_user.username}' de '{old_role}' para '{db_user.role}'.")
    return db_user
    
@router.patch("/users/{user_id}/status", response_model=UserOut)
def set_user_status(user_id: int, status_update: UserStatusUpdate, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user)):
    """(Admin) Ativa ou inativa um usuário."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user: raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if db_user.id == admin_user.id: raise HTTPException(status_code=400, detail="Um administrador não pode inativar a própria conta.")
    
    db_user.is_active = status_update.is_active
    db.commit()
    db.refresh(db_user)
    action_log = "ativou" if db_user.is_active else "desativou"
    create_log(db, admin_user.id, "WARNING", f"Admin '{admin_user.username}' {action_log} o usuário '{db_user.username}' (ID: {db_user.id}).")
    return db_user

@router.patch("/users/{user_id}/sector", response_model=UserOut)
def set_user_sector(user_id: int, sector_update: UserSectorUpdate, db: Session = Depends(get_db), manager_user: User = Depends(get_current_manager_user)):
    """(Gerente) Define o setor de um usuário."""
    db_user = db.query(User).options(joinedload(User.sector)).filter(User.id == user_id).first()
    if not db_user: raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    old_sector_name = db_user.sector.name if db_user.sector else "Nenhum"
    new_sector_name = "Nenhum"
    if sector_update.sector_id is not None:
        sector = db.query(Sector).filter(Sector.id == sector_update.sector_id).first()
        if not sector: raise HTTPException(status_code=404, detail="Setor não encontrado.")
        new_sector_name = sector.name

    db_user.sector_id = sector_update.sector_id
    db.commit()
    db.refresh(db_user)
    create_log(db, manager_user.id, "INFO", f"Gerente '{manager_user.username}' alterou o setor do usuário '{db_user.username}' de '{old_sector_name}' para '{new_sector_name}'.")
    return db_user

# --- ROTA DE LOGS DO SISTEMA ---

@router.get("/logs", response_model=Page[ActivityLogOut])
def get_activity_logs(
    db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin_user),
    search: Optional[str] = Query(None), level: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None), start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None), page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=1000)
):
    """(Admin) Lista os logs de atividade da aplicação, com filtros avançados e paginação."""
    query = db.query(ActivityLog)

    if search:
        query = query.filter(ActivityLog.message.ilike(f"%{search}%"))
    if level and level != "all":
        query = query.filter(ActivityLog.level == level.upper())
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if start_date:
        query = query.filter(ActivityLog.created_at >= start_date)
    if end_date:
        query = query.filter(ActivityLog.created_at <= end_date)
        
    total = query.count()
    logs = query.order_by(ActivityLog.created_at.desc()).offset((page - 1) * size).limit(size).all()
    
    return {"items": logs, "total": total, "page": page, "size": size, "pages": math.ceil(total / size)}


@router.get("/logs/export", response_class=Response)
def export_activity_logs(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
    search: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """(Admin) Exporta os logs de atividade para um arquivo .txt com base nos filtros aplicados."""
    # 1. Obter os logs filtrados (sem paginação)
    query = db.query(ActivityLog).options(joinedload(ActivityLog.user)) # Eager load user

    if search:
        query = query.filter(ActivityLog.message.ilike(f"%{search}%"))
    if level and level != "all":
        query = query.filter(ActivityLog.level == level.upper())
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if start_date:
        query = query.filter(ActivityLog.created_at >= start_date)
    if end_date:
        query = query.filter(ActivityLog.created_at <= end_date)

    logs = query.order_by(ActivityLog.created_at.asc()).all()

    # 2. Obter estatísticas adicionais do sistema
    total_users = db.query(User).count()
    total_equipment_types = db.query(EquipmentType).count()
    total_equipment_units = db.query(EquipmentUnit).count()
    total_reservations = db.query(Reservation).count()
    total_sectors = db.query(Sector).count()

    # 3. Formatar o conteúdo do arquivo de texto
    report_content = []
    report_content.append("=========================================")
    report_content.append("   RELATÓRIO DE AUDITORIA - EQUIPCONTROL   ")
    report_content.append("=========================================")
    report_content.append(f"Relatório gerado em: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M:%S UTC')}")
    report_content.append(f"Gerado por: {admin_user.username} (ID: {admin_user.id})")
    report_content.append("\n--- ESTATÍSTICAS GERAIS DO SISTEMA ---\n")
    report_content.append(f"- Total de Usuários Cadastrados: {total_users}")
    report_content.append(f"- Total de Tipos de Equipamentos: {total_equipment_types}")
    report_content.append(f"- Total de Unidades de Equipamentos: {total_equipment_units}")
    report_content.append(f"- Total de Reservas (todos os status): {total_reservations}")
    report_content.append(f"- Total de Setores: {total_sectors}")

    report_content.append("\n--- FILTROS APLICADOS NESTE RELATÓRIO ---\n")
    report_content.append(f"- Termo de busca: {search or 'Nenhum'}")
    report_content.append(f"- Nível de Log: {level or 'Todos'}")
    report_content.append(f"- ID do Usuário: {user_id or 'Todos'}")
    report_content.append(f"- Data de Início: {start_date.strftime('%d/%m/%Y %H:%M') if start_date else 'Nenhuma'}")
    report_content.append(f"- Data de Fim: {end_date.strftime('%d/%m/%Y %H:%M') if end_date else 'Nenhuma'}")

    report_content.append("\n=========================================")
    report_content.append("          REGISTROS DE ATIVIDADE         ")
    report_content.append("=========================================\n")

    if not logs:
        report_content.append("Nenhum registro de log encontrado com os filtros aplicados.")
    else:
        for log in logs:
            username = log.user.username if log.user else 'Sistema'
            log_line = (
                f"[{log.created_at.strftime('%Y-%m-%d %H:%M:%S')}] "
                f"[{log.level:<7}] "
                f"[Usuário: {username} (ID: {log.user_id or 'N/A'})] - "
                f"{log.message}"
            )
            report_content.append(log_line)

    final_report = "\n".join(report_content)

    # 4. Criar a resposta de download
    filename_date = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"equipcontrol_audit_log_{filename_date}.txt"
    
    return Response(
        content=final_report,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )