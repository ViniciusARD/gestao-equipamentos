// js/dashboard/admin/userViews.js

import { API_URL, apiFetch } from '../api.js';
import { renderView, renderLogLevelBadge, renderStatusBadge, renderRoleBadge } from '../ui.js';
import { renderAdminReservationActions, renderUserActions, renderManagerUserActions } from './renderers.js';

export async function openUserHistoryModal(userId, userName, token) {
    const modal = new bootstrap.Modal(document.getElementById('userHistoryModal'));
    const modalTitle = document.getElementById('userHistoryModalLabel');
    const modalBody = document.getElementById('userHistoryBody');

    modalTitle.textContent = `Histórico de Reservas: ${userName}`;
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    modal.show();

    try {
        const history = await apiFetch(`${API_URL}/admin/users/${userId}/history`, token);
        if (history.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nenhuma reserva encontrada para este usuário.</p>';
            return;
        }

        modalBody.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Equipamento</th>
                            <th>Unidade (Código)</th>
                            <th>Status</th>
                            <th>Período da Reserva</th>
                            <th>Data da Solicitação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(res => `
                            <tr>
                                <td>${res.equipment_unit.equipment_type.name}</td>
                                <td>${res.equipment_unit.identifier_code}</td>
                                <td>${renderStatusBadge(res.status)}</td>
                                <td>${new Date(res.start_time).toLocaleString('pt-BR')} até ${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                                <td>${new Date(res.created_at).toLocaleDateString('pt-BR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) {
        modalBody.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}


export async function loadManageReservationsView(token, params = {}) {
    const statusFilters = [
        { key: 'all', text: 'Todas' },
        { key: 'pending', text: 'Pendentes' },
        { key: 'approved', text: 'Aprovadas' },
        { key: 'overdue', text: 'Atrasadas' },
        { key: 'returned', text: 'Devolvidas' },
        { key: 'rejected', text: 'Rejeitadas' }
    ];

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerir Reservas</h1>
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

export async function loadManageUsersView(token, currentUserId, params = {}) {
    const roleFilters = [
        { key: 'all', text: 'Todos' },
        { key: 'user', text: 'Usuários' },
        { key: 'requester', text: 'Solicitantes' },
        { key: 'manager', text: 'Gerentes' },
        { key: 'admin', text: 'Admins' }
    ];

    const sectors = await apiFetch(`${API_URL}/sectors/`, token);

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerir Usuários</h1>
        </div>
        <div class="row mb-3">
            <div class="col-lg-8">
                <div class="input-group">
                    <input type="search" id="usersSearchInput" class="form-control" placeholder="Buscar por nome ou email..." value="${params.search || ''}">
                    <button class="btn btn-outline-secondary" type="button" id="searchUsersBtn"><i class="bi bi-search"></i></button>
                </div>
            </div>
            <div class="col-lg-4">
                <select id="userSectorFilter" class="form-select">
                    <option value="">Todos os setores</option>
                    ${sectors.map(s => `<option value="${s.id}" ${params.sector_id == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-12">
                <div class="btn-group w-100" role="group">
                    ${roleFilters.map(filter => `
                        <button type="button" class="btn ${(params.role || 'all') === filter.key ? 'btn-primary' : 'btn-outline-primary'} user-role-filter-btn" data-role="${filter.key}">${filter.text}</button>
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
        if (params.search) url.searchParams.append('search', params.search);
        if (params.role && params.role !== 'all') url.searchParams.append('role', params.role);
        if (params.sector_id) url.searchParams.append('sector_id', params.sector_id);
        
        const users = await apiFetch(url, token);
        if (users.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum usuário encontrado com os filtros aplicados.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Usuário</th><th>Email</th><th>Setor</th><th>Permissão</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr id="user-row-${user.id}">
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td class="sector-cell">${user.sector ? user.sector.name : '<span class="text-muted">N/A</span>'}</td>
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

export async function loadViewUsersView(token, params = {}) {
    const roleFilters = [
        { key: 'all', text: 'Todos' },
        { key: 'user', text: 'Usuários' },
        { key: 'requester', text: 'Solicitantes' },
        { key: 'manager', text: 'Gerentes' },
        { key: 'admin', text: 'Admins' }
    ];

    const sectors = await apiFetch(`${API_URL}/sectors/`, token);

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Visualizar Usuários</h1>
        </div>
        <div class="row mb-3">
            <div class="col-lg-8">
                <div class="input-group">
                    <input type="search" id="viewUsersSearchInput" class="form-control" placeholder="Buscar por nome ou email..." value="${params.search || ''}">
                    <button class="btn btn-outline-secondary" type="button" id="searchViewUsersBtn"><i class="bi bi-search"></i></button>
                </div>
            </div>
            <div class="col-lg-4">
                <select id="viewUserSectorFilter" class="form-select">
                    <option value="">Todos os setores</option>
                    ${sectors.map(s => `<option value="${s.id}" ${params.sector_id == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-12">
                <div class="btn-group w-100" role="group">
                    ${roleFilters.map(filter => `
                        <button type="button" class="btn ${(params.role || 'all') === filter.key ? 'btn-primary' : 'btn-outline-primary'} view-user-role-filter-btn" data-role="${filter.key}">${filter.text}</button>
                    `).join('')}
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/admin/users/view`);
        if (params.search) url.searchParams.append('search', params.search);
        if (params.role && params.role !== 'all') url.searchParams.append('role', params.role);
        if (params.sector_id) url.searchParams.append('sector_id', params.sector_id);
        
        const users = await apiFetch(url, token);
        if (users.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum usuário encontrado com os filtros aplicados.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Usuário</th><th>Email</th><th>Setor</th><th>Permissão</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr id="user-row-${user.id}">
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td class="sector-cell">${user.sector ? user.sector.name : '<span class="text-muted">N/A</span>'}</td>
                            <td class="role-cell">${renderRoleBadge(user.role)}</td>
                            <td class="status-cell">${user.is_active ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-danger">Inativo</span>'}</td>
                            <td class="action-cell">${renderManagerUserActions(user)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
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
                        <input type="search" id="logsSearchInput" class="form-control" placeholder="Buscar na mensagem de log..." value="${params.search || ''}">
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <select id="logsLevelFilter" class="form-select">
                            <option value="all" ${!params.level || params.level === 'all' ? 'selected' : ''}>Todos os Níveis</option>
                            <option value="INFO" ${params.level === 'INFO' ? 'selected' : ''}>Info</option>
                            <option value="WARNING" ${params.level === 'WARNING' ? 'selected' : ''}>Aviso</option>
                            <option value="ERROR" ${params.level === 'ERROR' ? 'selected' : ''}>Erro</option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <select id="logsUserFilter" class="form-select">
                            <option value="" ${!params.user_id ? 'selected' : ''}>Todos os Usuários</option>
                            ${users.map(u => `<option value="${u.id}" ${params.user_id == u.id ? 'selected' : ''}>${u.username}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label for="logsStartDate" class="form-label small">Data de Início</label>
                        <input type="date" id="logsStartDate" class="form-control" value="${params.start_date || ''}">
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label for="logsEndDate" class="form-label small">Data Final</label>
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

export async function loadManageSectorsView(token, searchTerm = '') {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerir Setores</h1>
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
        const url = new URL(`${API_URL}/sectors`);
        if (searchTerm) {
            url.searchParams.append('search', searchTerm);
        }
        const sectors = await apiFetch(url, token);
        
        if (sectors.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum setor encontrado.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr><th>ID</th><th>Nome</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    ${sectors.map(sector => `
                        <tr id="sector-row-${sector.id}">
                            <td>${sector.id}</td>
                            <td class="sector-name-cell">${sector.name}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm me-1 sector-action-btn" data-action="edit" data-sector-id="${sector.id}" data-sector-name="${sector.name}" title="Editar Setor"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-danger btn-sm sector-action-btn" data-action="delete" data-sector-id="${sector.id}" data-sector-name="${sector.name}" title="Deletar Setor"><i class="bi bi-trash"></i></button>
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