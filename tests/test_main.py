from fastapi.testclient import TestClient
from main import app

# Cria um cliente de teste que "roda" sua aplicação FastAPI em memória
client = TestClient(app)

def test_read_root():
    """
    Testa o endpoint principal (/) da aplicação.
    Este é o teste mais simples e verifica se a API está respondendo.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}