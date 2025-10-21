# app/routes/legal.py

"""
Módulo de Rotas para Conteúdo Legal

Este arquivo define os endpoints responsáveis por servir as páginas
de Termos de Uso e Política de Privacidade, utilizando templates HTML.

Dependências:
- FastAPI: Para a criação do roteador e o gerenciamento de requisições e respostas.
- Jinja2Templates: Para renderizar os arquivos HTML a partir da pasta de templates.
"""

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

# Cria um roteador FastAPI para agrupar os endpoints legais
router = APIRouter(
    tags=["Legal"]
)

# Configura o motor de templates, especificando o diretório onde os
# arquivos HTML estão localizados.
templates = Jinja2Templates(directory="app/templates")

@router.get("/terms", response_class=HTMLResponse)
def get_terms_of_use(request: Request):
    """
    Exibe a página de Termos de Uso.

    Esta rota renderiza o arquivo 'terms_of_use.html' e o retorna como uma
    resposta HTML. O objeto 'request' é necessário para o contexto do template.
    """
    return templates.TemplateResponse("terms_of_use.html", {"request": request})

@router.get("/privacy", response_class=HTMLResponse)
def get_privacy_policy(request: Request):
    """
    Exibe a página de Política de Privacidade.

    Esta rota renderiza o arquivo 'privacy_policy.html' e o retorna como uma
    resposta HTML.
    """
    return templates.TemplateResponse("privacy_policy.html", {"request": request})