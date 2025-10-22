// js/forgot-password.js

/**
 * Módulo para a funcionalidade de "Esqueci a Senha".
 *
 * Este script gerencia o formulário de recuperação de senha. Ele captura o evento de
 * submissão do formulário, envia o e-mail do usuário para a API e exibe
 * mensagens de sucesso ou erro, tratando a comunicação com o backend.
 *
 * Dependências:
 * - Nenhuma (apenas a estrutura HTML da página forgot-password.html).
 */

// Adiciona um "escutador" de eventos que aguarda a submissão do formulário com id 'forgotPasswordForm'.
document.getElementById('forgotPasswordForm').addEventListener('submit', async function(event) {
    // Impede o comportamento padrão do formulário, que é recarregar a página.
    event.preventDefault();

    // Obtém os elementos do DOM necessários para a operação.
    const email = document.getElementById('email').value;
    const messageDiv = document.getElementById('message');
    const submitButton = this.querySelector('button');

    // Fornece feedback visual ao usuário, desativando o botão e mostrando uma mensagem de processamento.
    submitButton.disabled = true;
    messageDiv.className = 'alert alert-info mt-3';
    messageDiv.textContent = 'A processar...';

    try {
        // Envia uma requisição assíncrona para o endpoint de recuperação de senha da API.
        const response = await fetch('http://127.0.0.1:8000/auth/forgot-password', {
            method: 'POST', // Define o método HTTP como POST.
            headers: {
                'Content-Type': 'application/json' // Informa à API que o corpo da requisição é um JSON.
            },
            // Converte o e-mail em uma string JSON para ser enviada no corpo da requisição.
            body: JSON.stringify({ email })
        });

        // Converte a resposta da API (que é um JSON) para um objeto JavaScript.
        const data = await response.json();

        // Por segurança, a API sempre retorna uma resposta de sucesso,
        // para não revelar se um e-mail está ou não cadastrado no sistema.
        // A mensagem de confirmação genérica é exibida ao usuário.
        messageDiv.className = 'alert alert-success mt-3';
        messageDiv.textContent = data.message;

    } catch (error) {
        // Se ocorrer um erro de rede (ex: API offline), exibe uma mensagem de erro genérica.
        messageDiv.className = 'alert alert-danger mt-3';
        messageDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
        console.error('Erro na solicitação:', error);
    } finally {
        // O bloco 'finally' é executado independentemente de ter ocorrido um erro ou não.
        // Reativa o botão após 5 segundos para evitar que o usuário envie múltiplas solicitações seguidas (spam).
        setTimeout(() => {
            submitButton.disabled = false;
        }, 5000);
    }
});