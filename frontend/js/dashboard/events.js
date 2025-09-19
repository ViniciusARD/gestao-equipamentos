// js/dashboard/events.js

import { API_URL, apiFetch } from './api.js';
import { showToast, setButtonLoading, openReserveModal, openEquipmentTypeModal, openManageUnitsModal, resetUnitForm, renderStatusBadge } from './ui.js';
import { loadDashboardHomeView, loadEquipmentsView, loadMyReservationsView, loadMyAccountView, fetchAndShowUnits } from './views.js';
import {
    loadManageReservationsView,
    loadManageUsersView,
    loadManageInventoryView,
    loadSystemLogsView,
    handleUpdateReservationStatus,
    handleUserAction,
    handleEquipmentTypeSubmit
} from './admin.js';

let appState = {};

export function initializeEvents(state) {
    appState = state;
    document.body.addEventListener('click', handleGlobalClick);
    document.body.addEventListener('submit', handleGlobalSubmit);
    document.body.addEventListener('keyup', handleGlobalKeyUp);
    document.body.addEventListener('change', handleGlobalChange);
}

// --- Funções de Manipulação de Eventos (Handlers) ---

async function handleGlobalClick(event) {
    const target = event.target.closest('a, button');
    if (!target) return;

    const token = appState.token;

    const navActions = {
        'nav-dashboard': () => loadDashboardHomeView(token),
        'nav-equipments': () => loadEquipmentsView(token),
        'nav-my-reservations': () => loadMyReservationsView(token, {}),
        'nav-my-account': () => loadMyAccountView(appState.currentUser),
        'nav-manage-reservations': () => loadManageReservationsView(token, {}),
        'nav-manage-users': () => loadManageUsersView(token, appState.currentUser.id),
        'nav-manage-inventory': () => loadManageInventoryView(token),
        'nav-system-logs': () => loadSystemLogsView(token, {})
    };
    if (navActions[target.id]) {
        event.preventDefault();
        document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(el => el.classList.remove('active'));
        target.classList.add('active');
        navActions[target.id]();
    }

    if (target.matches('#logoutButton')) appState.logout(target);
    if (target.matches('#menu-toggle')) document.getElementById('wrapper').classList.toggle('toggled');
    if (target.matches('.view-units-btn')) fetchAndShowUnits(target.dataset.typeId, token);
    if (target.matches('.reserve-btn')) openReserveModal(target.dataset.unitId, target.dataset.unitIdentifier);
    if (target.matches('.admin-action-btn')) handleUpdateReservationStatus(target, token);
    if (target.matches('.user-action-btn')) handleUserAction(target, token, appState.currentUser.id);
    if (target.matches('.inventory-action-btn')) handleInventoryAction(target, token);
    if (target.matches('.unit-action-btn')) handleUnitAction(target, token);
    if (target.matches('#cancelEditUnitBtn')) resetUnitForm();
    if (target.matches('#connectGoogleBtn')) handleGoogleConnect(target, token);
    if (target.matches('#deleteAccountBtn')) handleDeleteAccount(target, token);

    // --- Handlers para os botões de APLICAR FILTRO ---
    if (target.matches('#applyReservationsFilterBtn')) applyAdminReservationsFilter();
    if (target.matches('#applyMyReservationsFilterBtn')) applyMyReservationsFilter();
    if (target.matches('#searchUsersBtn')) applyUsersFilter();
    if (target.matches('#searchInventoryBtn')) applyInventoryFilter();
    if (target.matches('#applyLogsFilterBtn')) applyLogsFilter();


    // --- Handlers para cliques em botões de filtro (que recarregam a view) ---
    if (target.matches('.status-filter-btn')) {
        document.querySelectorAll('.status-filter-btn').forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
        target.classList.replace('btn-outline-primary', 'btn-primary');
        applyMyReservationsFilter();
    }
    if (target.matches('.admin-status-filter-btn')) {
        document.querySelectorAll('.admin-status-filter-btn').forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
        target.classList.replace('btn-outline-primary', 'btn-primary');
        applyAdminReservationsFilter();
    }
    if (target.matches('.inventory-availability-filter-btn')) {
        document.querySelectorAll('.inventory-availability-filter-btn').forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
        target.classList.replace('btn-outline-primary', 'btn-primary');
        applyInventoryFilter();
    }
    if (target.matches('.user-role-filter-btn')) {
        document.querySelectorAll('.user-role-filter-btn').forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
        target.classList.replace('btn-outline-primary', 'btn-primary');
        applyUsersFilter();
    }
}

async function handleGlobalChange(event) {
    const target = event.target;
    if (!target) return;

    if (target.matches('#equipmentsCategoryFilter')) {
        applyEquipmentsFilter();
    }
    if (target.matches('#inventoryCategoryFilter')) {
        applyInventoryFilter();
    }
}


async function handleGlobalSubmit(event) {
    const token = appState.token;
    if (event.target.id === 'reservationForm') {
        event.preventDefault();
        handleReservationSubmit(token);
    } else if (event.target.id === 'equipmentTypeForm') {
        event.preventDefault();
        handleEquipmentTypeSubmit(token);
    } else if (event.target.id === 'unitForm') {
        event.preventDefault();
        handleUnitFormSubmit(token);
    } else if (event.target.id === 'updateProfileForm') {
        event.preventDefault();
        handleUpdateProfile(token);
    }
}

function handleGlobalKeyUp(event) {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (target.matches('#reservationsSearchInput')) applyAdminReservationsFilter();
    if (target.matches('#usersSearchInput')) applyUsersFilter();
    if (target.matches('#equipmentsSearchInput')) applyEquipmentsFilter();
    if (target.matches('#myReservationsSearchInput')) applyMyReservationsFilter();
    if (target.matches('#inventorySearchInput')) applyInventoryFilter();
    if (target.matches('#logsSearchInput')) applyLogsFilter();
}

// --- Funções Genéricas para Aplicar Filtros ---

function applyAdminReservationsFilter() {
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

function applyMyReservationsFilter() {
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

function applyUsersFilter() {
    const token = appState.token;
    const searchTerm = document.getElementById('usersSearchInput').value.trim();
    const activeRoleBtn = document.querySelector('.user-role-filter-btn.btn-primary');
    const role = activeRoleBtn ? activeRoleBtn.dataset.role : 'all';
    loadManageUsersView(token, appState.currentUser.id, searchTerm, role);
}

function applyInventoryFilter() {
    const token = appState.token;
    const searchTerm = document.getElementById('inventorySearchInput').value.trim();
    const category = document.getElementById('inventoryCategoryFilter').value;
    const activeAvailabilityBtn = document.querySelector('.inventory-availability-filter-btn.btn-primary');
    const availability = activeAvailabilityBtn ? activeAvailabilityBtn.dataset.availability : 'all';
    loadManageInventoryView(token, searchTerm, category, availability);
}

function applyEquipmentsFilter() {
    const token = appState.token;
    const searchTerm = document.getElementById('equipmentsSearchInput').value.trim();
    const category = document.getElementById('equipmentsCategoryFilter').value;
    loadEquipmentsView(token, searchTerm, category);
}

function applyLogsFilter() {
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


// --- Lógica de Handlers específicos ---

async function handleReservationSubmit(token) {
    const form = document.getElementById('reservationForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('reservationMessage');
    const unit_id = form.unitIdToReserve.value;
    const start_time = new Date(form.startTime.value);
    const end_time = new Date(form.endTime.value);

    if (isNaN(start_time) || isNaN(end_time) || start_time >= end_time) {
        messageDiv.innerHTML = '<div class="alert alert-danger">Datas inválidas.</div>';
        return;
    }

    setButtonLoading(submitButton, true, 'Enviando...');
    messageDiv.innerHTML = '';
    try {
        await apiFetch(`${API_URL}/reservations/`, token, {
            method: 'POST',
            body: {
                unit_id: parseInt(unit_id),
                start_time: start_time.toISOString(),
                end_time: end_time.toISOString()
            }
        });
        showToast('Reserva solicitada!', 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        form.reset();
        applyMyReservationsFilter(); // Recarrega a view com os filtros atuais
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function handleUpdateProfile(token) {
    const form = document.getElementById('updateProfileForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const newUsername = document.getElementById('profileUsername').value;

    if (newUsername === appState.currentUser.username) {
        showToast('Nenhuma alteração para salvar.', 'info');
        return;
    }

    setButtonLoading(submitButton, true, 'Salvando...');
    try {
        const updatedUser = await apiFetch(`${API_URL}/users/me`, token, {
            method: 'PUT',
            body: { username: newUsername }
        });

        appState.currentUser = updatedUser;
        document.getElementById('user-greeting').textContent = `Olá, ${updatedUser.username}!`;
        showToast('Nome de usuário atualizado com sucesso!', 'success');

    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
        document.getElementById('profileUsername').value = appState.currentUser.username;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function handleGoogleConnect(button, token) {
    setButtonLoading(button, true);
    try {
        const response = await apiFetch(`${API_URL}/google/login`, token);
        window.open(response.authorization_url, '_blank');
        showToast('Abra a nova aba para autorizar o acesso à sua conta Google.', 'info');
    } catch (e) {
        showToast(`Erro ao iniciar conexão: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(button, false);
    }
}

async function handleDeleteAccount(button, token) {
    const confirmation = prompt('Esta ação é irreversível. Para confirmar, digite "excluir minha conta":');
    if (confirmation !== 'excluir minha conta') {
        showToast('Ação cancelada.', 'info');
        return;
    }

    setButtonLoading(button, true);
    try {
        await apiFetch(`${API_URL}/users/me`, token, { method: 'DELETE' });
        showToast('Sua conta foi excluída. Você será desconectado.', 'success');
        setTimeout(() => appState.logout(), 3000);
    } catch (e) {
        showToast(`Erro ao excluir conta: ${e.message}`, 'danger');
        setButtonLoading(button, false);
    }
}

async function handleInventoryAction(button, token) {
    const { action, typeId, typeName } = button.dataset;

    if (action === 'create-type') {
        openEquipmentTypeModal();
    } else if (action === 'edit-type') {
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        openEquipmentTypeModal(type);
    } else if (action === 'view-units') {
        openManageUnitsModal(typeId, typeName);
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        populateUnitsTable(type.units);
    } else if (action === 'delete-type') {
        if (!confirm('Deseja excluir este tipo? Todas as unidades associadas também serão removidas.')) return;
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/types/${typeId}`, token, { method: 'DELETE' });
            document.getElementById(`inventory-row-${typeId}`).remove();
            showToast('Tipo de equipamento excluído!', 'success');
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'danger');
            setButtonLoading(button, false);
        }
    }
}

function populateUnitsTable(units) {
    const tableBody = document.getElementById('unitsTableBody');
    if (units.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhuma unidade cadastrada.</td></tr>';
        return;
    }
    tableBody.innerHTML = units.map(unit => `
        <tr id="unit-row-${unit.id}">
            <td>${unit.id}</td>
            <td>${unit.identifier_code || 'N/A'}</td>
            <td>${renderStatusBadge(unit.status)}</td>
            <td>
                <button class="btn btn-secondary btn-sm me-1 unit-action-btn" data-action="edit" data-unit-id="${unit.id}" title="Editar Unidade" ${unit.status === 'reserved' ? 'disabled' : ''}><i class="bi bi-pencil"></i></button>
                <button class="btn btn-danger btn-sm unit-action-btn" data-action="delete" data-unit-id="${unit.id}" title="Excluir Unidade" ${unit.status === 'reserved' ? 'disabled' : ''}><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function handleUnitFormSubmit(token) {
    const form = document.getElementById('unitForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('unitFormMessage');
    const typeId = form.unitFormTypeId.value;
    const unitId = form.unitFormUnitId.value;
    const unitData = {
        type_id: parseInt(typeId),
        identifier_code: form.unitIdentifier.value || null,
        status: form.unitStatus.value
    };
    setButtonLoading(submitButton, true, 'Salvando...');
    messageDiv.innerHTML = '';
    try {
        const method = unitId ? 'PUT' : 'POST';
        const url = unitId ? `${API_URL}/equipments/units/${unitId}` : `${API_URL}/equipments/units`;
        const bodyData = unitId ? { identifier_code: unitData.identifier_code, status: unitData.status } : unitData;
        await apiFetch(url, token, { method, body: bodyData });
        showToast(`Unidade ${unitId ? 'atualizada' : 'criada'}!`, 'success');
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        populateUnitsTable(type.units);
        resetUnitForm();
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function handleUnitAction(button, token) {
    const { action, unitId } = button.dataset;
    if (action === 'edit') {
        const unitToEdit = {
            id: unitId,
            identifier_code: document.querySelector(`#unit-row-${unitId} td:nth-child(2)`).textContent,
            status: document.querySelector(`#unit-row-${unitId} .badge`).textContent.toLowerCase(),
        };
        prepareUnitFormForEdit(unitToEdit);
    } else if (action === 'delete') {
        if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/units/${unitId}`, token, { method: 'DELETE' });
            document.getElementById(`unit-row-${unitId}`).remove();
            showToast('Unidade excluída!', 'success');
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'danger');
            setButtonLoading(button, false);
        }
    }
}

function prepareUnitFormForEdit(unit) {
    document.getElementById('unitFormTitle').textContent = `Editar Unidade ID: ${unit.id}`;
    document.getElementById('unitFormUnitId').value = unit.id;
    document.getElementById('unitIdentifier').value = unit.identifier_code !== 'N/A' ? unit.identifier_code : '';
    document.getElementById('unitStatus').value = unit.status;
    document.getElementById('cancelEditUnitBtn').style.display = 'block';
}