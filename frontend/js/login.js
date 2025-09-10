// js/login.js

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessageDiv = document.getElementById('errorMessage');

    try {
        const response = await fetch('http://127.0.0.1:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Login bem-sucedido!
            localStorage.setItem('accessToken', data.access_token);
            
            // Redireciona para a página principal
            window.location.href = 'dashboard.html'; // <--- DESCOMENTE ESTA LINHA

        } else {
            // Exibe a mensagem de erro da API
            errorMessageDiv.textContent = data.detail || 'Ocorreu um erro.';
            errorMessageDiv.classList.remove('d-none');
        }

    } catch (error) {
        // Exibe um erro de rede/conexão
        errorMessageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        errorMessageDiv.classList.remove('d-none');
        console.error('Erro de login:', error);
    }
});