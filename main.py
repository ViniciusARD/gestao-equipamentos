# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, equipments, reservations, admin, users, google_auth, two_factor_auth

app = FastAPI(
    title="EquipControl: Sistema de Gestão de Equipamentos",
    description="API para gerenciar reservas de equipamentos.",
    version="1.3.0"
)

# --- NOVO: Configuração do CORS ---
# Lista de origens permitidas (no nosso caso, qualquer origem para desenvolvimento)
origins = [
    "*", # Permite todas as origens
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite todos os métodos (GET, POST, OPTIONS, etc.)
    allow_headers=["*"], # Permite todos os cabeçalhos
)

# Inclui todos os roteadores
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(equipments.router)
app.include_router(reservations.router)
app.include_router(admin.router)
app.include_router(google_auth.router)
app.include_router(two_factor_auth.router)


@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}