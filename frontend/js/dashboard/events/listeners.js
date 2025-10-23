// js/dashboard/events/listeners.js

/**
 * Módulo Central de Escuta de Eventos (Event Listeners).
 *
 * Este script utiliza a delegação de eventos para gerir todas as interações do utilizador
 * no painel de controlo de forma eficiente. Em vez de anexar múltiplos "escutadores" a
 * elementos individuais, ele anexa um único "escutador" para cada tipo de evento
 * (clique, submissão, etc.) ao corpo (`body`) do documento.
 *
 * Quando um evento ocorre, a função `handleGlobalClick` (ou similar) identifica o
 * elemento alvo e determina a ação apropriada a ser executada com base no seu ID,
 * classe ou atributos de dados. Isso torna a aplicação mais performática e fácil de manter.
 *
 * Funcionalidades:
 * - `initializeEvents()`: Adiciona os "escutadores" de eventos globais ao `body`.
 * - `handleGlobalClick()`: Processa todos os eventos de clique, direcionando para a ação correta
 * (navegação, abertura de modais, ações de admin, etc.).
 * - `handleGlobalSubmit()`: Processa todas as submissões de formulário.
 * - `handleGlobalKeyUp()`: Lida com eventos de teclado (ex: pressionar Enter para pesquisar).
 * - `handleGlobalChange()`: Lida com eventos de mudança de valor em campos `select`.
 *
 * Dependências:
 * - Módulos `ui.js`, `views.js`, `admin.js`, `filters.js`, `forms.js`, `actions.js`.
 */


import { openReserveModal, openSectorModal, resetUnitForm } from '../ui.js';
import { loadDashboardHomeView, loadEquipmentsView, loadMyReservationsView, loadMyAccountView, fetchAndShowUnits } from '../views.js';
import {
    loadManageReservationsView,
    loadManageUsersView,
    loadSystemLogsView,
    loadManageSectorsView,
    handleUpdateReservationStatus,
    handleUserAction,
    loadAnalyticsDashboardView,
    openUserHistoryModal,
    loadViewUsersView,
    loadManageInventoryView,
    loadManageUnitsView,
    populateUnitsTable
} from '../admin.js';

import {
    applyAdminReservationsFilter,
    applyMyReservationsFilter,
    applyUsersFilter,
    applyInventoryFilter,
    applyEquipmentsFilter,
    applyLogsFilter,
    applyAnalyticsFilter,
    applySectorsFilter,
    applyViewUsersFilter
} from './filters.js';

import {
    handleReservationSubmit,
    handleEquipmentTypeSubmit,
    handleUnitFormSubmit,
    handleUpdateProfile,
    handleEnable2FASubmit,
    handleAdminUpdateSector,
    handleReturnSubmit,
    handleSectorFormSubmit
} from './forms.js';

import {
    handleInventoryAction,
    handleUnitAction,
    handleGoogleConnect,
    handleGoogleDisconnect,
    handleDeleteAccount,
    handleEnable2FA,
    handleDisable2FA,
    handleSectorAction,
    handleExportLogs
} from './actions.js';


// Armazena o estado global da aplicação (token, utilizador atual, etc.).
let appState = {};

/**
 * Inicializa os "escutadores" de eventos globais.
 * @param {object} state - O objeto de estado da aplicação.
 */
export function initializeEvents(state) {
    appState = state;
    // Adiciona um "escutador" para cada tipo de evento ao corpo do documento.
    document.body.addEventListener('click', (e) => handleGlobalClick(e, appState));
    document.body.addEventListener('submit', (e) => handleGlobalSubmit(e, appState));
    document.body.addEventListener('keyup', (e) => handleGlobalKeyUp(e, appState));
    document.body.addEventListener('change', (e) => handleGlobalChange(e, appState));
}

/**
 * Manipulador global para todos os eventos de clique.
 * @param {Event} event - O objeto do evento de clique.
 * @param {object} appState - O estado da aplicação.
 */
async function handleGlobalClick(event, appState) {
    // Encontra o elemento clicável mais próximo (link ou botão).
    const target = event.target.closest('a, button');
    if (!target) return; // Se o clique não foi num elemento acionável, ignora.

    const token = appState.token;

    // --- Ações de Navegação (Menu Lateral) ---
    // Mapeia os IDs dos links de navegação para as funções que carregam as respetivas vistas.
    const navActions = {
        'nav-dashboard': () => loadDashboardHomeView(token),
        'nav-equipments': () => loadEquipmentsView(token, {}),
        'nav-my-reservations': () => loadMyReservationsView(token, {}),
        'nav-my-account': () => loadMyAccountView(appState.currentUser, token),
        'nav-manage-reservations': () => loadManageReservationsView(token, {}),
        'nav-manage-inventory': () => loadManageInventoryView(token, {}),
        'nav-view-users': () => loadViewUsersView(token, {}),
        'nav-manage-users': () => loadManageUsersView(token, appState.currentUser.id, {}),
        'nav-manage-sectors': () => loadManageSectorsView(token),
        'nav-system-logs': () => loadSystemLogsView(token, {}),
        'nav-analytics-dashboard': () => loadAnalyticsDashboardView(token, {})
    };
    if (navActions[target.id]) {
        event.preventDefault(); // Impede a navegação padrão do link.
        // Atualiza a classe 'active' para dar feedback visual ao utilizador.
        document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(el => el.classList.remove('active'));
        target.classList.add('active');
        // Executa a função de carregamento da vista.
        navActions[target.id]();
    }

    // --- Ações de Botões ---
    // Mapeia seletores CSS (IDs ou classes) para funções de ação.
    const clickActions = {
        '#logoutButton': () => appState.logout(target),
        '#menu-toggle': () => document.getElementById('wrapper').classList.toggle('toggled'),
        '.view-units-btn': () => fetchAndShowUnits(target.dataset.typeId, token),
        '.reserve-btn': () => openReserveModal(target.dataset.unitId, target.dataset.unitIdentifier),
        '.admin-action-btn': () => handleUpdateReservationStatus(target, token),
        '.user-action-btn': () => {
            // Ações específicas para utilizadores.
            if (target.dataset.action === 'history') {
                openUserHistoryModal(target.dataset.userId, target.dataset.userName, token);
            } else {
                handleUserAction(target, token, appState.currentUser.id)
            }
        },
        '.inventory-action-btn': () => handleInventoryAction(target, token),
        '.unit-action-btn': () => handleUnitAction(target, token),
        '#cancelEditUnitBtn': () => resetUnitForm(),
        '#connectGoogleBtn': () => handleGoogleConnect(target, token),
        '#disconnectGoogleBtn': () => handleGoogleDisconnect(target, token, appState),
        '#deleteAccountBtn': () => handleDeleteAccount(target, token, appState),
        '#enable2faBtn': () => handleEnable2FA(token),
        '#disable2faBtn': () => handleDisable2FA(token, appState),
        '#add-sector-btn': () => openSectorModal(),
        '.sector-action-btn': () => handleSectorAction(target, token),
        '#back-to-inventory-btn': () => loadManageInventoryView(token, {}),
        // Botões para aplicar filtros.
        '#applyReservationsFilterBtn': () => applyAdminReservationsFilter(appState),
        '#applyMyReservationsFilterBtn': () => applyMyReservationsFilter(appState),
        '#applyUsersFilterBtn': () => applyUsersFilter(appState),
        '#applyViewUsersFilterBtn': () => applyViewUsersFilter(appState),
        '#searchInventoryBtn': () => applyInventoryFilter(appState),
        '#searchEquipmentsBtn': () => applyEquipmentsFilter(appState),
        '#searchSectorsBtn': () => applySectorsFilter(appState),
        '#applyLogsFilterBtn': () => applyLogsFilter(appState),
        '#applyAnalyticsFilterBtn': () => applyAnalyticsFilter(appState),
        '#exportLogsBtn': () => handleExportLogs(appState),
    };

    // Itera sobre as ações e executa a correspondente se o seletor corresponder.
    for (const selector in clickActions) {
        if (target.matches(selector)) {
            event.preventDefault();
            clickActions[selector]();
            break; 
        }
    }
    
    // --- Lógica para Grupos de Botões de Filtro ---
    // Trata grupos de botões onde apenas um pode estar ativo (ex: filtros de status).
    const btnGroupFilters = '.status-filter-btn, .admin-status-filter-btn, .user-role-filter-btn, .user-status-filter-btn, .view-user-role-filter-btn, .view-user-status-filter-btn, .unit-status-filter-btn';
    if (target.matches(btnGroupFilters)) {
        // Atualiza a aparência dos botões no grupo.
        const groupSelector = target.className.split(' ').find(cls => cls.endsWith('-btn'));
        document.querySelectorAll(`.${groupSelector}`).forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
        target.classList.replace('btn-outline-primary', 'btn-primary');

        // Dispara a função de filtro apropriada após a seleção.
        if (target.matches('.status-filter-btn')) applyMyReservationsFilter(appState);
        if (target.matches('.admin-status-filter-btn')) applyAdminReservationsFilter(appState);
        if (target.matches('.user-role-filter-btn, .user-status-filter-btn')) applyUsersFilter(appState); 
        if (target.matches('.view-user-role-filter-btn, .view-user-status-filter-btn')) applyViewUsersFilter(appState);

        // Lógica específica para o filtro de status de unidades.
        if (target.matches('.unit-status-filter-btn')) {
            const container = document.getElementById('units-view-container');
            const allUnits = JSON.parse(container.dataset.units);
            const selectedStatus = target.dataset.status;
            populateUnitsTable(allUnits, appState.token, selectedStatus);
        }
    }
    
    // --- Manipulador de Paginação ---
    if (target.matches('.pagination-btn')) {
        event.preventDefault();
        const page = parseInt(target.dataset.page);
        const actionPrefix = target.dataset.actionPrefix; // Identifica a qual vista a paginação pertence.

        // Mapeia o prefixo para a função de filtro correta.
        const paginationActions = {
            'reservations': () => applyAdminReservationsFilter(appState, page),
            'my-reservations': () => applyMyReservationsFilter(appState, page),
            'users': () => applyUsersFilter(appState, page),
            'view-users': () => applyViewUsersFilter(appState, page),
            'logs': () => applyLogsFilter(appState, page),
            'sectors': () => applySectorsFilter(appState, page),
            'inventory': () => applyInventoryFilter(appState, page),
            'equipments': () => applyEquipmentsFilter(appState, page)
        };
        
        if (paginationActions[actionPrefix]) {
            paginationActions[actionPrefix]();
        }
    }
}

/**
 * Manipulador global para eventos de 'change' (mudança de valor),
 * usado principalmente para campos `select` de filtros.
 */
function handleGlobalChange(event, appState) {
    const target = event.target;
    if (!target) return;

    // Mapeia os seletores dos campos `select` para as funções de filtro.
    const changeActions = {
        '#equipmentsCategoryFilter': () => applyEquipmentsFilter(appState),
        '#inventoryCategoryFilter': () => applyInventoryFilter(appState),
        '#userSectorFilter': () => applyUsersFilter(appState),
        '#userSortBy': () => applyUsersFilter(appState),
        '#userSortDir': () => applyUsersFilter(appState),
        '#viewUserSectorFilter': () => applyViewUsersFilter(appState),
        '#viewUserSortBy': () => applyViewUsersFilter(appState),
        '#viewUserSortDir': () => applyViewUsersFilter(appState)
    };

    for (const selector in changeActions) {
        if (target.matches(selector)) {
            changeActions[selector]();
            break;
        }
    }
}

/**
 * Manipulador global para todos os eventos de submissão de formulário.
 */
async function handleGlobalSubmit(event, appState) {
    event.preventDefault(); // Impede o recarregamento da página.
    // Mapeia os IDs dos formulários para as suas respetivas funções de manipulação.
    const formActions = {
        'reservationForm': () => handleReservationSubmit(appState),
        'equipmentTypeForm': () => handleEquipmentTypeSubmit(appState.token),
        'unitForm': () => handleUnitFormSubmit(appState),
        'updateProfileForm': () => handleUpdateProfile(appState),
        '2faEnableForm': () => handleEnable2FASubmit(appState),
        'userSectorForm': () => handleAdminUpdateSector(appState),
        'returnForm': () => handleReturnSubmit(appState),
        'sectorForm': () => handleSectorFormSubmit(appState),
    };

    if (formActions[event.target.id]) {
        formActions[event.target.id]();
    }
}

/**
 * Manipulador global para eventos de 'keyup', usado para aplicar filtros de pesquisa ao pressionar Enter.
 */
function handleGlobalKeyUp(event, appState) {
    // Aplica a ação apenas se a tecla pressionada for 'Enter'.
    if (event.key !== 'Enter') return;
    
    // Mapeia os IDs dos campos de pesquisa para as funções de filtro.
    const keyupActions = {
        '#reservationsSearchInput': () => applyAdminReservationsFilter(appState),
        '#usersSearchInput': () => applyUsersFilter(appState),
        '#viewUsersSearchInput': () => applyViewUsersFilter(appState),
        '#equipmentsSearchInput': () => applyEquipmentsFilter(appState),
        '#myReservationsSearchInput': () => applyMyReservationsFilter(appState),
        '#inventorySearchInput': () => applyInventoryFilter(appState),
        '#logsSearchInput': () => applyLogsFilter(appState),
        '#sectorsSearchInput': () => applySectorsFilter(appState),
    };

    for (const selector in keyupActions) {
        if (event.target.matches(selector)) {
            keyupActions[selector]();
            break;
        }
    }
}