// js/dashboard/api.js

export const API_URL = 'http://127.0.0.1:8000';

// <-- NOVA FUNÇÃO AUXILIAR -->
async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        throw new Error('Sessão expirada.');
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
        throw new Error('Não foi possível renovar a sessão.');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);
    return data.access_token;
}


/**
 * Função genérica para realizar chamadas à API.
 * @param {string} url - A URL do endpoint.
 * @param {string} token - O token de autorização.
 * @param {object} options - Opções adicionais para o fetch.
 * @param {boolean} isRetry - Flag para evitar loop infinito de retentativas.
 * @returns {Promise<any>} - A resposta da API em JSON.
 */
export async function apiFetch(url, token, options = {}, isRetry = false) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    const config = {
        method: options.method || 'GET',
        headers,
        ...options
    };
    if (config.body) {
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    // <-- LÓGICA DE ATUALIZAÇÃO -->
    if (response.status === 401 && !isRetry) {
        try {
            const newAccessToken = await refreshToken();
            // Tenta a requisição original novamente com o novo token
            return await apiFetch(url, newAccessToken, options, true);
        } catch (error) {
            // Se o refresh token falhar, desloga o usuário
            console.error(error.message);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = 'login.html';
            throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
        }
    }


    if (response.status === 204) { // No Content
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || 'Ocorreu um erro na comunicação com a API.');
    }

    return data;
}


/**
 * Busca os dados do usuário autenticado.
 * @param {string} token - O token de autorização.
 * @returns {Promise<object|null>} - Os dados do usuário ou null em caso de falha.
 */
export async function fetchUserData(token) {
    try {
        // A função apiFetch agora cuida da lógica de refresh
        return await apiFetch(`${API_URL}/users/me`, token);
    } catch (error) {
        console.error(error);
        // O logout será acionado pela falha no apiFetch
        return null;
    }
}