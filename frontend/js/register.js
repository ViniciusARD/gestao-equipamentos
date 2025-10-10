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
        const response = await fetch('http://127.0.0.1:8000/sectors');
        if (!response.ok) {
            throw new Error('Could not load sectors.');
        }
        const sectors = await response.json();
        sectors.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector.id;
            option.textContent = sector.name;
            sectorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching sectors:', error);
        sectorSelect.disabled = true;
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Error loading sectors';
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
            messageDiv.innerHTML = 'Registration successful! <br><strong>We have sent a verification link to your email. Please activate your account to be able to log in.</strong>';
            messageDiv.className = 'alert alert-success mt-3';
        } else {
            if (data.detail && Array.isArray(data.detail.errors)) {
                const errorList = data.detail.errors.map(err => `<li>${err}</li>`).join('');
                messageDiv.innerHTML = `<strong>The password does not meet the following requirements:</strong><ul>${errorList}</ul>`;
            } else {
                messageDiv.textContent = data.detail || 'An error occurred while trying to register.';
            }
            messageDiv.className = 'alert alert-danger mt-3';
        }

    } catch (error) {
        messageDiv.textContent = 'Could not connect to the server. Please try again later.';
        messageDiv.className = 'alert alert-danger mt-3';
        console.error('Registration error:', error);
    } finally {
        if (messageDiv.classList.contains('alert-danger')) {
            submitButton.disabled = false;
        }
    }
});