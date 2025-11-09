# tests/app/test_password_validator.py

"""
Testes Unitários para o Validador de Senhas (app/password_validator.py)

Este módulo testa a função 'validate_password' para garantir que ela
identifica corretamente senhas fortes e fracas, retornando as mensagens
de erro apropriadas para cada requisito não atendido.
"""

import pytest
from app.password_validator import validate_password

def test_validate_password_valid():
    """
    Testa uma senha que atende a todos os requisitos de complexidade.
    Espera que a lista de erros retornada esteja vazia.
    """
    assert validate_password("ValidPassword123!") == []

@pytest.mark.parametrize("password, expected_error", [
    ("short", "A senha deve ter no mínimo 8 caracteres."),
    ("nouppercase1!", "A senha deve conter pelo menos uma letra maiúscula."),
    ("NOLOWERCASE1!", "A senha deve conter pelo menos uma letra minúscula."),
    ("NoNumberSpecial!", "A senha deve conter pelo menos um número."),
    ("NoSpecialChar1", "A senha deve conter pelo menos um caractere especial"),
])
def test_validate_password_invalid_single_cases(password, expected_error):
    """
    Testa uma série de senhas que falham em exatamente um requisito.
    Usa 'pytest.mark.parametrize' para executar o mesmo teste várias vezes
    com diferentes entradas e saídas esperadas.
    """
    errors = validate_password(password)
    # Verifica se o erro específico esperado está na lista de erros retornados
    assert any(expected_error in e for e in errors)

def test_validate_password_multiple_errors():
    """
    Testa uma senha muito fraca ("weak") que falha em múltiplos requisitos.
    Verifica se todas as mensagens de erro esperadas são retornadas.
    """
    errors = validate_password("weak")
    
    # Deve falhar em pelo menos 4 requisitos
    assert len(errors) >= 4
    assert "A senha deve ter no mínimo 8 caracteres." in errors
    assert "A senha deve conter pelo menos uma letra maiúscula." in errors
    assert "A senha deve conter pelo menos um número." in errors
    assert "A senha deve conter pelo menos um caractere especial (!@#$%^&*(),.?\":{}|<>)." in errors

def test_validate_password_empty():
    """
    Testa o caso extremo de uma senha vazia ("").
    Verifica se a senha falha em todos os 5 requisitos.
    """
    errors = validate_password("")
    assert len(errors) == 5 # Deve falhar em todos os requisitos