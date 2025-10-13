// js/dashboard/events/forms.js

import { API_URL, apiFetch } from '../api.js';
import { showToast, setButtonLoading, renderStatusBadge, resetUnitForm } from '../ui.js'; // <-- CORREÇÃO AQUI
import { handleEquipmentTypeSubmit, loadManageSectorsView } from '../admin.js';
import { loadMyAccountView, loadMyReservationsView } from '../views.js';
import { populateUnitsTable } from './actions.js'; // <-- CORREÇÃO AQUI
import { applyMyReservationsFilter } from './filters.js';

export { handleEquipmentTypeSubmit }; // Re-exporta a função do admin para manter o ponto de acesso

export async function handleReservationSubmit(appState) {
    const token = appState.token;
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
        applyMyReservationsFilter(appState);
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

export async function handleUpdateProfile(appState) {
    const token = appState.token;
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

export async function handleAdminUpdateSector(appState) {
    const token = appState.token;
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

export async function handleReturnSubmit(appState) {
    const token = appState.token;
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

export async function handleSectorFormSubmit(appState) {
    const token = appState.token;
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

export async function handleUnitFormSubmit(appState) {
    const token = appState.token;
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

export async function handleEnable2FASubmit(appState) {
    const token = appState.token;
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