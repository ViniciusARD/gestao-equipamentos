# app/logging_utils.py

"""
Módulo Utilitário para Criação de Logs de Atividade

Este módulo fornece uma função utilitária para registrar eventos
importantes da aplicação (logs de atividade) diretamente no banco de dados.
Centralizar a criação de logs em uma única função promove consistência
e facilita a manutenção.

Dependências:
- sqlalchemy.orm.Session: Para interagir com a sessão do banco de dados.
- app.models.activity_log.ActivityLog: O modelo da tabela onde os logs são salvos.
"""

from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog

def create_log(db: Session, user_id: int | None, level: str, message: str):
    """
    Cria e salva uma nova entrada de log no banco de dados.

    Esta função é usada em toda a aplicação para registrar ações importantes,
    facilitando a auditoria e o monitoramento do sistema.

    Args:
        db (Session): A sessão do banco de dados injetada pelo FastAPI.
        user_id (int | None): O ID do usuário que executou a ação. Pode ser None
                              para ações iniciadas pelo sistema (ex: tarefas agendadas).
        level (str): O nível do log (ex: 'INFO', 'WARNING', 'ERROR').
        message (str): A mensagem descritiva do evento que está sendo registrado.
    """
    # Cria uma instância do modelo ActivityLog com os dados fornecidos
    log_entry = ActivityLog(
        user_id=user_id,
        level=level.upper(),  # Garante que o nível do log seja sempre em maiúsculas
        message=message
    )
    
    # Adiciona o novo registro de log à sessão do banco de dados
    db.add(log_entry)
    
    # Confirma (salva) a transação no banco de dados
    db.commit()