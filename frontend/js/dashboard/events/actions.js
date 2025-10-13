// js/dashboard/events/actions.js

import { API_URL, apiFetch } from '../api.js';
import { showToast, setButtonLoading, openEquipmentTypeModal, openManageUnitsModal, openUnitHistoryModal, openSectorModal, renderStatusBadge } from '../ui.js';
import { loadMyAccountView } from '../views.js';

export async function handleInventoryAction(button, token) {
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

export function populateUnitsTable(units) {
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

export async function handleUnitAction(button, token) {
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

export function prepareUnitFormForEdit(unit) {
    document.getElementById('unitFormTitle').textContent = `Editar Unidade ID: ${unit.id}`;
    document.getElementById('unitFormUnitId').value = unit.id;
    document.getElementById('unitIdentifier').value = unit.identifier_code !== 'N/A' ? unit.identifier_code : '';
    document.getElementById('unitStatus').value = unit.status;
    document.getElementById('cancelEditUnitBtn').style.display = 'block';
}

export async function handleGoogleConnect(button, token) {
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

export async function handleDeleteAccount(button, token, appState) {
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

export async function handleEnable2FA(token) {
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

export async function handleDisable2FA(token, appState) {
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

export async function handleSectorAction(button, token) {
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