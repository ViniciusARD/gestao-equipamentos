# main.py

"""
Arquivo Principal da Aplicação FastAPI (Ponto de Entrada)

Este módulo é responsável por inicializar a aplicação FastAPI, configurar
middlewares essenciais e registrar todos os roteadores (endpoints)
que compõem a API do sistema EquipControl.

Dependências:
- FastAPI: O framework principal para a construção da API.
- CORSMiddleware: Para permitir que o frontend acesse a API.
- Módulos de Rota (app.routes): Cada módulo contém um conjunto de endpoints
  relacionados a uma funcionalidade específica (ex: auth, users, equipments).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa todos os módulos de rotas da aplicação
from app.routes import auth, equipments, reservations, admin, users, google_auth, two_factor_auth, sectors, legal, dashboard

# Cria a instância principal da aplicação FastAPI
# Os metadados como 'title', 'description' e 'version' são usados na documentação automática (Swagger/OpenAPI)
app = FastAPI(
    title="EquipControl: Sistema de Gestão de Equipamentos",
    description="API para gerenciar reservas de equipamentos.",
    version="1.5.0"
)

# Lista de origens permitidas para fazer requisições à API.
# O uso de "*" permite que qualquer origem acesse a API, ideal para desenvolvimento.
# Em produção, seria mais seguro restringir para o domínio do frontend.
origins = [
    "*",
]

# Adiciona o middleware de CORS (Cross-Origin Resource Sharing) à aplicação.
# Isso é crucial para permitir que o frontend (rodando em um servidor diferente, ex: 127.0.0.1:5500)
# possa se comunicar com a API (rodando em 127.0.0.1:8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Permite as origens definidas na lista `origins`
    allow_credentials=True,      # Permite o envio de cookies de autenticação
    allow_methods=["*"],         # Permite todos os métodos HTTP (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],         # Permite todos os cabeçalhos HTTP
)

# Inclui os roteadores na aplicação principal.
# Cada roteador agrupa um conjunto de endpoints relacionados a uma funcionalidade.
# Por exemplo, todos os endpoints de autenticação estão em `auth.router`.
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(sectors.router)
app.include_router(equipments.router)
app.include_router(reservations.router)
app.include_router(admin.router)
app.include_router(google_auth.router)
app.include_router(two_factor_auth.router)
app.include_router(legal.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Root"])
def read_root():
    """
    Endpoint raiz da API.

    Retorna uma mensagem de boas-vindas. É útil para verificar rapidamente
    se a API está online e respondendo a requisições.
    """
    return {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}