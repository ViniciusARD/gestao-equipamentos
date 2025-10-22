// js/login.js

/**
 * Módulo de Autenticação de Usuário.
 *
 * Este script gerencia la lógica da página de login. Ele é responsável por:
 * 1. Lidar com a submissão do formulário de login principal.
 * 2. Iniciar o fluxo de Autenticação de Dois Fatores (2FA) quando necessário.
 * 3. Gerenciar o formulário de verificação do código 2FA.
 * 4. Exibir mensagens de erro ou informativas (como a necessidade de verificação de e-mail).
 * 5. Armazenar os tokens de acesso e de atualização no `localStorage` após um login bem-sucedido.
 *
 * Dependências:
 * - A estrutura HTML de `login.html`, incluindo os modais.
 * - Bootstrap 5 para a funcionalidade do modal de 2FA.
 */


/**
 * Função para lidar com a submissão do formulário de login principal.
 * @param {Event} event - O objeto do evento de submissão do formulário.
 */
async function handleLoginFormSubmit(event) {
    // Impede o comportamento padrão do formulário, que recarregaria a página.
    event.preventDefault(); 

    // Seleciona os elementos do DOM necessários.
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('errorMessage');
    const submitButton = event.target.querySelector('button[type="submit"]');

    // Fornece feedback visual ao usuário enquanto a requisição está em andamento.
    submitButton.disabled = true;
    errorMessageDiv.classList.add('d-none');
    errorMessageDiv.textContent = '';
    errorMessageDiv.classList.remove('alert-info');
    errorMessageDiv.classList.add('alert-danger');

    try {
        // Envia a requisição de login para a API.
        const response = await fetch('http://127.0.0.1:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // O corpo da requisição deve corresponder ao schema `UserLogin` do FastAPI.
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            })
        });

        // Converte a resposta da API para JSON.
        const data = await response.json();

        // Verifica se a requisição foi bem-sucedida (status 2xx).
        if (response.ok) {
            // A API retorna um `login_step` para indicar a próxima ação.
            if (data.login_step === '2fa_required') {
                // Se o 2FA for necessário, abre o modal correspondente.
                const twoFAModal = new bootstrap.Modal(document.getElementById('2faModal'));
                // Armazena o token temporário, que autoriza a verificação do código 2FA.
                document.getElementById('tempToken').value = data.temp_token;
                twoFAModal.show();
            } else if (data.login_step === 'verification_required') {
                // Se o e-mail ainda não foi verificado, exibe uma mensagem informativa.
                errorMessageDiv.textContent = data.message;
                errorMessageDiv.classList.remove('d-none');
                errorMessageDiv.classList.remove('alert-danger'); // Usa a classe de informação.
                errorMessageDiv.classList.add('alert-info');
            } else {
                // Se o login foi direto e bem-sucedido, armazena os tokens.
                localStorage.setItem('accessToken', data.access_token);
                localStorage.setItem('refreshToken', data.refresh_token);
                // Redireciona o usuário para o painel de controle.
                window.location.href = 'dashboard.html';
            }
        } else {
            // Se a API retornou um erro, exibe a mensagem de detalhe.
            errorMessageDiv.textContent = data.detail || 'Ocorreu um erro desconhecido.';
            errorMessageDiv.classList.remove('d-none');
        }

    } catch (error) {
        // Captura erros de rede (ex: servidor offline).
        errorMessageDiv.textContent = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
        errorMessageDiv.classList.remove('d-none');
        console.error('Erro de login:', error);
    } finally {
        // Reativa o botão de submissão, independentemente do resultado.
        submitButton.disabled = false;
    }
}

/**
 * Função para lidar com a submissão do formulário de 2FA.
 * @param {Event} event - O objeto do evento de submissão do formulário.
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
        // Envia o token temporário e o código OTP para o endpoint de verificação 2FA.
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
            // Se o código 2FA estiver correto, armazena os tokens finais.
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            window.location.href = 'dashboard.html';
        } else {
            // Se houver um erro, exibe a mensagem da API.
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

// Garante que o script só adicione os "escutadores" de eventos após o HTML ter sido completamente carregado.
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