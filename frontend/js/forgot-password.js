// js/forgot-password.js

document.getElementById('forgotPasswordForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const messageDiv = document.getElementById('message');
    const submitButton = this.querySelector('button');

    submitButton.disabled = true;
    messageDiv.className = 'alert alert-info mt-3';
    messageDiv.textContent = 'A processar...';

    try {
        const response = await fetch('http://127.0.0.1:8000/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        // Por segurança, a API sempre retorna sucesso.
        // A mensagem de confirmação é exibida aqui.
        messageDiv.className = 'alert alert-success mt-3';
        messageDiv.textContent = data.message;

    } catch (error) {
        messageDiv.className = 'alert alert-danger mt-3';
        messageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        console.error('Erro na solicitação:', error);
    } finally {
        // Reativa o botão após um tempo para evitar spam
        setTimeout(() => {
            submitButton.disabled = false;
        }, 5000);
    }
});