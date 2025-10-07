# app/routes/legal.py

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(
    tags=["Legal"]
)

templates = Jinja2Templates(directory="app/templates")

@router.get("/terms", response_class=HTMLResponse)
def get_terms_of_use(request: Request):
    """Exibe a página de Termos de Uso."""
    return templates.TemplateResponse("terms_of_use.html", {"request": request})

@router.get("/privacy", response_class=HTMLResponse)
def get_privacy_policy(request: Request):
    """Exibe a página de Política de Privacidade."""
    return templates.TemplateResponse("privacy_policy.html", {"request": request})