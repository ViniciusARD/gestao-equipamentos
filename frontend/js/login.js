// js/login.js

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessageDiv = document.getElementById('errorMessage');
    const submitButton = this.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    errorMessageDiv.classList.add('d-none');

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
            if (data.login_step === '2fa_required') {
                // Abre o modal de 2FA
                const twoFAModal = new bootstrap.Modal(document.getElementById('2faModal'));
                document.getElementById('tempToken').value = data.temp_token;
                twoFAModal.show();
            } else {
                // Login completo
                localStorage.setItem('accessToken', data.access_token);
                window.location.href = 'dashboard.html';
            }
        } else {
            errorMessageDiv.textContent = data.detail || 'Ocorreu um erro.';
            errorMessageDiv.classList.remove('d-none');
        }

    } catch (error) {
        errorMessageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        errorMessageDiv.classList.remove('d-none');
        console.error('Erro de login:', error);
    } finally {
        submitButton.disabled = false;
    }
});

// Handler para o formulário de 2FA
document.getElementById('2faForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const temp_token = document.getElementById('tempToken').value;
    const otp_code = document.getElementById('otpCode').value;
    const errorMessageDiv = document.getElementById('2faErrorMessage');
    const submitButton = this.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    errorMessageDiv.classList.add('d-none');

    try {
        const response = await fetch('http://127.0.0.1:8000/auth/login/2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token, otp_code })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('accessToken', data.access_token);
            window.location.href = 'dashboard.html';
        } else {
            errorMessageDiv.textContent = data.detail || 'Código inválido.';
            errorMessageDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorMessageDiv.textContent = 'Erro de comunicação com o servidor.';
        errorMessageDiv.classList.remove('d-none');
    } finally {
        submitButton.disabled = false;
    }
});