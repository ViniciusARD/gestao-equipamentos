# tests/test_main.py

"""
Testes para o Ponto de Entrada Principal (main.py)

Este módulo contém testes básicos para verificar se a aplicação FastAPI
está inicializando corretamente e se o endpoint raiz está respondendo
como esperado.
"""

from fastapi.testclient import TestClient
from main import app

# Cria um cliente de teste que "roda" a aplicação FastAPI em memória
# Nota: Para testes mais complexos, usamos a fixture 'client' do conftest.py
# que lida com o banco de dados. Este é um teste simples de inicialização.
client = TestClient(app)

def test_read_root():
    """
    Testa o endpoint principal (/) da aplicação.

    Este é o teste mais simples e verifica se a API está online e
    retornando a mensagem de boas-vindas correta.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Bem-vindo ao Sistema de Gestão de Equipamentos"}