// js/dashboard/events/filters.js

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
export function applyAdminReservationsFilter(appState, page = 1) {
    const token = appState.token;
    const activeStatusBtn = document.querySelector('.admin-status-filter-btn.btn-primary');
    const params = {
        search: document.getElementById('reservationsSearchInput').value.trim(),
        status: activeStatusBtn ? activeStatusBtn.dataset.status : 'all',
        start_date: document.getElementById('reservationsStartDate').value,
        end_date: document.getElementById('reservationsEndDate').value,
        page: page
    };
    loadManageReservationsView(token, params);
}

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

export function applyViewUsersFilter(appState, page = 1) {
    const token = appState.token;
    const activeRoleBtn = document.querySelector('.view-user-role-filter-btn.btn-primary');
    const params = {
        search: document.getElementById('viewUsersSearchInput').value.trim(),
        role: activeRoleBtn ? activeRoleBtn.dataset.role : 'all',
        sector_id: document.getElementById('viewUserSectorFilter').value,
        page: page
    };
    loadViewUsersView(token, params);
}

export function applyInventoryFilter(appState, page = 1) {
    const token = appState.token;
    const params = {
        search: document.getElementById('inventorySearchInput').value.trim(),
        category: document.getElementById('inventoryCategoryFilter').value,
        page: page
    };
    loadManageInventoryView(token, params);
}

export function applyEquipmentsFilter(appState, page = 1) {
    const token = appState.token;
    const params = {
        search: document.getElementById('equipmentsSearchInput').value.trim(),
        category: document.getElementById('equipmentsCategoryFilter').value,
        page: page
    };
    loadEquipmentsView(token, params);
}

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

export function applySectorsFilter(appState, page = 1) {
    const token = appState.token;
    const searchTerm = document.getElementById('sectorsSearchInput').value.trim();
    loadManageSectorsView(token, searchTerm, page);
}