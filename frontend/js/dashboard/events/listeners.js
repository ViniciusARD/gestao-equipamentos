// js/dashboard/events/listeners.js

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
    handleSectorAction
} from './actions.js';


let appState = {};

export function initializeEvents(state) {
    appState = state;
    document.body.addEventListener('click', (e) => handleGlobalClick(e, appState));
    document.body.addEventListener('submit', (e) => handleGlobalSubmit(e, appState));
    document.body.addEventListener('keyup', (e) => handleGlobalKeyUp(e, appState));
    document.body.addEventListener('change', (e) => handleGlobalChange(e, appState));
}

async function handleGlobalClick(event, appState) {
    const target = event.target.closest('a, button');
    if (!target) return;

    const token = appState.token;

    // Ações de Navegação
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
        event.preventDefault();
        document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(el => el.classList.remove('active'));
        target.classList.add('active');
        navActions[target.id]();
    }

    // Ações de Botões
    const clickActions = {
        '#logoutButton': () => appState.logout(target),
        '#menu-toggle': () => document.getElementById('wrapper').classList.toggle('toggled'),
        '.view-units-btn': () => fetchAndShowUnits(target.dataset.typeId, token),
        '.reserve-btn': () => openReserveModal(target.dataset.unitId, target.dataset.unitIdentifier),
        '.admin-action-btn': () => handleUpdateReservationStatus(target, token),
        '.user-action-btn': () => {
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
        // Filtros (botões de aplicação)
        '#applyReservationsFilterBtn': () => applyAdminReservationsFilter(appState),
        '#applyMyReservationsFilterBtn': () => applyMyReservationsFilter(appState),
        '#applyUsersFilterBtn': () => applyUsersFilter(appState),
        '#applyViewUsersFilterBtn': () => applyViewUsersFilter(appState), // <-- CORREÇÃO AQUI
        '#searchInventoryBtn': () => applyInventoryFilter(appState),
        '#searchEquipmentsBtn': () => applyEquipmentsFilter(appState),
        '#searchSectorsBtn': () => applySectorsFilter(appState),
        '#applyLogsFilterBtn': () => applyLogsFilter(appState),
        '#applyAnalyticsFilterBtn': () => applyAnalyticsFilter(appState),
    };

    for (const selector in clickActions) {
        if (target.matches(selector)) {
            event.preventDefault();
            clickActions[selector]();
            break; 
        }
    }
    
    // Filtros de grupo de botões (com lógica de classe)
    const btnGroupFilters = '.status-filter-btn, .admin-status-filter-btn, .user-role-filter-btn, .user-status-filter-btn, .view-user-role-filter-btn, .view-user-status-filter-btn, .unit-status-filter-btn'; // <-- CORREÇÃO AQUI
    if (target.matches(btnGroupFilters)) {
        const groupSelector = target.className.split(' ').find(cls => cls.endsWith('-btn'));
        document.querySelectorAll(`.${groupSelector}`).forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
        target.classList.replace('btn-outline-primary', 'btn-primary');

        // Dispara a função de filtro apropriada
        if (target.matches('.status-filter-btn')) applyMyReservationsFilter(appState);
        if (target.matches('.admin-status-filter-btn')) applyAdminReservationsFilter(appState);
        if (target.matches('.user-role-filter-btn, .user-status-filter-btn')) applyUsersFilter(appState); 
        if (target.matches('.view-user-role-filter-btn, .view-user-status-filter-btn')) applyViewUsersFilter(appState); // <-- CORREÇÃO AQUI

        if (target.matches('.unit-status-filter-btn')) {
            const container = document.getElementById('units-view-container');
            const allUnits = JSON.parse(container.dataset.units);
            const selectedStatus = target.dataset.status;
            populateUnitsTable(allUnits, appState.token, selectedStatus);
        }
    }
    
    // Handler de Paginação
    if (target.matches('.pagination-btn')) {
        event.preventDefault();
        const page = parseInt(target.dataset.page);
        const actionPrefix = target.dataset.actionPrefix;

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

function handleGlobalChange(event, appState) {
    const target = event.target;
    if (!target) return;

    // Esses filtros são acionados na mudança de valor do select
    const changeActions = {
        '#equipmentsCategoryFilter': () => applyEquipmentsFilter(appState),
        '#inventoryCategoryFilter': () => applyInventoryFilter(appState),
        '#userSectorFilter': () => applyUsersFilter(appState),
        '#userSortBy': () => applyUsersFilter(appState),
        '#userSortDir': () => applyUsersFilter(appState),
        '#viewUserSectorFilter': () => applyViewUsersFilter(appState),
        '#viewUserSortBy': () => applyViewUsersFilter(appState), // <-- CORREÇÃO AQUI
        '#viewUserSortDir': () => applyViewUsersFilter(appState) // <-- CORREÇÃO AQUI
    };

    for (const selector in changeActions) {
        if (target.matches(selector)) {
            changeActions[selector]();
            break;
        }
    }
}

async function handleGlobalSubmit(event, appState) {
    event.preventDefault();
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

function handleGlobalKeyUp(event, appState) {
    if (event.key !== 'Enter') return;
    
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