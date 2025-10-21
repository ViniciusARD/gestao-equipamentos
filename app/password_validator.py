# app/password_validator.py

"""
Módulo Utilitário para Validação de Senhas

Este módulo contém a lógica para validar a complexidade de senhas.
Ele fornece uma função que verifica se uma senha atende a todos os
requisitos de segurança definidos para a aplicação.

Dependências:
- re: Módulo de expressões regulares do Python.
"""

import re
from typing import List

def validate_password(password: str) -> List[str]:
    """
    Valida a complexidade da senha e retorna uma lista de requisitos não atendidos.

    Verifica os seguintes critérios:
    - Comprimento mínimo de 8 caracteres.
    - Presença de pelo menos uma letra minúscula.
    - Presença de pelo menos uma letra maiúscula.
    - Presença de pelo menos um número.
    - Presença de pelo menos um caractere especial.

    Args:
        password (str): A senha a ser validada.

    Returns:
        List[str]: Uma lista de strings contendo as mensagens de erro para cada
                   requisito não atendido. Se a lista estiver vazia, a senha é válida.
    """
    errors = []
    # 1. Verifica o comprimento da senha
    if len(password) < 8:
        errors.append("A senha deve ter no mínimo 8 caracteres.")
    
    # 2. Verifica se contém pelo menos uma letra minúscula (a-z)
    if not re.search(r"[a-z]", password):
        errors.append("A senha deve conter pelo menos uma letra minúscula.")
    
    # 3. Verifica se contém pelo menos uma letra maiúscula (A-Z)
    if not re.search(r"[A-Z]", password):
        errors.append("A senha deve conter pelo menos uma letra maiúscula.")
    
    # 4. Verifica se contém pelo menos um número (0-9)
    if not re.search(r"\d", password):
        errors.append("A senha deve conter pelo menos um número.")
    
    # 5. Verifica se contém pelo menos um caractere especial da lista definida
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("A senha deve conter pelo menos um caractere especial (!@#$%^&*(),.?\":{}|<>).")
    
    return errors