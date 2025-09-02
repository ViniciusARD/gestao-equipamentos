# main.py

from fastapi import FastAPI
from app.routes import auth, equipments, reservations # Importe o novo arquivo de rotas

app = FastAPI(
    title="Sistema de Gestão de Equipamentos",
    description="API para gerenciar reservas de equipamentos.",
    version="1.1.0" # Nova versão
)

# Inclui os roteadores na aplicação
app.include_router(auth.router)
app.include_router(equipments.router)
app.include_router(reservations.router) # Registre o novo roteador de reservas

@app.get("/", tags=["Root"])
def read_root():
    """Rota principal que exibe uma mensagem de boas-vindas."""
    return {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}