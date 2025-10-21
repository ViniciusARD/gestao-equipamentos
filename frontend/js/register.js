// js/register.js

// --- INÍCIO DA LÓGICA DE VALIDAÇÃO DE SENHA CORRIGIDA ---
const passwordInput = document.getElementById('password');
const requirements = {
    'req-length': (p) => p.length >= 8,
    'req-lowercase': (p) => /[a-z]/.test(p),
    'req-uppercase': (p) => /[A-Z]/.test(p),
    'req-number': (p) => /\d/.test(p),
    'req-special': (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p)
};

passwordInput.addEventListener('keyup', () => {
    const password = passwordInput.value;
    for (const [id, validator] of Object.entries(requirements)) {
        const el = document.getElementById(id);
        const icon = el.querySelector('i');
        
        if (validator(password)) {
            el.classList.add('text-success');
            el.classList.remove('text-danger');
            icon.classList.add('text-success');
            icon.classList.remove('text-danger');
            icon.classList.replace('bi-x-circle', 'bi-check-circle');
        } else {
            el.classList.add('text-danger');
            el.classList.remove('text-success');
            icon.classList.add('text-danger');
            icon.classList.remove('text-success');
            icon.classList.replace('bi-check-circle', 'bi-x-circle');
        }
    }
});
// --- FIM DA LÓGICA DE VALIDAÇÃO DE SENHA CORRIGIDA ---

// Carrega os setores quando a página é carregada
document.addEventListener('DOMContentLoaded', async () => {
    const sectorSelect = document.getElementById('sector');
    try {
        // CORREÇÃO: Adicionada a barra final na URL
        const response = await fetch('http://127.0.0.1:8000/sectors/?size=1000'); // Pede todos os setores
        if (!response.ok) {
            throw new Error('Não foi possível carregar os setores.');
        }
        const data = await response.json(); // Agora a resposta é um objeto de página
        data.items.forEach(sector => { // Itera sobre data.items
            const option = document.createElement('option');
            option.value = sector.id;
            option.textContent = sector.name;
            sectorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar setores:', error);
        sectorSelect.disabled = true;
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Erro ao carregar os setores';
        sectorSelect.appendChild(errorOption);
    }
});


document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const password_confirm = document.getElementById('password_confirm').value;
    const sector_id = document.getElementById('sector').value;
    const terms_accepted = document.getElementById('terms').checked;
    const messageDiv = document.getElementById('message');
    const submitButton = this.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    messageDiv.className = 'alert mt-3 d-none';

    try {
        const requestBody = {
            username,
            email,
            password,
            password_confirm,
            sector_id: sector_id ? parseInt(sector_id) : null,
            terms_accepted
        };

        const response = await fetch('http://127.0.0.1:8000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.innerHTML = 'Cadastro realizado com sucesso! <br><strong>Enviamos um link de verificação para o seu e-mail. Por favor, ative sua conta para poder fazer o login.</strong>';
            messageDiv.className = 'alert alert-success mt-3';
        } else {
            if (data.detail && Array.isArray(data.detail.errors)) {
                const errorList = data.detail.errors.map(err => `<li>${err}</li>`).join('');
                messageDiv.innerHTML = `<strong>A senha não atende aos seguintes requisitos:</strong><ul>${errorList}</ul>`;
            } else {
                messageDiv.textContent = data.detail || 'Ocorreu um erro ao tentar se registrar.';
            }
            messageDiv.className = 'alert alert-danger mt-3';
        }

    } catch (error) {
        messageDiv.textContent = 'Não foi possível conectar ao servidor. Por favor, tente novamente mais tarde.';
        messageDiv.className = 'alert alert-danger mt-3';
        console.error('Erro no registro:', error);
    } finally {
        if (messageDiv.classList.contains('alert-danger')) {
            submitButton.disabled = false;
        }
    }
});