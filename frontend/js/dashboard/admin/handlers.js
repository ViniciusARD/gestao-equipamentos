// js/dashboard/admin/handlers.js

import { API_URL, apiFetch } from '../api.js';
import { showToast, setButtonLoading, renderStatusBadge, renderRoleBadge } from '../ui.js';
import { renderAdminReservationActions, renderUserActions } from './renderers.js';
import { loadManageInventoryView } from './views.js';

export async function handleUpdateReservationStatus(button, token) {
    const { reservationId, action, unitIdentifier, userIdentifier } = button.dataset;

    if (action === 'returned') {
        const returnModal = new bootstrap.Modal(document.getElementById('returnModal'));
        document.getElementById('returnReservationId').value = reservationId;
        document.getElementById('returnUnitIdentifier').textContent = unitIdentifier;
        document.getElementById('returnUserIdentifier').textContent = userIdentifier;
        document.getElementById('returnForm').reset();
        document.getElementById('returnMessage').innerHTML = '';
        returnModal.show();
        return;
    }
    
    setButtonLoading(button, true);
    try {
        const updated = await apiFetch(`${API_URL}/admin/reservations/${reservationId}`, token, { method: 'PATCH', body: { status: action } });
        const row = document.getElementById(`reservation-row-${updated.id}`);
        if (row) {
            row.querySelector('.status-cell').innerHTML = renderStatusBadge(updated.status);
            row.querySelector('.action-cell').innerHTML = renderAdminReservationActions(updated);
        }
        showToast('Status da reserva atualizado!', 'success');
    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
        setButtonLoading(button, false);
    }
}

export async function handleUserAction(button, token, currentUserId) {
    const { userId, action, currentRole, isActive } = button.dataset;
    
    if (action === 'delete' && !confirm(`Tem certeza que deseja deletar o usuário ID ${userId}?`)) return;

    if (action === 'change-sector') {
        const modal = new bootstrap.Modal(document.getElementById('userSectorModal'));
        const form = document.getElementById('userSectorForm');
        form.dataset.userId = userId;
        
        const sectorSelect = document.getElementById('userSectorSelect');
        sectorSelect.innerHTML = '<option>Carregando...</option>';
        const sectors = await apiFetch(`${API_URL}/sectors`, token);
        sectorSelect.innerHTML = '<option value="">Nenhum</option>' + sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        modal.show();
        return;
    }
    
    setButtonLoading(button, true);

    const roles = ['user', 'requester', 'manager', 'admin'];
    const currentRoleIndex = roles.indexOf(currentRole);
    let newRole = '';

    if (action === 'promote') {
        if (currentRoleIndex < roles.length - 1) newRole = roles[currentRoleIndex + 1];
    } else if (action === 'demote') {
        if (currentRoleIndex > 0) newRole = roles[currentRoleIndex - 1];
    }

    try {
        let updated;
        if (action === 'promote' || action === 'demote') {
            if (!newRole) {
                showToast('Ação inválida para este nível de usuário.', 'warning');
            } else {
                updated = await apiFetch(`${API_URL}/admin/users/${userId}/role`, token, { method: 'PATCH', body: { role: newRole } });
                showToast('Permissão alterada!', 'success');
            }
        } else if (action === 'toggle-active') {
            const newStatus = isActive !== 'true';
            updated = await apiFetch(`${API_URL}/admin/users/${userId}/status`, token, { method: 'PATCH', body: { is_active: newStatus } });
            showToast(`Usuário ${newStatus ? 'ativado' : 'desativado'}!`, 'success');
        } else if (action === 'delete') {
            await apiFetch(`${API_URL}/admin/users/${userId}`, token, { method: 'DELETE' });
            document.getElementById(`user-row-${userId}`).remove();
            showToast('Usuário deletado!', 'success');
        }

        if (updated) {
            const row = document.getElementById(`user-row-${updated.id}`);
            if (row) {
                row.querySelector('.role-cell').innerHTML = renderRoleBadge(updated.role);
                row.querySelector('.status-cell').innerHTML = updated.is_active ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-danger">Inativo</span>';
                row.querySelector('.action-cell').innerHTML = renderUserActions(updated, currentUserId);
            }
        }
    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
    } finally {
        if (action !== 'delete') {
            setButtonLoading(button, false);
        }
    }
}


export async function handleEquipmentTypeSubmit(token) {
    const form = document.getElementById('equipmentTypeForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('equipmentTypeMessage');
    const typeId = form.equipmentTypeId.value;
    const typeData = {
        name: form.typeName.value,
        category: form.typeCategory.value,
        description: form.typeDescription.value
    };

    setButtonLoading(submitButton, true, 'Salvando...');
    messageDiv.innerHTML = '';
    try {
        const method = typeId ? 'PUT' : 'POST';
        const url = typeId ? `${API_URL}/equipments/types/${typeId}` : `${API_URL}/equipments/types`;
        await apiFetch(url, token, { method, body: typeData });
        
        showToast(`Tipo ${typeId ? 'atualizado' : 'criado'}!`, 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        
        loadManageInventoryView(token);

    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}