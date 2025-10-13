// js/dashboard/events.js

import { API_URL, apiFetch } from './api.js';
import { showToast, setButtonLoading, openReserveModal, openEquipmentTypeModal, openManageUnitsModal, resetUnitForm, renderStatusBadge, openUnitHistoryModal, openSectorModal } from './ui.js';
import { loadDashboardHomeView, loadEquipmentsView, loadMyReservationsView, loadMyAccountView, fetchAndShowUnits } from './views.js';
import {
    loadManageReservationsView,
    loadManageUsersView,
    loadManageInventoryView,
    loadSystemLogsView,
    loadManageSectorsView,
    handleUpdateReservationStatus,
    handleUserAction,
    handleEquipmentTypeSubmit,
    loadAnalyticsDashboardView
} from './admin.js'; // A importação continua a mesma, mas agora busca do novo "index"

let appState = {};

export function initializeEvents(state) {
    appState = state;
    document.body.addEventListener('click', handleGlobalClick);
    document.body.addEventListener('submit', handleGlobalSubmit);
    document.body.addEventListener('keyup', handleGlobalKeyUp);
    document.body.addEventListener('change', handleGlobalChange);
}

async function handleGlobalClick(event) {
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
    if (target.matches('#enable2faBtn')) handleEnable2FA(token);
    if (target.matches('#disable2faBtn')) handleDisable2FA(token);
    if (target.matches('#applyReservationsFilterBtn')) applyAdminReservationsFilter();
    if (target.matches('#applyMyReservationsFilterBtn')) applyMyReservationsFilter();
    if (target.matches('#searchUsersBtn')) applyUsersFilter();
    if (target.matches('#searchInventoryBtn')) applyInventoryFilter();
    if (target.matches('#applyLogsFilterBtn')) applyLogsFilter();
    if (target.matches('#applyAnalyticsFilterBtn')) applyAnalyticsFilter();

    if (target.matches('#add-sector-btn')) openSectorModal();
    if (target.matches('.sector-action-btn')) handleSectorAction(target, token);
    if (target.matches('#searchSectorsBtn')) applySectorsFilter();


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
    event.preventDefault();
    
    if (event.target.id === 'reservationForm') handleReservationSubmit(token);
    else if (event.target.id === 'equipmentTypeForm') handleEquipmentTypeSubmit(token);
    else if (event.target.id === 'unitForm') handleUnitFormSubmit(token);
    else if (event.target.id === 'updateProfileForm') handleUpdateProfile(token);
    else if (event.target.id === '2faEnableForm') handleEnable2FASubmit(token);
    else if (event.target.id === 'userSectorForm') handleAdminUpdateSector(token);
    else if (event.target.id === 'returnForm') handleReturnSubmit(token);
    else if (event.target.id === 'sectorForm') handleSectorFormSubmit(token);
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
    if (target.matches('#sectorsSearchInput')) applySectorsFilter();
}

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

function applyAnalyticsFilter() {
    const token = appState.token;
    const params = {
        start_date: document.getElementById('analyticsStartDate').value,
        end_date: document.getElementById('analyticsEndDate').value,
    };
    loadAnalyticsDashboardView(token, params);
}

function applySectorsFilter() {
    const token = appState.token;
    const searchTerm = document.getElementById('sectorsSearchInput').value.trim();
    loadManageSectorsView(token, searchTerm);
}

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
        showToast('Reserva solicitada com sucesso!', 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        form.reset();
        applyMyReservationsFilter();
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
    const newSectorId = document.getElementById('profileSector').value;

    const payload = {};
    let changed = false;

    if (newUsername !== appState.currentUser.username) {
        payload.username = newUsername;
        changed = true;
    }
    
    const currentSectorId = appState.currentUser.sector ? appState.currentUser.sector.id.toString() : "";
    if (newSectorId !== currentSectorId) {
        payload.sector_id = newSectorId ? parseInt(newSectorId) : null;
        changed = true;
    }

    if (!changed) {
        showToast('Nenhuma alteração para salvar.', 'info');
        return;
    }

    setButtonLoading(submitButton, true, 'Salvando...');
    try {
        const updatedUser = await apiFetch(`${API_URL}/users/me`, token, {
            method: 'PUT',
            body: payload
        });

        appState.currentUser = updatedUser;
        document.getElementById('user-greeting').textContent = `Olá, ${updatedUser.username}!`;
        showToast('Perfil atualizado com sucesso!', 'success');

    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
        document.getElementById('profileUsername').value = appState.currentUser.username;
        document.getElementById('profileSector').value = currentSectorId;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function handleAdminUpdateSector(token) {
    const form = document.getElementById('userSectorForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const userId = form.dataset.userId;
    const sector_id = document.getElementById('userSectorSelect').value;

    setButtonLoading(submitButton, true, 'Salvando...');
    try {
        const updatedUser = await apiFetch(`${API_URL}/admin/users/${userId}/sector`, token, {
            method: 'PATCH',
            body: { sector_id: sector_id ? parseInt(sector_id) : null }
        });

        const row = document.getElementById(`user-row-${userId}`);
        if (row) {
            row.querySelector('.sector-cell').innerHTML = updatedUser.sector ? updatedUser.sector.name : '<span class="text-muted">N/A</span>';
        }
        
        showToast("Setor do usuário atualizado!", 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
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
    const confirmation = prompt('Esta ação é irreversível. Para confirmar, digite "deletar minha conta":');
    if (confirmation !== 'deletar minha conta') {
        showToast('Ação cancelada.', 'info');
        return;
    }

    setButtonLoading(button, true);
    try {
        await apiFetch(`${API_URL}/users/me`, token, { method: 'DELETE' });
        showToast('Sua conta foi deletada. Você será desconectado.', 'success');
        setTimeout(() => appState.logout(), 3000);
    } catch (e) {
        showToast(`Erro ao deletar conta: ${e.message}`, 'danger');
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
        if (!confirm('Deseja deletar este tipo? Todas as unidades associadas também serão removidas.')) return;
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/types/${typeId}`, token, { method: 'DELETE' });
            document.getElementById(`inventory-row-${typeId}`).remove();
            showToast('Tipo de equipamento deletado!', 'success');
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
                <button class="btn btn-info btn-sm text-white me-1 unit-action-btn" data-action="history" data-unit-id="${unit.id}" title="Ver Histórico"><i class="bi bi-clock-history"></i></button>
                <button class="btn btn-secondary btn-sm me-1 unit-action-btn" data-action="edit" data-unit-id="${unit.id}" title="Editar Unidade" ${unit.status === 'reserved' ? 'disabled' : ''}><i class="bi bi-pencil"></i></button>
                <button class="btn btn-danger btn-sm unit-action-btn" data-action="delete" data-unit-id="${unit.id}" title="Deletar Unidade" ${unit.status === 'reserved' ? 'disabled' : ''}><i class="bi bi-trash"></i></button>
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
        showToast(`Unidade ${unitId ? 'atualizada' : 'criada'} com sucesso!`, 'success');
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
        if (!confirm('Tem certeza que deseja deletar esta unidade?')) return;
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/units/${unitId}`, token, { method: 'DELETE' });
            document.getElementById(`unit-row-${unitId}`).remove();
            showToast('Unidade deletada!', 'success');
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'danger');
            setButtonLoading(button, false);
        }
    } else if (action === 'history') {
        openUnitHistoryModal(unitId, token);
    }
}

function prepareUnitFormForEdit(unit) {
    document.getElementById('unitFormTitle').textContent = `Editar Unidade ID: ${unit.id}`;
    document.getElementById('unitFormUnitId').value = unit.id;
    document.getElementById('unitIdentifier').value = unit.identifier_code !== 'N/A' ? unit.identifier_code : '';
    document.getElementById('unitStatus').value = unit.status;
    document.getElementById('cancelEditUnitBtn').style.display = 'block';
}

async function handleEnable2FA(token) {
    const modal = new bootstrap.Modal(document.getElementById('2faSetupModal'));
    const qrContainer = document.getElementById('qrCodeContainer');
    const otpSecretInput = document.getElementById('otpSecret');
    
    qrContainer.innerHTML = '<div class="spinner-border"></div>';
    modal.show();

    try {
        const setupData = await apiFetch(`${API_URL}/2fa/setup`, token);
        otpSecretInput.value = setupData.otp_secret;
        
        const qrCodeUrl = `${API_URL}/2fa/qr-code?provisioning_uri=${encodeURIComponent(setupData.provisioning_uri)}`;
        qrContainer.innerHTML = `<img src="${qrCodeUrl}" alt="QR Code para 2FA" class="img-fluid qr-code-image">`;

    } catch (e) {
        qrContainer.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

async function handleEnable2FASubmit(token) {
    const form = document.getElementById('2faEnableForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('2faEnableMessage');
    
    const otp_secret = document.getElementById('otpSecret').value;
    const otp_code = document.getElementById('otpEnableCode').value;

    setButtonLoading(submitButton, true, 'Ativando...');
    messageDiv.innerHTML = '';
    
    try {
        await apiFetch(`${API_URL}/2fa/enable`, token, {
            method: 'POST',
            body: { otp_secret, otp_code }
        });
        showToast('Autenticação de dois fatores ativada com sucesso!', 'success');
        appState.currentUser.otp_enabled = true;
        loadMyAccountView(appState.currentUser, token);
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function handleDisable2FA(token) {
    const password = prompt("Para desativar a autenticação de dois fatores, por favor, insira sua senha:");
    if (!password) return;

    const otp_code = prompt("Agora, insira um código do seu aplicativo autenticador:");
    if (!otp_code) return;
    
    const button = document.getElementById('disable2faBtn');
    setButtonLoading(button, true);

    try {
        await apiFetch(`${API_URL}/2fa/disable`, token, {
            method: 'POST',
            body: { password, otp_code }
        });
        showToast('Autenticação de dois fatores desativada com sucesso!', 'success');
        appState.currentUser.otp_enabled = false;
        loadMyAccountView(appState.currentUser, token);
    } catch (e) {
        showToast(`Erro ao desativar 2FA: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(button, false);
    }
}

async function handleReturnSubmit(token) {
    const form = document.getElementById('returnForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('returnMessage');
    const reservationId = document.getElementById('returnReservationId').value;

    const payload = {
        status: 'returned',
        return_status: form.querySelector('input[name="returnStatus"]:checked').value,
        return_notes: document.getElementById('returnNotes').value.trim()
    };

    setButtonLoading(submitButton, true, 'Confirmando...');
    messageDiv.innerHTML = '';

    try {
        const updated = await apiFetch(`${API_URL}/admin/reservations/${reservationId}`, token, {
            method: 'PATCH',
            body: payload
        });

        const row = document.getElementById(`reservation-row-${updated.id}`);
        if (row) {
            row.querySelector('.status-cell').innerHTML = renderStatusBadge(updated.status);
            row.querySelector('.action-cell').innerHTML = '---';
        }
        
        showToast('Devolução registrada com sucesso!', 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();

    } catch(e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

async function handleSectorAction(button, token) {
    const { action, sectorId, sectorName } = button.dataset;

    if (action === 'edit') {
        openSectorModal({ id: sectorId, name: sectorName });
    } else if (action === 'delete') {
        if (!confirm(`Tem certeza que deseja deletar o setor "${sectorName}"? Esta ação não pode ser desfeita.`)) return;
        
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/sectors/${sectorId}`, token, { method: 'DELETE' });
            document.getElementById(`sector-row-${sectorId}`).remove();
            showToast('Setor deletado com sucesso!', 'success');
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'danger');
            setButtonLoading(button, false);
        }
    }
}

async function handleSectorFormSubmit(token) {
    const form = document.getElementById('sectorForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('sectorMessage');
    const sectorId = form.sectorId.value;
    const sectorName = form.sectorName.value;

    setButtonLoading(submitButton, true, 'Salvando...');
    messageDiv.innerHTML = '';
    
    try {
        const method = sectorId ? 'PUT' : 'POST';
        const url = sectorId ? `${API_URL}/sectors/${sectorId}` : `${API_URL}/sectors`;
        await apiFetch(url, token, {
            method,
            body: { name: sectorName }
        });
        showToast(`Setor ${sectorId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        loadManageSectorsView(token);
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}