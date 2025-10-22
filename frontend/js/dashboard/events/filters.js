// js/dashboard/events/filters.js

/**
 * Módulo para Funções de Aplicação de Filtros.
 *
 * Este script centraliza todas as funções que são acionadas quando um utilizador
 * interage com os controlos de filtro nas diferentes vistas do painel (ex: pesquisa,
 * seleção de categoria, clique em botões de status).
 *
 * Cada função é responsável por:
 * 1. Ler os valores atuais dos campos de filtro relevantes numa determinada vista.
 * 2. Montar um objeto de `params` (parâmetros) com esses valores.
 * 3. Chamar a função de carregamento da view (`load...View`) correspondente, passando
 * os novos parâmetros para que a API seja consultada e a lista seja atualizada.
 *
 * Dependências:
 * - Funções de carregamento de view dos módulos `admin.js` e `views.js`.
 */


import {
    loadManageReservationsView,
    loadManageUsersView,
    loadManageInventoryView,
    loadSystemLogsView,
    loadManageSectorsView,
    loadAnalyticsDashboardView,
    loadViewUsersView
} from '../admin.js';

import {
    loadEquipmentsView,
    loadMyReservationsView
} from '../views.js';

// As funções precisam do appState, que será passado como argumento.

/**
 * Aplica os filtros da página "Gerir Reservas" (visão do admin).
 * @param {object} appState - O estado global da aplicação.
 * @param {number} [page=1] - O número da página a ser carregada.
 */
export function applyAdminReservationsFilter(appState, page = 1) {
    const token = appState.token;
    // Encontra o botão de status que está ativo para obter o seu valor.
    const activeStatusBtn = document.querySelector('.admin-status-filter-btn.btn-primary');
    // Recolhe os valores de todos os campos de filtro.
    const params = {
        search: document.getElementById('reservationsSearchInput').value.trim(),
        status: activeStatusBtn ? activeStatusBtn.dataset.status : 'all',
        start_date: document.getElementById('reservationsStartDate').value,
        end_date: document.getElementById('reservationsEndDate').value,
        page: page
    };
    // Chama a função que recarrega a vista com os novos filtros.
    loadManageReservationsView(token, params);
}

/**
 * Aplica os filtros da página "Minhas Reservas".
 * @param {object} appState - O estado global da aplicação.
 * @param {number} [page=1] - O número da página a ser carregada.
 */
export function applyMyReservationsFilter(appState, page = 1) {
    const token = appState.token;
    const activeStatusBtn = document.querySelector('.status-filter-btn.btn-primary');
    const params = {
        search: document.getElementById('myReservationsSearchInput').value.trim(),
        status: activeStatusBtn ? activeStatusBtn.dataset.status : 'all',
        start_date: document.getElementById('myReservationsStartDate').value,
        end_date: document.getElementById('myReservationsEndDate').value,
        page: page
    };
    loadMyReservationsView(token, params);
}

/**
 * Aplica os filtros da página "Gerir Utilizadores" (visão do admin).
 * @param {object} appState - O estado global da aplicação.
 * @param {number} [page=1] - O número da página a ser carregada.
 */
export function applyUsersFilter(appState, page = 1) {
    const token = appState.token;
    const activeRoleBtn = document.querySelector('.user-role-filter-btn.btn-primary');
    const activeStatusBtn = document.querySelector('.user-status-filter-btn.btn-primary');
    const params = {
        search: document.getElementById('usersSearchInput').value.trim(),
        role: activeRoleBtn ? activeRoleBtn.dataset.role : 'all',
        status: activeStatusBtn ? activeStatusBtn.dataset.status : 'all',
        sector_id: document.getElementById('userSectorFilter').value,
        sort_by: document.getElementById('userSortBy').value,
        sort_dir: document.getElementById('userSortDir').value,
        page: page
    };
    loadManageUsersView(token, appState.currentUser.id, params);
}

/**
 * Aplica os filtros da página "Visualizar Utilizadores" (visão do gerente).
 * @param {object} appState - O estado global da aplicação.
 * @param {number} [page=1] - O número da página a ser carregada.
 */
export function applyViewUsersFilter(appState, page = 1) {
    const token = appState.token;
    const activeRoleBtn = document.querySelector('.view-user-role-filter-btn.btn-primary');
    const activeStatusBtn = document.querySelector('.view-user-status-filter-btn.btn-primary');
    const params = {
        search: document.getElementById('viewUsersSearchInput').value.trim(),
        role: activeRoleBtn ? activeRoleBtn.dataset.role : 'all',
        status: activeStatusBtn ? activeStatusBtn.dataset.status : 'all',
        sector_id: document.getElementById('viewUserSectorFilter').value,
        sort_by: document.getElementById('viewUserSortBy').value,
        sort_dir: document.getElementById('viewUserSortDir').value,
        page: page
    };
    loadViewUsersView(token, params);
}

/**
 * Aplica os filtros da página "Gerir Inventário".
 * @param {object} appState - O estado global da aplicação.
 * @param {number} [page=1] - O número da página a ser carregada.
 */
export function applyInventoryFilter(appState, page = 1) {
    const token = appState.token;
    const params = {
        search: document.getElementById('inventorySearchInput').value.trim(),
        category: document.getElementById('inventoryCategoryFilter').value,
        page: page
    };
    loadManageInventoryView(token, params);
}

/**
 * Aplica os filtros da página "Equipamentos".
 * @param {object} appState - O estado global da aplicação.
 * @param {number} [page=1] - O número da página a ser carregada.
 */
export function applyEquipmentsFilter(appState, page = 1) {
    const token = appState.token;
    const params = {
        search: document.getElementById('equipmentsSearchInput').value.trim(),
        category: document.getElementById('equipmentsCategoryFilter').value,
        page: page
    };
    loadEquipmentsView(token, params);
}

/**
 * Aplica os filtros da página "Logs do Sistema".
 * @param {object} appState - O estado global da aplicação.
 * @param {number} [page=1] - O número da página a ser carregada.
 */
export function applyLogsFilter(appState, page = 1) {
    const token = appState.token;
    const params = {
        search: document.getElementById('logsSearchInput').value.trim(),
        level: document.getElementById('logsLevelFilter').value,
        user_id: document.getElementById('logsUserFilter').value,
        start_date: document.getElementById('logsStartDate').value,
        end_date: document.getElementById('logsEndDate').value,
        page: page
    };
    loadSystemLogsView(token, params);
}

/**
 * Aplica os filtros do "Painel de Análise".
 * @param {object} appState - O estado global da aplicação.
 */
export function applyAnalyticsFilter(appState) {
    const token = appState.token;
    const params = {
        start_date: document.getElementById('analyticsStartDate').value,
        end_date: document.getElementById('analyticsEndDate').value,
        sector_id: document.getElementById('analyticsSectorFilter').value,
        equipment_type_id: document.getElementById('analyticsEquipmentTypeFilter').value,
        user_id: document.getElementById('analyticsUserFilter').value,
    };
    loadAnalyticsDashboardView(token, params);
}

/**
 * Aplica os filtros da página "Gerir Setores".
 * @param {object} appState - O estado global da aplicação.
 * @param {number} [page=1] - O número da página a ser carregada.
 */
export function applySectorsFilter(appState, page = 1) {
    const token = appState.token;
    const searchTerm = document.getElementById('sectorsSearchInput').value.trim();
    loadManageSectorsView(token, searchTerm, page);
}