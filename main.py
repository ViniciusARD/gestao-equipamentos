# main.py

from fastapi import FastAPI
from app.routes import auth, equipments, reservations, admin # NOVO: Importa também as rotas de admin

app = FastAPI(
    title="EquipControl: Sistema de Gestão de Equipamentos",
    description="API para gerenciar reservas de equipamentos.",
    version="1.2.0" # Nova versão para refletir a funcionalidade de admin
)

# Inclui os roteadores na aplicação
app.include_router(auth.router)
app.include_router(equipments.router)
app.include_router(reservations.router)
app.include_router(admin.router) # NOVO: Registra o novo roteador de admin

@app.get("/", tags=["Root"])
def read_root():
    """
    Rota principal que exibe uma mensagem de boas-vindas.
    """
    return {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}