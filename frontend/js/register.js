// js/register.js

document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('http://127.0.0.1:8000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Cadastro bem-sucedido
            messageDiv.textContent = 'Cadastro realizado com sucesso! Redirecionando para o login...';
            messageDiv.className = 'alert alert-success mt-3'; // Muda a classe para verde

            // Redireciona para a página de login após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } else {
            // Exibe a mensagem de erro da API
            messageDiv.textContent = data.detail || 'Ocorreu um erro ao tentar cadastrar.';
            messageDiv.className = 'alert alert-danger mt-3';
        }

    } catch (error) {
        // Exibe um erro de rede/conexão
        messageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        messageDiv.className = 'alert alert-danger mt-3';
        console.error('Erro de cadastro:', error);
    }
});