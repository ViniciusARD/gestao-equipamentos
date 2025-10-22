// js/dashboard/main.js

/**
 * Módulo Principal do Dashboard.
 *
 * Este script é o ponto de entrada para a aplicação do painel de controle.
 * Ele gerencia o estado geral da aplicação no frontend, incluindo:
 * 1. A inicialização da aplicação, que verifica a existência de um token de acesso.
 * 2. A busca dos dados do usuário autenticado para personalizar a interface.
 * 3. O controle de acesso, redirecionando para a página de login se o usuário não
 * estiver autenticado.
 * 4. A renderização dos menus de navegação com base nas permissões do usuário (gerente, admin).
 * 5. A inicialização de todos os "escutadores" de eventos globais.
 * 6. O carregamento da view inicial do dashboard.
 * 7. O gerenciamento da funcionalidade de logout.
 *
 * Dependências:
 * - Funções dos módulos `api.js`, `ui.js`, `views.js`, e `events.js`.
 */

import { API_URL, apiFetch, fetchUserData } from './api.js';
import { createToastContainer, setButtonLoading, showToast } from './ui.js';
import { loadDashboardHomeView } from './views.js';
import { initializeEvents } from './events.js';

// Objeto para armazenar o estado global da aplicação no frontend.
// Ele é passado para outras funções para que elas possam acessar o token,
// os dados do usuário ou disparar a função de logout.
const appState = {
    token: null,
    currentUser: null,
    logout: handleLogout
};

/**
 * Inicializa a aplicação do dashboard assim que o DOM é carregado.
 */
async function initializeApp() {
    // Tenta obter o token de acesso do armazenamento local do navegador.
    appState.token = localStorage.getItem('accessToken');
    // Se não houver token, o usuário não está logado. Redireciona para a página de login.
    if (!appState.token) {
        window.location.href = 'login.html';
        return;
    }

    // Cria o container de notificações (toasts) que será usado em toda a aplicação.
    createToastContainer();
    
    // Busca os dados do usuário autenticado usando o token.
    appState.currentUser = await fetchUserData(appState.token);
    
    // Se os dados do usuário forem carregados com sucesso...
    if (appState.currentUser) {
        // Personaliza a saudação na barra de navegação.
        document.getElementById('user-greeting').textContent = `Olá, ${appState.currentUser.username}!`;
        
        // Exibe os menus de navegação restritos com base na permissão (role) do usuário.
        if (appState.currentUser.role === 'manager' || appState.currentUser.role === 'admin') {
            document.getElementById('manager-menu').classList.remove('d-none');
        }
        if (appState.currentUser.role === 'admin') {
            document.getElementById('admin-menu').classList.remove('d-none');
        }
        
        // Inicializa todos os "escutadores" de eventos globais (cliques, submissões, etc.).
        initializeEvents(appState);
        
        // Carrega a view inicial do dashboard (página de início).
        loadDashboardHomeView(appState.token);
    } else {
        // Se `fetchUserData` retornar nulo (o que acontece se a renovação do token falhar),
        // a lógica de redirecionamento para o login dentro de `apiFetch` já terá sido acionada.
        // Nenhuma ação adicional é necessária aqui.
    }
}

/**
 * Lida com o processo de logout do usuário.
 * @param {HTMLElement|null} button - O botão de logout, se houver, para exibir o estado de carregamento.
 */
async function handleLogout(button = null) {
    // Se houver um token e um botão de logout foi clicado...
    if (appState.token && button) {
        setButtonLoading(button, true, 'Saindo...');
        try {
            // Tenta invalidar o token de acesso no backend para maior segurança.
            await apiFetch(`${API_URL}/auth/logout`, appState.token, { method: 'POST' });
        } catch (e) {
            // Se a comunicação com o backend falhar, informa o usuário mas prossegue com o logout local.
            console.error("Falha ao invalidar token no servidor:", e);
            showToast('Não foi possível invalidar a sessão no servidor, mas você será desconectado localmente.', 'warning');
        }
    }
    // Remove os tokens de acesso e de atualização do armazenamento local.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Redireciona o usuário para a página de login.
    window.location.href = 'login.html';
}

// Adiciona o "escutador" para iniciar a aplicação assim que o HTML estiver pronto.
document.addEventListener('DOMContentLoaded', initializeApp);