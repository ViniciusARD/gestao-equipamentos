// js/dashboard/admin.js

import { API_URL, apiFetch } from './api.js';
import { renderView, renderStatusBadge, renderRoleBadge, renderLogLevelBadge, showToast, setButtonLoading, openSectorModal } from './ui.js';
import { loadAnalyticsDashboardView } from './analytics.js';

// ... (funções renderAdminReservationActions, renderInventoryRow existentes)

function renderAdminReservationActions(reservation) {
    if (reservation.status === 'pending') {
        return `
            <button class="btn btn-success btn-sm me-1 admin-action-btn" data-reservation-id="${reservation.id}" data-action="approved" title="Aprovar"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-danger btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="rejected" title="Rejeitar"><i class="bi bi-x-lg"></i></button>
        `;
    }
    if (reservation.status === 'approved') {
        return `<button class="btn btn-info btn-sm text-white admin-action-btn" data-reservation-id="${reservation.id}" data-action="returned" data-unit-identifier="${reservation.equipment_unit.identifier_code || `ID ${reservation.equipment_unit.id}`}" title="Marcar como Devolvido"><i class="bi bi-box-arrow-down"></i></button>`;
    }
    return '---';
}

// <<< --- FUNÇÃO ATUALIZADA --- >>>
function renderUserActions(user, currentUserId) {
    const isCurrentUser = user.id === currentUserId;
    const roles = ['user', 'requester', 'manager', 'admin'];
    const userRoleIndex = roles.indexOf(user.role);

    const sectorButton = `
        <button class="btn btn-info btn-sm text-white user-action-btn" data-user-id="${user.id}" data-action="change-sector" title="Alterar Setor">
            <i class="bi bi-tag"></i>
        </button>`;

    let promoteButton;
    if (userRoleIndex < roles.length - 1) {
        const nextRole = roles[userRoleIndex + 1];
        promoteButton = `
            <button class="btn btn-success btn-sm user-action-btn" data-user-id="${user.id}" data-action="promote" data-current-role="${user.role}" title="Promover para ${nextRole}" ${isCurrentUser ? 'disabled' : ''}>
                <i class="bi bi-arrow-up-circle"></i>
            </button>`;
    } else {
        promoteButton = `
            <button class="btn btn-success btn-sm" disabled title="Já está no nível máximo">
                <i class="bi bi-arrow-up-circle"></i>
            </button>`;
    }

    let demoteButton;
    if (userRoleIndex > 0) {
        const prevRole = roles[userRoleIndex - 1];
        demoteButton = `
            <button class="btn btn-warning btn-sm user-action-btn" data-user-id="${user.id}" data-action="demote" data-current-role="${user.role}" title="Rebaixar para ${prevRole}" ${isCurrentUser ? 'disabled' : ''}>
                <i class="bi bi-arrow-down-circle"></i>
            </button>`;
    } else {
        demoteButton = `
            <button class="btn btn-warning btn-sm" disabled title="Já está no nível mínimo">
                <i class="bi bi-arrow-down-circle"></i>
            </button>`;
    }

    // Botão de Ativar/Inativar
    const toggleActiveButton = user.is_active
        ? `<button class="btn btn-secondary btn-sm user-action-btn" data-user-id="${user.id}" data-action="toggle-active" data-is-active="true" title="Inativar Usuário" ${isCurrentUser ? 'disabled' : ''}><i class="bi bi-pause-circle"></i></button>`
        : `<button class="btn btn-success btn-sm user-action-btn" data-user-id="${user.id}" data-action="toggle-active" data-is-active="false" title="Ativar Usuário"><i class="bi bi-play-circle"></i></button>`;


    const deleteButton = `
        <button class="btn btn-danger btn-sm user-action-btn" data-user-id="${user.id}" data-action="delete" title="Excluir Usuário" ${isCurrentUser ? 'disabled' : ''}>
            <i class="bi bi-trash"></i>
        </button>`;

    return `<div class="d-flex gap-1">${sectorButton}${promoteButton}${demoteButton}${toggleActiveButton}${deleteButton}</div>`;
}

function renderInventoryRow(type) {
    return `
        <tr id="inventory-row-${type.id}">
            <td>${type.name}</td>
            <td>${type.category}</td>
            <td class="text-center">${type.total_units}</td>
            <td class="text-center">${type.available_units}</td>
            <td>
                <button class="btn btn-info btn-sm me-1 text-white inventory-action-btn" data-action="view-units" data-type-id="${type.id}" data-type-name="${type.name}" title="Gerenciar Unidades"><i class="bi bi-hdd-stack"></i></button>
                <button class="btn btn-secondary btn-sm me-1 inventory-action-btn" data-action="edit-type" data-type-id="${type.id}" title="Editar Tipo"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-danger btn-sm inventory-action-btn" data-action="delete-type" data-type-id="${type.id}" title="Excluir Tipo"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `;
}

// ... (demais funções de `load...` existentes)

export async function loadManageReservationsView(token, params = {}) {
    const statusFilters = [
        { key: 'all', text: 'Todas' },
        { key: 'pending', text: 'Pendentes' },
        { key: 'approved', text: 'Aprovadas' },
        { key: 'returned', text: 'Devolvidas' },
        { key: 'rejected', text: 'Rejeitadas' }
    ];

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Reservas</h1>
        </div>
        <div class="card mb-4">
            <div class="card-body">
                 <div class="row g-3">
                    <div class="col-12">
                        <input type="search" id="reservationsSearchInput" class="form-control" placeholder="Buscar por usuário, equipamento, email..." value="${params.search || ''}">
                    </div>
                    <div class="col-12">
                         <div class="btn-group w-100" role="group">
                            ${statusFilters.map(filter => `
                                <button type="button" class="btn ${(params.status || 'all') === filter.key ? 'btn-primary' : 'btn-outline-primary'} admin-status-filter-btn" data-status="${filter.key}">${filter.text}</button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="col-md-5">
                        <label for="reservationsStartDate" class="form-label small">Período de</label>
                        <input type="date" id="reservationsStartDate" class="form-control" value="${params.start_date || ''}">
                    </div>
                    <div class="col-md-5">
                        <label for="reservationsEndDate" class="form-label small">Até</label>
                        <input type="date" id="reservationsEndDate" class="form-control" value="${params.end_date || ''}">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-primary w-100" id="applyReservationsFilterBtn"><i class="bi bi-funnel-fill"></i></button>
                    </div>
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/admin/reservations`);
        if (params.search) url.searchParams.append('search', params.search);
        if (params.status && params.status !== 'all') url.searchParams.append('status', params.status);
        if (params.start_date) url.searchParams.append('start_date', new Date(params.start_date).toISOString());
        if (params.end_date) url.searchParams.append('end_date', new Date(params.end_date + 'T23:59:59.999Z').toISOString());
        
        const reservations = await apiFetch(url, token);
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma reserva encontrada com os filtros aplicados.</p>';
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
                            <td data-label="Usuário">${res.user.username} <small class="text-muted d-block">${res.user.email}</small></td>
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
        container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

// <<< --- FUNÇÃO ATUALIZADA --- >>>
export async function loadManageUsersView(token, currentUserId, searchTerm = '', roleFilter = 'all') {
    const roleFilters = [
        { key: 'all', text: 'Todos' },
        { key: 'user', text: 'Usuários' },
        { key: 'requester', text: 'Solicitantes' },
        { key: 'manager', text: 'Gerentes' },
        { key: 'admin', text: 'Admins' }
    ];

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Usuários</h1>
        </div>
        <div class="row mb-4">
            <div class="col-lg-7 mb-2 mb-lg-0">
                <div class="input-group">
                    <input type="search" id="usersSearchInput" class="form-control" placeholder="Buscar por nome ou email..." value="${searchTerm}">
                    <button class="btn btn-outline-secondary" type="button" id="searchUsersBtn"><i class="bi bi-search"></i></button>
                </div>
            </div>
            <div class="col-lg-5">
                <div class="btn-group w-100" role="group">
                    ${roleFilters.map(filter => `
                        <button type="button" class="btn ${roleFilter === filter.key ? 'btn-primary' : 'btn-outline-primary'} user-role-filter-btn" data-role="${filter.key}">${filter.text}</button>
                    `).join('')}
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/admin/users`);
        if (searchTerm) {
            url.searchParams.append('search', searchTerm);
        }
        if (roleFilter && roleFilter !== 'all') {
            url.searchParams.append('role', roleFilter);
        }
        const users = await apiFetch(url, token);
        if (users.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum usuário encontrado com os filtros aplicados.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Username</th><th>Email</th><th>Setor</th><th>Permissão</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr id="user-row-${user.id}">
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td class="sector-cell">${user.setor ? user.setor.name : '<span class="text-muted">N/A</span>'}</td>
                            <td class="role-cell">${renderRoleBadge(user.role)}</td>
                            <td class="status-cell">${user.is_active ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-danger">Inativo</span>'}</td>
                            <td class="action-cell">${renderUserActions(user, currentUserId)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}


export async function loadManageInventoryView(token, searchTerm = '', categoryFilter = 'all', availabilityFilter = 'all') {
    const allTypesForCategories = await apiFetch(`${API_URL}/equipments/types`, token);
    const categories = [...new Set(allTypesForCategories.map(type => type.category))].sort();

    const availabilityFilters = [
        { key: 'all', text: 'Todos' },
        { key: 'available', text: 'Disponíveis' },
        { key: 'unavailable', text: 'Indisponíveis' }
    ];

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Inventário</h1>
            <button class="btn btn-primary inventory-action-btn" data-action="create-type"><i class="bi bi-plus-circle me-2"></i>Adicionar Tipo</button>
        </div>
        <div class="row mb-4">
            <div class="col-lg-6 mb-2 mb-lg-0">
                <div class="input-group">
                    <input type="search" id="inventorySearchInput" class="form-control" placeholder="Buscar por nome, categoria..." value="${searchTerm}">
                    <button class="btn btn-outline-secondary" type="button" id="searchInventoryBtn"><i class="bi bi-search"></i></button>
                </div>
            </div>
            <div class="col-lg-3 mb-2 mb-lg-0">
                <select id="inventoryCategoryFilter" class="form-select">
                    <option value="all">Todas as categorias</option>
                    ${categories.map(cat => `<option value="${cat}" ${categoryFilter === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>
            <div class="col-lg-3">
                <div class="btn-group w-100" role="group">
                    ${availabilityFilters.map(filter => `
                        <button type="button" class="btn ${availabilityFilter === filter.key ? 'btn-primary' : 'btn-outline-primary'} inventory-availability-filter-btn" data-availability="${filter.key}">${filter.text}</button>
                    `).join('')}
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/equipments/types`);
        if (searchTerm) {
            url.searchParams.append('search', searchTerm);
        }
        if (categoryFilter && categoryFilter !== 'all') {
            url.searchParams.append('category', categoryFilter);
        }
        if (availabilityFilter && availabilityFilter !== 'all') {
            url.searchParams.append('availability', availabilityFilter);
        }

        const types = await apiFetch(url.toString(), token);

        if (types.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum tipo de equipamento encontrado com os filtros aplicados.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th class="text-center">Total Unidades</th>
                        <th class="text-center">Disponíveis</th>
                        <th>Ações</th>
                    </tr>
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


export async function loadSystemLogsView(token, params = {}) {
    const users = await apiFetch(`${API_URL}/admin/users`, token, { limit: 1000 });
    const userMap = users.reduce((map, user) => {
        map[user.id] = user.username;
        return map;
    }, {});

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Logs do Sistema</h1>
        </div>
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-lg-6">
                        <input type="search" id="logsSearchInput" class="form-control" placeholder="Buscar na mensagem do log..." value="${params.search || ''}">
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <select id="logsLevelFilter" class="form-select">
                            <option value="all" ${!params.level || params.level === 'all' ? 'selected' : ''}>Todos os Níveis</option>
                            <option value="INFO" ${params.level === 'INFO' ? 'selected' : ''}>Info</option>
                            <option value="WARNING" ${params.level === 'WARNING' ? 'selected' : ''}>Warning</option>
                            <option value="ERROR" ${params.level === 'ERROR' ? 'selected' : ''}>Error</option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <select id="logsUserFilter" class="form-select">
                            <option value="" ${!params.user_id ? 'selected' : ''}>Todos os Usuários</option>
                            ${users.map(u => `<option value="${u.id}" ${params.user_id == u.id ? 'selected' : ''}>${u.username}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label for="logsStartDate" class="form-label small">Data Início</label>
                        <input type="date" id="logsStartDate" class="form-control" value="${params.start_date || ''}">
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label for="logsEndDate" class="form-label small">Data Fim</label>
                        <input type="date" id="logsEndDate" class="form-control" value="${params.end_date || ''}">
                    </div>
                    <div class="col-lg-6 d-flex align-items-end">
                        <button class="btn btn-primary w-100" id="applyLogsFilterBtn"><i class="bi bi-funnel-fill me-2"></i>Aplicar Filtros</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);

    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/admin/logs`);
        if (params.search) url.searchParams.append('search', params.search);
        if (params.level && params.level !== 'all') url.searchParams.append('level', params.level);
        if (params.user_id) url.searchParams.append('user_id', params.user_id);
        if (params.start_date) url.searchParams.append('start_date', new Date(params.start_date).toISOString());
        if (params.end_date) url.searchParams.append('end_date', new Date(params.end_date + 'T23:59:59.999Z').toISOString());

        const logs = await apiFetch(url, token);
        
        if (logs.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum log encontrado com os filtros aplicados.</p>';
            return;
        }

        container.innerHTML = `
            <table class="table table-striped table-hover table-sm">
                <thead class="table-dark">
                    <tr><th>Data</th><th>Usuário</th><th>Nível</th><th>Mensagem</th></tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td class="text-nowrap">${new Date(log.created_at).toLocaleString('pt-BR')}</td>
                            <td>${log.user_id ? userMap[log.user_id] || `ID ${log.user_id}` : 'Sistema'}</td>
                            <td>${renderLogLevelBadge(log.level)}</td>
                            <td style="word-break: break-all;">${log.message}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}


// ATUALIZADA: Agora aceita um `searchTerm`
export async function loadManageSectorsView(token, searchTerm = '') {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Setores</h1>
            <button class="btn btn-primary" id="add-sector-btn"><i class="bi bi-plus-circle me-2"></i>Adicionar Setor</button>
        </div>
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="input-group">
                    <input type="search" id="sectorsSearchInput" class="form-control" placeholder="Buscar por nome do setor..." value="${searchTerm}">
                    <button class="btn btn-outline-secondary" type="button" id="searchSectorsBtn"><i class="bi bi-search"></i></button>
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);

    const container = document.getElementById('listContainer');
    try {
        const url = new URL(`${API_URL}/setores`);
        if (searchTerm) {
            url.searchParams.append('search', searchTerm);
        }
        const setores = await apiFetch(url, token);
        
        if (setores.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum setor encontrado.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Nome</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${setores.map(setor => `
                        <tr id="sector-row-${setor.id}">
                            <td>${setor.id}</td>
                            <td class="sector-name-cell">${setor.name}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm me-1 sector-action-btn" data-action="edit" data-sector-id="${setor.id}" data-sector-name="${setor.name}" title="Editar Setor"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-danger btn-sm sector-action-btn" data-action="delete" data-sector-id="${setor.id}" data-sector-name="${setor.name}" title="Excluir Setor"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

// ... (demais funções handle... existentes)
export async function handleUpdateReservationStatus(button, token) {
    const { reservationId, action, unitIdentifier } = button.dataset;

    if (action === 'returned') {
        const returnModal = new bootstrap.Modal(document.getElementById('returnModal'));
        document.getElementById('returnReservationId').value = reservationId;
        document.getElementById('returnUnitIdentifier').textContent = unitIdentifier;
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

// <<< --- FUNÇÃO ATUALIZADA --- >>>
export async function handleUserAction(button, token, currentUserId) {
    const { userId, action, currentRole, isActive } = button.dataset;
    
    if (action === 'delete' && !confirm(`Tem certeza que deseja excluir o usuário ID ${userId}?`)) return;

    if (action === 'change-sector') {
        const modal = new bootstrap.Modal(document.getElementById('userSectorModal'));
        const form = document.getElementById('userSectorForm');
        form.dataset.userId = userId;
        
        const setorSelect = document.getElementById('userSectorSelect');
        setorSelect.innerHTML = '<option>Carregando...</option>';
        const setores = await apiFetch(`${API_URL}/setores`, token);
        setorSelect.innerHTML = '<option value="">Nenhum</option>' + setores.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

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
            showToast(`Usuário ${newStatus ? 'ativado' : 'inativado'}!`, 'success');
        } else if (action === 'delete') {
            await apiFetch(`${API_URL}/admin/users/${userId}`, token, { method: 'DELETE' });
            document.getElementById(`user-row-${userId}`).remove();
            showToast('Usuário excluído!', 'success');
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
        const savedType = await apiFetch(url, token, { method, body: typeData });
        
        showToast(`Tipo ${typeId ? 'atualizado' : 'criado'}!`, 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        
        loadManageInventoryView(token);

    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

export { loadAnalyticsDashboardView };