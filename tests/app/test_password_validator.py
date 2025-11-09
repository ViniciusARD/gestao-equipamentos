import pytest
from app.password_validator import validate_password

def test_validate_password_valid():
    """Testa uma senha que atende a todos os requisitos."""
    assert validate_password("ValidPassword123!") == []

@pytest.mark.parametrize("password, expected_error", [
    ("short", "A senha deve ter no mínimo 8 caracteres."),
    ("nouppercase1!", "A senha deve conter pelo menos uma letra maiúscula."),
    ("NOLOWERCASE1!", "A senha deve conter pelo menos uma letra minúscula."),
    ("NoNumberSpecial!", "A senha deve conter pelo menos um número."),
    ("NoSpecialChar1", "A senha deve conter pelo menos um caractere especial"),
])
def test_validate_password_invalid_single_cases(password, expected_error):
    """Testa senhas que falham em um único requisito."""
    errors = validate_password(password)
    # Verifica se o erro esperado está na lista de erros retornados
    assert any(expected_error in e for e in errors)

def test_validate_password_multiple_errors():
    """Testa uma senha fraca que falha em múltiplos requisitos."""
    errors = validate_password("weak")
    
    # Deve falhar em 4 requisitos
    assert len(errors) >= 4
    assert "A senha deve ter no mínimo 8 caracteres." in errors
    assert "A senha deve conter pelo menos uma letra maiúscula." in errors
    assert "A senha deve conter pelo menos um número." in errors
    assert "A senha deve conter pelo menos um caractere especial (!@#$%^&*(),.?\":{}|<>)." in errors

def test_validate_password_empty():
    """Testa uma senha vazia."""
    errors = validate_password("")
    assert len(errors) == 5 # Deve falhar em todos os requisitos