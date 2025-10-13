// js/dashboard/events/filters.js

import {
    loadManageReservationsView,
    loadManageUsersView,
    loadManageInventoryView,
    loadSystemLogsView,
    loadManageSectorsView,
    loadAnalyticsDashboardView
} from '../admin.js';

import {
    loadEquipmentsView,
    loadMyReservationsView
} from '../views.js';

// As funções precisam do appState, que será passado como argumento.
export function applyAdminReservationsFilter(appState) {
    const token = appState.token;
    const activeStatusBtn = document.querySelector('.admin-status-filter-btn.btn-primary');
    const params = {
        search: document.getElementById('reservationsSearchInput').value.trim(),
        status: activeStatusBtn ? activeStatusBtn.dataset.status : 'all',
        start_date: document.getElementById('reservationsStartDate').value,
        end_date: document.getElementById('reservationsEndDate').value,
    };
    loadManageReservationsView(token, params);
}

export function applyMyReservationsFilter(appState) {
    const token = appState.token;
    const activeStatusBtn = document.querySelector('.status-filter-btn.btn-primary');
    const params = {
        search: document.getElementById('myReservationsSearchInput').value.trim(),
        status: activeStatusBtn ? activeStatusBtn.dataset.status : 'all',
        start_date: document.getElementById('myReservationsStartDate').value,
        end_date: document.getElementById('myReservationsEndDate').value,
    };
    loadMyReservationsView(token, params);
}

export function applyUsersFilter(appState) {
    const token = appState.token;
    const searchTerm = document.getElementById('usersSearchInput').value.trim();
    const activeRoleBtn = document.querySelector('.user-role-filter-btn.btn-primary');
    const role = activeRoleBtn ? activeRoleBtn.dataset.role : 'all';
    loadManageUsersView(token, appState.currentUser.id, searchTerm, role);
}

export function applyInventoryFilter(appState) {
    const token = appState.token;
    const searchTerm = document.getElementById('inventorySearchInput').value.trim();
    const category = document.getElementById('inventoryCategoryFilter').value;
    const activeAvailabilityBtn = document.querySelector('.inventory-availability-filter-btn.btn-primary');
    const availability = activeAvailabilityBtn ? activeAvailabilityBtn.dataset.availability : 'all';
    loadManageInventoryView(token, searchTerm, category, availability);
}

export function applyEquipmentsFilter(appState) {
    const token = appState.token;
    const searchTerm = document.getElementById('equipmentsSearchInput').value.trim();
    const category = document.getElementById('equipmentsCategoryFilter').value;
    loadEquipmentsView(token, searchTerm, category);
}

export function applyLogsFilter(appState) {
    const token = appState.token;
    const params = {
        search: document.getElementById('logsSearchInput').value.trim(),
        level: document.getElementById('logsLevelFilter').value,
        user_id: document.getElementById('logsUserFilter').value,
        start_date: document.getElementById('logsStartDate').value,
        end_date: document.getElementById('logsEndDate').value,
    };
    loadSystemLogsView(token, params);
}

export function applyAnalyticsFilter(appState) {
    const token = appState.token;
    const params = {
        start_date: document.getElementById('analyticsStartDate').value,
        end_date: document.getElementById('analyticsEndDate').value,
    };
    loadAnalyticsDashboardView(token, params);
}

export function applySectorsFilter(appState) {
    const token = appState.token;
    const searchTerm = document.getElementById('sectorsSearchInput').value.trim();
    loadManageSectorsView(token, searchTerm);
}