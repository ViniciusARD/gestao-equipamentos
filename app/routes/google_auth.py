# app/routes/google_auth.py

"""
Módulo de Rotas para Autenticação com Google (OAuth2)

Este arquivo define os endpoints para gerenciar o fluxo de autenticação OAuth2
com a API do Google, permitindo que a aplicação acesse o Google Calendar do
usuário para criar eventos de reserva.

Dependências:
- FastAPI: Para a criação do roteador e gerenciamento de requisições.
- google_auth_oauthlib.flow: Para simplificar o fluxo de autorização OAuth2.
- jose: Para a validação do token JWT usado no parâmetro 'state'.
- Módulos da aplicação: database, security, models, config, logging_utils.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from jose import jwt, JWTError
from pydantic import BaseModel

from app.database import get_db
from app.security import get_token, get_current_user
from app.models.user import User
from app.models.google_token import GoogleOAuthToken
from app.config import settings
from app.logging_utils import create_log

router = APIRouter(
    prefix="/google",
    tags=["Google Authentication"]
)

# Configura o motor de templates para renderizar a página de sucesso do callback
templates = Jinja2Templates(directory="app/templates")

# Escopo de permissão solicitado. Neste caso, acesso de leitura e escrita ao Google Calendar.
SCOPES = ['https://www.googleapis.com/auth/calendar']
# URI para a qual o Google redirecionará o usuário após a autorização. Deve estar
# cadastrada no painel do Google Cloud Console.
REDIRECT_URI = "http://127.0.0.1:8000/google/callback"

class GoogleLoginResponse(BaseModel):
    """Schema para a resposta do endpoint de login do Google."""
    authorization_url: str

@router.get("/login", response_model=GoogleLoginResponse)
def google_login(token: str = Depends(get_token)):
    """
    Gera a URL de autorização do Google para o usuário logado.
    O usuário deve abrir esta URL no navegador para iniciar o processo.
    """
    # Configura o fluxo OAuth2 a partir do arquivo 'client_secret.json'
    flow = Flow.from_client_secrets_file(
        'client_secret.json',
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    # Gera a URL de autorização.
    # access_type='offline' solicita um refresh_token para acesso de longo prazo.
    # prompt='consent' força o usuário a re-autorizar, garantindo que um novo
    # refresh_token seja sempre emitido, o que é crucial para reconexões.
    # O token JWT do usuário é passado no parâmetro 'state' como medida de segurança.
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=token
    )
    return {"authorization_url": authorization_url}

@router.get("/callback", response_class=HTMLResponse)
def google_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Callback que o Google chama após a autorização do usuário.
    Valida o token 'state' e salva as credenciais de acesso no banco de dados.
    """
    try:
        # Decodifica o token JWT recebido no 'state' para identificar o usuário
        payload = jwt.decode(state, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=400, detail="Token JWT inválido no parâmetro state.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Não foi possível decodificar o token no parâmetro state.")

    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Utilizador do token não encontrado.")

    flow = Flow.from_client_secrets_file(
        'client_secret.json',
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    # Troca o código de autorização recebido por um access token e um refresh token.
    flow.fetch_token(code=code)
    
    credentials = flow.credentials
    token_json = credentials.to_json()

    # Salva ou atualiza o token do usuário no banco de dados
    db_token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == current_user.id).first()
    if db_token:
        db_token.token_json = token_json
    else:
        db_token = GoogleOAuthToken(user_id=current_user.id, token_json=token_json)
        db.add(db_token)
    
    db.commit()
    
    create_log(db, current_user.id, "INFO", f"Usuário '{current_user.username}' conectou sua conta Google com sucesso.")

    # Renderiza uma página de sucesso para o usuário
    message = "A sua conta Google foi conectada com sucesso! Pode fechar esta aba."
    return templates.TemplateResponse("google_callback_success.html", {"request": request, "message": message})

@router.delete("/disconnect", status_code=status.HTTP_200_OK)
def google_disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Desconecta a conta Google do usuário, removendo o token de autorização.
    """
    db_token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == current_user.id).first()
    
    if not db_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma conta Google conectada para este usuário.")
    
    db.delete(db_token)
    db.commit()
    
    create_log(db, current_user.id, "WARNING", f"Usuário '{current_user.username}' desconectou sua conta Google.")
    
    return {"message": "Sua conta Google foi desconectada com sucesso."}