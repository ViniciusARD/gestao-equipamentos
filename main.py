# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, equipments, reservations, admin, users, google_auth, two_factor_auth, setores, legal, dashboard # <-- IMPORTAR dashboard

app = FastAPI(
    title="EquipControl: Sistema de Gestão de Equipamentos",
    description="API para gerenciar reservas de equipamentos.",
    version="1.5.0" # <-- Versão atualizada
)

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui todos os roteadores
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(setores.router)
app.include_router(equipments.router)
app.include_router(reservations.router)
app.include_router(admin.router)
app.include_router(google_auth.router)
app.include_router(two_factor_auth.router)
app.include_router(legal.router) 
app.include_router(dashboard.router)


@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}