// js/dashboard/main.js

import { API_URL, apiFetch, fetchUserData } from './api.js';
import { createToastContainer, setButtonLoading, showToast } from './ui.js';
import { loadDashboardHomeView } from './views.js';
import { initializeEvents } from './events.js';

const appState = {
    token: null,
    currentUser: null,
    logout: handleLogout
};

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
        if (appState.currentUser.role === 'manager' || appState.currentUser.role === 'admin') {
            document.getElementById('manager-menu').classList.remove('d-none');
        }
        if (appState.currentUser.role === 'admin') {
            document.getElementById('admin-menu').classList.remove('d-none');
        }
        
        initializeEvents(appState);
        
        // Carrega a nova view inicial do dashboard
        loadDashboardHomeView(appState.token);
    } else {
        // Se fetchUserData falhar (mesmo após a tentativa de refresh), o erro
        // será capturado e o logout será acionado pelo apiFetch.
    }
}

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
    localStorage.removeItem('refreshToken'); // <-- REMOVER
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', initializeApp);