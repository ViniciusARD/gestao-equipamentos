// js/login.js

/**
 * Função para lidar com a submissão do formulário de login principal.
 */
async function handleLoginFormSubmit(event) {
    event.preventDefault(); // Impede o recarregamento da página

    // Seleciona os elementos do formulário
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('errorMessage');
    const submitButton = event.target.querySelector('button[type="submit"]');

    // Desativa o botão e esconde mensagens de erro antigas
    submitButton.disabled = true;
    errorMessageDiv.classList.add('d-none');
    errorMessageDiv.textContent = '';
    // Garante que a mensagem de erro tenha a classe de perigo por padrão
    errorMessageDiv.classList.remove('alert-info');
    errorMessageDiv.classList.add('alert-danger');

    try {
        // Envia a requisição para a API
        const response = await fetch('http://127.0.0.1:8000/auth/login', {
            method: 'POST',
            headers: {
                // Informa à API que estamos enviando dados em formato JSON
                'Content-Type': 'application/json'
            },
            // Converte o objeto JavaScript em uma string JSON.
            // As chaves { email, password } devem corresponder exatamente
            // ao que o schema `UserLogin` do FastAPI espera.
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            })
        });

        // Tenta converter a resposta da API para JSON, mesmo se for um erro
        const data = await response.json();

        // Se a resposta foi bem-sucedida (status 2xx)
        if (response.ok) {
            if (data.login_step === '2fa_required') {
                // Se a autenticação de dois fatores é necessária, abre o modal
                const twoFAModal = new bootstrap.Modal(document.getElementById('2faModal'));
                document.getElementById('tempToken').value = data.temp_token;
                twoFAModal.show();
            } else if (data.login_step === 'verification_required') {
                // --- ALTERAÇÃO AQUI ---
                // Se a verificação de e-mail for necessária, exibe a mensagem informativa
                errorMessageDiv.textContent = data.message;
                errorMessageDiv.classList.remove('d-none');
                errorMessageDiv.classList.remove('alert-danger');
                errorMessageDiv.classList.add('alert-info');
            } else {
                // Login completo e bem-sucedido
                localStorage.setItem('accessToken', data.access_token);
                localStorage.setItem('refreshToken', data.refresh_token);
                window.location.href = 'dashboard.html'; // Redireciona para o dashboard
            }
        } else {
            // Se a resposta foi um erro (status 4xx ou 5xx), exibe a mensagem de detalhe da API
            // O `data.detail` é a mensagem de erro que o FastAPI envia.
            errorMessageDiv.textContent = data.detail || 'Ocorreu um erro desconhecido.';
            errorMessageDiv.classList.remove('d-none');
        }

    } catch (error) {
        // Captura erros de rede (ex: servidor offline)
        errorMessageDiv.textContent = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
        errorMessageDiv.classList.remove('d-none');
        console.error('Erro de login:', error);
    } finally {
        // Reativa o botão de submit, independentemente do resultado
        submitButton.disabled = false;
    }
}

/**
 * Função para lidar com a submissão do formulário de 2FA (autenticação de dois fatores).
 */
async function handle2FAFormSubmit(event) {
    event.preventDefault();

    const tempTokenInput = document.getElementById('tempToken');
    const otpCodeInput = document.getElementById('otpCode');
    const errorMessageDiv = document.getElementById('2faErrorMessage');
    const submitButton = event.target.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    errorMessageDiv.classList.add('d-none');
    errorMessageDiv.textContent = '';

    try {
        const response = await fetch('http://127.0.0.1:8000/auth/login/2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                temp_token: tempTokenInput.value,
                otp_code: otpCodeInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Login com 2FA bem-sucedido
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            window.location.href = 'dashboard.html';
        } else {
            // Erro na verificação do 2FA
            errorMessageDiv.textContent = data.detail || 'Código 2FA inválido ou expirado.';
            errorMessageDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorMessageDiv.textContent = 'Erro de comunicação com o servidor.';
        errorMessageDiv.classList.remove('d-none');
        console.error('Erro de 2FA:', error);
    } finally {
        submitButton.disabled = false;
    }
}

// Adiciona os "escutadores" de evento aos formulários quando o documento for carregado
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginFormSubmit);
    }

    const twoFAForm = document.getElementById('2faForm');
    if (twoFAForm) {
        twoFAForm.addEventListener('submit', handle2FAFormSubmit);
    }
});