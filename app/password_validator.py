# app/password_validator.py

import re
from typing import List

def validate_password(password: str) -> List[str]:
    """
    Valida a complexidade da senha e retorna uma lista de requisitos não atendidos.
    """
    errors = []
    if len(password) < 8:
        errors.append("A senha deve ter no mínimo 8 caracteres.")
    if not re.search(r"[a-z]", password):
        errors.append("A senha deve conter pelo menos uma letra minúscula.")
    if not re.search(r"[A-Z]", password):
        errors.append("A senha deve conter pelo menos uma letra maiúscula.")
    if not re.search(r"\d", password):
        errors.append("A senha deve conter pelo menos um número.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("A senha deve conter pelo menos um caractere especial (!@#$%^&*(),.?\":{}|<>).")
    return errors