# tests/test_main.py

"""
Testes para o Ponto de Entrada Principal (main.py)

Este módulo contém testes básicos para verificar se a aplicação FastAPI
está inicializando corretamente e se os endpoints públicos
estão respondendo como esperado.
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

def test_get_terms_of_use():
    """
    Testa o endpoint dos Termos de Uso (/terms).

    Verifica se a página HTML é retornada com sucesso (200 OK)
    e se contém o título esperado, indicando que o template
    foi renderizado corretamente.
    """
    response = client.get("/terms")
    assert response.status_code == 200
    # Verifica se o conteúdo é HTML e contém o título da página
    assert "text/html" in response.headers["content-type"]
    assert "<title>Termos de Uso - EquipControl</title>" in response.text

def test_get_privacy_policy():
    """
    Testa o endpoint da Política de Privacidade (/privacy).

    Verifica se a página HTML é retornada com sucesso (200 OK)
    e se contém o título esperado, indicando que o template
    foi renderizado corretamente.
    """
    response = client.get("/privacy")
    assert response.status_code == 200
    # Verifica se o conteúdo é HTML e contém o título da página
    assert "text/html" in response.headers["content-type"]
    assert "<title>Política de Privacidade - EquipControl</title>" in response.text