// js/dashboard/admin.js

import { API_URL, apiFetch } from './api.js';
import { renderView, renderStatusBadge, renderRoleBadge, renderLogLevelBadge, showToast, setButtonLoading } from './ui.js';

// --- Funções de Renderização Específicas do Admin ---

function renderAdminReservationActions(reservation) {
    if (reservation.status === 'pending') {
        return `
            <button class="btn btn-success btn-sm me-1 admin-action-btn" data-reservation-id="${reservation.id}" data-action="approved" title="Aprovar"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-danger btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="rejected" title="Rejeitar"><i class="bi bi-x-lg"></i></button>
        `;
    }
    if (reservation.status === 'approved') {
        return `<button class="btn btn-info btn-sm text-white admin-action-btn" data-reservation-id="${reservation.id}" data-action="returned" title="Marcar como Devolvido"><i class="bi bi-box-arrow-down"></i></button>`;
    }
    return '---';
}

function renderUserActions(user, currentUserId) {
    const isCurrentUser = user.id === currentUserId;

    // Definir a hierarquia de papéis
    const roles = ['user', 'requester', 'manager', 'admin'];
    const userRoleIndex = roles.indexOf(user.role);

    let promoteButton = '';
    if (userRoleIndex < roles.length - 1) { // Pode ser promovido se não for admin
        const nextRole = roles[userRoleIndex + 1];
        promoteButton = `
            <button class="btn btn-success btn-sm me-1 user-action-btn" data-user-id="${user.id}" data-action="promote" data-current-role="${user.role}" title="Promover para ${nextRole}" ${isCurrentUser ? 'disabled' : ''}>
                <i class="bi bi-arrow-up-circle"></i>
            </button>`;
    } else {
        promoteButton = `<button class="btn btn-success btn-sm me-1" disabled title="Já está no nível máximo"><i class="bi bi-arrow-up-circle"></i></button>`;
    }


    let demoteButton = '';
    if (userRoleIndex > 0) { // Pode ser rebaixado se não for user
        const prevRole = roles[userRoleIndex - 1];
        demoteButton = `
            <button class="btn btn-warning btn-sm me-1 user-action-btn" data-user-id="${user.id}" data-action="demote" data-current-role="${user.role}" title="Rebaixar para ${prevRole}" ${isCurrentUser ? 'disabled' : ''}>
                <i class="bi bi-arrow-down-circle"></i>
            </button>`;
    } else {
         demoteButton = `<button class="btn btn-warning btn-sm me-1" disabled title="Já está no nível mínimo"><i class="bi bi-arrow-down-circle"></i></button>`;
    }

    const deleteButton = `
        <button class="btn btn-danger btn-sm user-action-btn" data-user-id="${user.id}" data-action="delete" title="Excluir Usuário" ${isCurrentUser ? 'disabled' : ''}>
            <i class="bi bi-trash"></i>
        </button>`;

    return `${promoteButton}${demoteButton}${deleteButton}`;
}


function renderInventoryRow(type) {
    return `
        <tr id="inventory-row-${type.id}">
            <td>${type.id}</td>
            <td>${type.name}</td>
            <td>${type.category}</td>
            <td>
                <button class="btn btn-info btn-sm me-1 text-white inventory-action-btn" data-action="view-units" data-type-id="${type.id}" data-type-name="${type.name}" title="Gerenciar Unidades"><i class="bi bi-hdd-stack"></i></button>
                <button class="btn btn-secondary btn-sm me-1 inventory-action-btn" data-action="edit-type" data-type-id="${type.id}" title="Editar Tipo"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-danger btn-sm inventory-action-btn" data-action="delete-type" data-type-id="${type.id}" title="Excluir Tipo"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `;
}

// --- Funções de Carregamento de Views de Admin ---

export async function loadManageReservationsView(token) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Reservas</h1>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const reservations = await apiFetch(`${API_URL}/admin/reservations`, token);
        const container = document.getElementById('listContainer');
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma reserva no sistema.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>Usuário</th><th>Equipamento</th><th>Status</th><th>Período</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${reservations.map(res => `
                        <tr id="reservation-row-${res.id}">
                            <td data-label="Usuário">${res.user.username}</td>
                            <td data-label="Equipamento">${res.equipment_unit.equipment_type.name} (${res.equipment_unit.identifier_code || 'N/A'})</td>
                            <td class="status-cell" data-label="Status">${renderStatusBadge(res.status)}</td>
                            <td data-label="Período">${new Date(res.start_time).toLocaleString('pt-BR')} - ${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                            <td class="action-cell" data-label="Ações">${renderAdminReservationActions(res)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

export async function loadManageUsersView(token, currentUserId) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Usuários</h1>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const users = await apiFetch(`${API_URL}/admin/users`, token);
        const container = document.getElementById('listContainer');
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Username</th><th>Email</th><th>Permissão</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr id="user-row-${user.id}">
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td class="role-cell">${renderRoleBadge(user.role)}</td>
                            <td class="action-cell">${renderUserActions(user, currentUserId)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

export async function loadManageInventoryView(token) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Inventário</h1>
            <button class="btn btn-primary inventory-action-btn" data-action="create-type"><i class="bi bi-plus-circle me-2"></i>Adicionar Tipo</button>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const types = await apiFetch(`${API_URL}/equipments/types`, token);
        const container = document.getElementById('listContainer');
        if (types.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum tipo de equipamento cadastrado.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Ações</th></tr>
                </thead>
                <tbody id="inventory-table-body">
                    ${types.map(type => renderInventoryRow(type)).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

export async function loadSystemLogsView(token) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Logs do Sistema</h1>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const users = await apiFetch(`${API_URL}/admin/users`, token);
        const userMap = users.reduce((map, user) => {
            map[user.id] = user.username;
            return map;
        }, {});

        const logs = await apiFetch(`${API_URL}/admin/logs`, token);
        const container = document.getElementById('listContainer');
        if (logs.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum log de atividade registrado.</p>';
            return;
        }

        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>Data</th><th>Usuário</th><th>Nível</th><th>Mensagem</th></tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${new Date(log.created_at).toLocaleString('pt-BR')}</td>
                            <td>${log.user_id ? userMap[log.user_id] || `ID ${log.user_id}` : 'Sistema'}</td>
                            <td>${renderLogLevelBadge(log.level)}</td>
                            <td>${log.message}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

// --- Funções de Manipulação de Eventos (Handlers) de Admin ---

export async function handleUpdateReservationStatus(button, token) {
    const { reservationId, action } = button.dataset;
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
    const { userId, action, currentRole } = button.dataset;
    if (action === 'delete' && !confirm(`Tem certeza que deseja excluir o usuário ID ${userId}?`)) return;

    setButtonLoading(button, true);

    const roles = ['user', 'requester', 'manager', 'admin'];
    const currentRoleIndex = roles.indexOf(currentRole);
    let newRole = '';

    if (action === 'promote') {
        if (currentRoleIndex < roles.length - 1) {
            newRole = roles[currentRoleIndex + 1];
        }
    } else if (action === 'demote') {
        if (currentRoleIndex > 0) {
            newRole = roles[currentRoleIndex - 1];
        }
    }

    try {
        if (action === 'promote' || action === 'demote') {
            if (!newRole) {
                showToast('Ação inválida para este nível de usuário.', 'warning');
                setButtonLoading(button, false);
                return;
            }
            const updated = await apiFetch(`${API_URL}/admin/users/${userId}/role`, token, { method: 'PATCH', body: { role: newRole } });
            const row = document.getElementById(`user-row-${updated.id}`);
            if (row) {
                row.querySelector('.role-cell').innerHTML = renderRoleBadge(updated.role);
                row.querySelector('.action-cell').innerHTML = renderUserActions(updated, currentUserId);
            }
            showToast('Permissão alterada!', 'success');
        } else if (action === 'delete') {
            await apiFetch(`${API_URL}/admin/users/${userId}`, token, { method: 'DELETE' });
            document.getElementById(`user-row-${userId}`).remove();
            showToast('Usuário excluído!', 'success');
        }
    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
    } finally {
        // Only set button loading to false if it's not a delete action that was successful
        if (action !== 'delete' || document.getElementById(`user-row-${userId}`)) {
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
        const savedType = await apiFetch(url, token, { method, body: typeData });
        
        const newRowHtml = renderInventoryRow(savedType);
        if (typeId) {
            document.getElementById(`inventory-row-${typeId}`).outerHTML = newRowHtml;
        } else {
            document.getElementById('inventory-table-body').insertAdjacentHTML('beforeend', newRowHtml);
        }
        
        showToast(`Tipo ${typeId ? 'atualizado' : 'criado'}!`, 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}