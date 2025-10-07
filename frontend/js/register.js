// js/register.js

// Carrega os setores quando a página é carregada
document.addEventListener('DOMContentLoaded', async () => {
    const setorSelect = document.getElementById('setor');
    try {
        const response = await fetch('http://127.0.0.1:8000/setores');
        if (!response.ok) {
            throw new Error('Não foi possível carregar os setores.');
        }
        const setores = await response.json();
        setores.forEach(setor => {
            const option = document.createElement('option');
            option.value = setor.id;
            option.textContent = setor.name;
            setorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar setores:', error);
        setorSelect.disabled = true;
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Erro ao carregar setores';
        setorSelect.appendChild(errorOption);
    }
});


document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const setor_id = document.getElementById('setor').value;
    const terms_accepted = document.getElementById('terms').checked; // <-- ADICIONADO
    const messageDiv = document.getElementById('message');
    const submitButton = this.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    messageDiv.className = 'alert mt-3 d-none';

    try {
        const requestBody = {
            username,
            email,
            password,
            setor_id: setor_id ? parseInt(setor_id) : null,
            terms_accepted // <-- ADICIONADO
        };

        const response = await fetch('http://127.0.0.1:8000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.innerHTML = 'Cadastro realizado com sucesso! <br><strong>Enviamos um link de verificação para o seu e-mail. Por favor, ative sua conta para poder fazer login.</strong>';
            messageDiv.className = 'alert alert-success mt-3';
        } else {
            messageDiv.textContent = data.detail || 'Ocorreu um erro ao tentar cadastrar.';
            messageDiv.className = 'alert alert-danger mt-3';
        }

    } catch (error) {
        messageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        messageDiv.className = 'alert alert-danger mt-3';
        console.error('Erro de cadastro:', error);
    } finally {
        if (messageDiv.classList.contains('alert-danger')) {
            submitButton.disabled = false;
        }
    }
});