# main.py

from fastapi import FastAPI
from app.routes import auth, equipments, reservations, admin, google_auth

app = FastAPI(
    title="EquipControl: Sistema de Gestão de Equipamentos",
    description="API para gerenciar reservas de equipamentos.",
    version="1.2.0" # Nova versão para refletir a funcionalidade de admin
)

# Inclui os roteadores na aplicação
app.include_router(auth.router)
app.include_router(equipments.router)
app.include_router(reservations.router)
app.include_router(admin.router) 
app.include_router(google_auth.router)

@app.get("/", tags=["Root"])
def read_root():
    """
    Rota principal que exibe uma mensagem de boas-vindas.
    """
    return {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}