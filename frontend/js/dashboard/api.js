// js/dashboard/api.js

export const API_URL = 'http://127.0.0.1:8000';

/**
 * Função genérica para realizar chamadas à API.
 * @param {string} url - A URL do endpoint.
 * @param {string} token - O token de autorização.
 * @param {object} options - Opções adicionais para o fetch.
 * @returns {Promise<any>} - A resposta da API em JSON.
 */
export async function apiFetch(url, token, options = {}) {
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
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Falha ao buscar dados do usuário.');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        // A função de logout será chamada no main.js
        return null;
    }
}