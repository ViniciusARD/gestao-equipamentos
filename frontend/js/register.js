// js/register.js

document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const submitButton = this.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    messageDiv.className = 'alert mt-3 d-none';


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
            messageDiv.innerHTML = 'Cadastro realizado com sucesso! <br><strong>Enviamos um link de verificação para o seu e-mail. Por favor, ative sua conta para poder fazer login.</strong>';
            messageDiv.className = 'alert alert-success mt-3';
            
            // Opcional: redirecionar para uma página de "verifique seu e-mail"
            // setTimeout(() => {
            //     window.location.href = 'check-email.html';
            // }, 5000);

        } else {
            messageDiv.textContent = data.detail || 'Ocorreu um erro ao tentar cadastrar.';
            messageDiv.className = 'alert alert-danger mt-3';
        }

    } catch (error) {
        messageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        messageDiv.className = 'alert alert-danger mt-3';
        console.error('Erro de cadastro:', error);
    } finally {
        // Reativa o botão se não houver sucesso
        if (!response || !response.ok) {
            submitButton.disabled = false;
        }
    }
});