# app/routes/google_auth.py

from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from jose import jwt, JWTError
from pydantic import BaseModel

from app.database import get_db
from app.security import get_token
from app.models.user import User
from app.models.google_token import GoogleOAuthToken
from app.config import settings

router = APIRouter(
    prefix="/google",
    tags=["Google Authentication"]
)

# --- ALTERAÇÃO 1: Inicializar o motor de templates ---
templates = Jinja2Templates(directory="app/templates")

SCOPES = ['https://www.googleapis.com/auth/calendar']
REDIRECT_URI = "http://127.0.0.1:8000/google/callback"

# Schema para a resposta da rota /login
class GoogleLoginResponse(BaseModel):
    authorization_url: str

@router.get("/login", response_model=GoogleLoginResponse)
def google_login(token: str = Depends(get_token)):
    """
    Gera a URL de autorização do Google para o utilizador logado.
    O utilizador deve copiar esta URL e abri-la no navegador.
    """
    flow = Flow.from_client_secrets_file(
        'client_secret.json',
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        state=token
    )
    return {"authorization_url": authorization_url}

# --- ALTERAÇÃO 2: Definir o response_class como HTMLResponse ---
@router.get("/callback", response_class=HTMLResponse)
def google_callback(
    # --- ALTERAÇÃO 3: Adicionar o parâmetro "request" ---
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Callback que a Google chama. Valida o token do 'state' e salva as credenciais.
    """
    try:
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
    flow.fetch_token(code=code)
    
    credentials = flow.credentials
    token_json = credentials.to_json()

    db_token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == current_user.id).first()
    if db_token:
        db_token.token_json = token_json
    else:
        db_token = GoogleOAuthToken(user_id=current_user.id, token_json=token_json)
        db.add(db_token)
    
    db.commit()
    
    # --- ALTERAÇÃO 4: Retornar a renderização do template em vez do JSON ---
    message = "A sua conta Google foi conectada com sucesso! Pode fechar esta aba."
    return templates.TemplateResponse(
        "google_callback_success.html", 
        {"request": request, "message": message}
    )