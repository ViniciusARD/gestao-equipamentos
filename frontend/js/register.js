// js/register.js

/**
 * Módulo de Registro de Novo Usuário.
 *
 * Este script gerencia a interatividade da página de cadastro. Suas principais
 * responsabilidades incluem:
 * 1. Validar a complexidade da senha em tempo real, fornecendo feedback visual
 * ao usuário sobre os requisitos.
 * 2. Carregar e popular dinamicamente o campo de seleção de "Setor" com os dados
 * obtidos da API no momento em que a página é carregada.
 * 3. Lidar com a submissão do formulário de registro, enviando os dados do novo
 * usuário para o endpoint de cadastro da API.
 * 4. Exibir mensagens de sucesso ou de erro detalhadas, com base na resposta do servidor.
 *
 * Dependências:
 * - A estrutura HTML de `register.html`.
 * - Bootstrap 5 Icons para os ícones de feedback da validação de senha.
 */


// --- LÓGICA DE VALIDAÇÃO DE SENHA EM TEMPO REAL ---
const passwordInput = document.getElementById('password');
// Objeto que define os requisitos da senha e as funções de validação.
const requirements = {
    'req-length': (p) => p.length >= 8,
    'req-lowercase': (p) => /[a-z]/.test(p),
    'req-uppercase': (p) => /[A-Z]/.test(p),
    'req-number': (p) => /\d/.test(p),
    'req-special': (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p)
};

// Adiciona um "escutador" que é acionado a cada tecla pressionada no campo de senha.
passwordInput.addEventListener('keyup', () => {
    const password = passwordInput.value;
    // Itera sobre cada requisito definido acima.
    for (const [id, validator] of Object.entries(requirements)) {
        const el = document.getElementById(id);
        const icon = el.querySelector('i');
        
        // Se a senha atender ao requisito, atualiza a UI para mostrar sucesso (verde).
        if (validator(password)) {
            el.classList.add('text-success');
            el.classList.remove('text-danger');
            icon.classList.add('text-success');
            icon.classList.remove('text-danger');
            icon.classList.replace('bi-x-circle', 'bi-check-circle');
        } else {
            // Caso contrário, atualiza a UI para mostrar falha (vermelho).
            el.classList.add('text-danger');
            el.classList.remove('text-success');
            icon.classList.add('text-danger');
            icon.classList.remove('text-success');
            icon.classList.replace('bi-check-circle', 'bi-x-circle');
        }
    }
});
// --- FIM DA LÓGICA DE VALIDAÇÃO ---

// Carrega os setores da API assim que o HTML da página é completamente carregado.
document.addEventListener('DOMContentLoaded', async () => {
    const sectorSelect = document.getElementById('sector');
    try {
        // Faz uma requisição para o endpoint que lista os setores. `size=1000` para garantir que todos venham.
        const response = await fetch('http://127.0.0.1:8000/sectors/?size=1000');
        if (!response.ok) {
            throw new Error('Não foi possível carregar os setores.');
        }
        const data = await response.json(); // A resposta é um objeto de página.
        // Itera sobre os itens (setores) e cria um <option> para cada um.
        data.items.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector.id;
            option.textContent = sector.name;
            sectorSelect.appendChild(option);
        });
    } catch (error) {
        // Em caso de erro na busca, exibe uma mensagem de erro no campo de seleção.
        console.error('Erro ao buscar setores:', error);
        sectorSelect.disabled = true;
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Erro ao carregar os setores';
        sectorSelect.appendChild(errorOption);
    }
});

// Adiciona um "escutador" para o evento de submissão do formulário de registro.
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o recarregamento da página.

    // Coleta todos os valores dos campos do formulário.
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const password_confirm = document.getElementById('password_confirm').value;
    const sector_id = document.getElementById('sector').value;
    const terms_accepted = document.getElementById('terms').checked;
    const messageDiv = document.getElementById('message');
    const submitButton = this.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    messageDiv.className = 'alert mt-3 d-none'; // Esconde mensagens antigas.

    try {
        // Monta o corpo da requisição no formato esperado pela API.
        const requestBody = {
            username,
            email,
            password,
            password_confirm,
            sector_id: sector_id ? parseInt(sector_id) : null, // Converte para inteiro ou nulo.
            terms_accepted
        };

        // Envia a requisição de cadastro para a API.
        const response = await fetch('http://127.0.0.1:8000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok) {
            // Se o cadastro for bem-sucedido, exibe uma mensagem de sucesso instruindo o usuário.
            messageDiv.innerHTML = 'Cadastro realizado com sucesso! <br><strong>Enviamos um link de verificação para o seu e-mail. Por favor, ative sua conta para poder fazer o login.</strong>';
            messageDiv.className = 'alert alert-success mt-3';
        } else {
            // Se a API retornar um erro...
            if (data.detail && Array.isArray(data.detail.errors)) {
                // ...e for um erro de validação de senha, formata e exibe a lista de erros.
                const errorList = data.detail.errors.map(err => `<li>${err}</li>`).join('');
                messageDiv.innerHTML = `<strong>A senha não atende aos seguintes requisitos:</strong><ul>${errorList}</ul>`;
            } else {
                // ...para outros erros, exibe a mensagem de detalhe da API.
                messageDiv.textContent = data.detail || 'Ocorreu um erro ao tentar se registrar.';
            }
            messageDiv.className = 'alert alert-danger mt-3';
        }

    } catch (error) {
        // Captura erros de rede.
        messageDiv.textContent = 'Não foi possível conectar ao servidor. Por favor, tente novamente mais tarde.';
        messageDiv.className = 'alert alert-danger mt-3';
        console.error('Erro no registro:', error);
    } finally {
        // Reativa o botão apenas se o registro falhou, para permitir uma nova tentativa.
        if (messageDiv.classList.contains('alert-danger')) {
            submitButton.disabled = false;
        }
    }
});