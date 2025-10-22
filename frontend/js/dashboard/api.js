// js/dashboard/api.js

/**
 * Módulo de Comunicação com a API.
 *
 * Este script centraliza todas as chamadas à API do backend. Ele exporta uma
 * função `apiFetch` que abstrai a complexidade do `fetch`, adicionando
 * automaticamente os cabeçalhos de autorização e tratando a renovação
 * de tokens de acesso expirados.
 *
 * Funcionalidades:
 * - `API_URL`: Constante com a URL base da API.
 * - `refreshToken()`: Função auxiliar que utiliza o refresh token para obter um novo
 * access token quando o atual expira, garantindo a continuidade da sessão do usuário.
 * - `apiFetch()`: Função principal para realizar chamadas à API, com lógica de
 * retentativa automática em caso de token expirado.
 * - `fetchUserData()`: Função específica para buscar os dados do usuário logado.
 *
 * Dependências:
 * - Nenhuma.
 */


export const API_URL = 'http://127.0.0.1:8000';

/**
 * Renova o access token utilizando o refresh token armazenado no localStorage.
 * @returns {Promise<string>} - O novo access token.
 * @throws {Error} - Lança um erro se o refresh token não existir ou se a renovação falhar.
 */
async function refreshToken() {
    // Busca o refresh token do armazenamento local.
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        throw new Error('Sessão expirada.');
    }

    // Faz uma requisição para o endpoint de renovação de token.
    const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
        throw new Error('Não foi possível renovar a sessão.');
    }

    // Se a renovação for bem-sucedida, atualiza ambos os tokens no localStorage.
    const data = await response.json();
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);
    // Retorna o novo access token para ser usado na requisição original.
    return data.access_token;
}


/**
 * Função genérica para realizar chamadas à API, com tratamento de autenticação.
 * @param {string} url - A URL do endpoint.
 * @param {string} token - O token de autorização.
 * @param {object} options - Opções adicionais para o fetch (method, body, etc.).
 * @param {boolean} isRetry - Flag interna para evitar um loop infinito de retentativas.
 * @returns {Promise<any>} - A resposta da API em formato JSON.
 */
export async function apiFetch(url, token, options = {}, isRetry = false) {
    // Define os cabeçalhos padrão para as requisições, incluindo o token de autorização.
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    // Monta a configuração final para o `fetch`.
    const config = {
        method: options.method || 'GET',
        headers,
        ...options
    };
    // Se a requisição tiver um corpo, converte-o para uma string JSON.
    if (config.body) {
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    // LÓGICA DE RENOVAÇÃO DE TOKEN:
    // Se a resposta for 401 (Não Autorizado) e esta não for uma retentativa...
    if (response.status === 401 && !isRetry) {
        try {
            // ...tenta obter um novo access token.
            const newAccessToken = await refreshToken();
            // Tenta a requisição original novamente, mas agora com o novo token e marcando como uma retentativa.
            return await apiFetch(url, newAccessToken, options, true);
        } catch (error) {
            // Se a renovação do token falhar, significa que a sessão realmente expirou.
            console.error(error.message);
            // Limpa os tokens do armazenamento local.
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            // Redireciona o usuário para a página de login.
            window.location.href = 'login.html';
            throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
        }
    }

    // Se a resposta for 204 (No Content), não há corpo para ser lido, então retorna nulo.
    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    // Se a resposta não foi bem-sucedida, lança um erro com a mensagem de detalhe da API.
    if (!response.ok) {
        throw new Error(data.detail || 'Ocorreu um erro na comunicação com a API.');
    }

    // Se tudo correu bem, retorna os dados da API.
    return data;
}


/**
 * Busca os dados do usuário autenticado a partir do endpoint `/users/me`.
 * @param {string} token - O token de autorização.
 * @returns {Promise<object|null>} - Os dados do usuário ou nulo em caso de falha.
 */
export async function fetchUserData(token) {
    try {
        // Usa a função `apiFetch` que já contém toda a lógica de autenticação e renovação.
        return await apiFetch(`${API_URL}/users/me`, token);
    } catch (error) {
        console.error(error);
        // Se a busca falhar mesmo após a tentativa de renovação, o logout já foi
        // acionado dentro de `apiFetch`. Retorna nulo para o chamador.
        return null;
    }
}