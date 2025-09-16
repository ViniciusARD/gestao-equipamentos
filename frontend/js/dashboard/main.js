// js/dashboard/main.js

import { API_URL, apiFetch, fetchUserData } from './api.js';
import { createToastContainer, setButtonLoading, showToast } from './ui.js';
import { loadEquipmentsView } from './views.js';
import { initializeEvents } from './events.js';

// Estado global da aplicação
const appState = {
    token: null,
    currentUser: null,
    logout: handleLogout // Adiciona a função de logout ao estado
};

/**
 * Função de inicialização da aplicação no dashboard.
 */
async function initializeApp() {
    appState.token = localStorage.getItem('accessToken');
    if (!appState.token) {
        window.location.href = 'login.html';
        return;
    }

    createToastContainer();
    
    appState.currentUser = await fetchUserData(appState.token);
    
    if (appState.currentUser) {
        document.getElementById('user-greeting').textContent = `Olá, ${appState.currentUser.username}!`;
        if (appState.currentUser.role === 'admin') {
            document.getElementById('admin-menu').classList.remove('d-none');
        }
        
        // Inicializa os ouvintes de eventos globais
        initializeEvents(appState);
        
        // Carrega a view inicial
        loadEquipmentsView(appState.token);
    } else {
        // Se não conseguir buscar o usuário, desloga
        handleLogout();
    }
}

/**
 * Lida com o processo de logout do usuário.
 * @param {HTMLElement|null} button - O botão de logout, se disponível.
 */
async function handleLogout(button = null) {
    if (appState.token && button) {
        setButtonLoading(button, true, 'Saindo...');
        try {
            await apiFetch(`${API_URL}/auth/logout`, appState.token, { method: 'POST' });
        } catch (e) {
            console.error("Falha ao invalidar token no servidor:", e);
            showToast('Não foi possível invalidar a sessão no servidor, mas você será desconectado localmente.', 'warning');
        }
    }
    localStorage.removeItem('accessToken');
    window.location.href = 'login.html';
}

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);