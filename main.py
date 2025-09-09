# main.py

from fastapi import FastAPI
from app.routes import auth, equipments, reservations, admin, users, google_auth

app = FastAPI(
    title="EquipControl: Sistema de Gestão de Equipamentos",
    description="API para gerenciar reservas de equipamentos.",
    version="1.3.0" # Nova versão
)

# Inclui todos os roteadores
app.include_router(auth.router)
app.include_router(users.router) # Roteador para o próprio usuário
app.include_router(equipments.router)
app.include_router(reservations.router)
app.include_router(admin.router) # Roteador para ações de admin
app.include_router(google_auth.router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}