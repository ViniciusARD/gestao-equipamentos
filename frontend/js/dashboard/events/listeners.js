// js/dashboard/events/listeners.js

import { openReserveModal, openSectorModal, resetUnitForm } from '../ui.js';
import { loadDashboardHomeView, loadEquipmentsView, loadMyReservationsView, loadMyAccountView, fetchAndShowUnits } from '../views.js';
import {
    loadManageReservationsView,
    loadManageUsersView,
    loadManageInventoryView,
    loadSystemLogsView,
    loadManageSectorsView,
    handleUpdateReservationStatus,
    handleUserAction,
    loadAnalyticsDashboardView
} from '../admin.js';

import {
    applyAdminReservationsFilter,
    applyMyReservationsFilter,
    applyUsersFilter,
    applyInventoryFilter,
    applyEquipmentsFilter,
    applyLogsFilter,
    applyAnalyticsFilter,
    applySectorsFilter
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

    const navActions = {
        'nav-dashboard': () => loadDashboardHomeView(token),
        'nav-equipments': () => loadEquipmentsView(token),
        'nav-my-reservations': () => loadMyReservationsView(token, {}),
        'nav-my-account': () => loadMyAccountView(appState.currentUser, token),
        'nav-manage-reservations': () => loadManageReservationsView(token, {}),
        'nav-manage-users': () => loadManageUsersView(token, appState.currentUser.id),
        'nav-manage-inventory': () => loadManageInventoryView(token),
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
        '.user-action-btn': () => handleUserAction(target, token, appState.currentUser.id),
        '.inventory-action-btn': () => handleInventoryAction(target, token),
        '.unit-action-btn': () => handleUnitAction(target, token),
        '#cancelEditUnitBtn': () => resetUnitForm(),
        '#connectGoogleBtn': () => handleGoogleConnect(target, token),
        '#deleteAccountBtn': () => handleDeleteAccount(target, token, appState),
        '#enable2faBtn': () => handleEnable2FA(token),
        '#disable2faBtn': () => handleDisable2FA(token, appState),
        '#add-sector-btn': () => openSectorModal(),
        '.sector-action-btn': () => handleSectorAction(target, token),
        // Filtros (botões)
        '#applyReservationsFilterBtn': () => applyAdminReservationsFilter(appState),
        '#applyMyReservationsFilterBtn': () => applyMyReservationsFilter(appState),
        '#searchUsersBtn': () => applyUsersFilter(appState),
        '#searchInventoryBtn': () => applyInventoryFilter(appState),
        '#searchSectorsBtn': () => applySectorsFilter(appState),
        '#applyLogsFilterBtn': () => applyLogsFilter(appState),
        '#applyAnalyticsFilterBtn': () => applyAnalyticsFilter(appState),
    };

    for (const selector in clickActions) {
        if (target.matches(selector)) {
            clickActions[selector]();
            break; 
        }
    }
    
    // Filtros de grupo de botões (com lógica de classe)
    if (target.matches('.status-filter-btn, .admin-status-filter-btn, .inventory-availability-filter-btn, .user-role-filter-btn')) {
        const groupSelector = target.className.split(' ').find(cls => cls.endsWith('-btn'));
        document.querySelectorAll(`.${groupSelector}`).forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
        target.classList.replace('btn-outline-primary', 'btn-primary');

        if (target.matches('.status-filter-btn')) applyMyReservationsFilter(appState);
        if (target.matches('.admin-status-filter-btn')) applyAdminReservationsFilter(appState);
        if (target.matches('.inventory-availability-filter-btn')) applyInventoryFilter(appState);
        if (target.matches('.user-role-filter-btn')) applyUsersFilter(appState);
    }
}

function handleGlobalChange(event, appState) {
    const target = event.target;
    if (!target) return;

    if (target.matches('#equipmentsCategoryFilter')) {
        applyEquipmentsFilter(appState);
    }
    if (target.matches('#inventoryCategoryFilter')) {
        applyInventoryFilter(appState);
    }
}

async function handleGlobalSubmit(event, appState) {
    event.preventDefault();
    const formActions = {
        'reservationForm': () => handleReservationSubmit(appState),
        'equipmentTypeForm': () => handleEquipmentTypeSubmit(appState.token), // admin handler já espera o token
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