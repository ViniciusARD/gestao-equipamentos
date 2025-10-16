// js/dashboard/admin/views.js

import { API_URL, apiFetch } from '../api.js';
import { renderView, renderLogLevelBadge, renderStatusBadge, renderRoleBadge } from '../ui.js';
import { renderAdminReservationActions, renderUserActions, renderInventoryRow } from './renderers.js';

// <<-- FUNÇÃO ATUALIZADA -->>
export function populateUnitsTable(units, token, statusFilter = 'all') {
    const tableBody = document.getElementById('unitsTableBody');
    if (!tableBody) return;

    const filteredUnits = units.filter(unit => {
        if (statusFilter === 'all') return true;
        // Agrupa 'reserved' e 'pending' sob o mesmo filtro 'reserved'
        if (statusFilter === 'reserved') return unit.status === 'reserved' || unit.status === 'pending';
        return unit.status === statusFilter;
    });

    if (filteredUnits.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhuma unidade encontrada com este status.</td></tr>';
        return;
    }

    const statusRowClass = {
        available: 'table-success',
        maintenance: 'table-warning',
        reserved: 'table-info',
        pending: 'table-light'
    };

    tableBody.innerHTML = filteredUnits.map(unit => {
        let infoCell = '---';
        if (unit.active_reservation) {
            infoCell = `Reservado por <strong>${unit.active_reservation.user.username}</strong> até ${new Date(unit.active_reservation.end_time).toLocaleDateString('pt-BR')}`;
        }

        return `
        <tr id="unit-row-${unit.id}" class="${statusRowClass[unit.status] || ''}">
            <td>${unit.id}</td>
            <td>${unit.identifier_code}</td>
            <td>${unit.serial_number}</td>
            <td>${renderStatusBadge(unit.status)}</td>
            <td><small>${infoCell}</small></td>
            <td>
                <button class="btn btn-dark btn-sm me-1 unit-action-btn" data-action="history" data-unit-id="${unit.id}" title="Ver Histórico"><i class="bi bi-clock-history"></i></button>
                <button class="btn btn-secondary btn-sm me-1 unit-action-btn" data-action="edit" data-unit-id="${unit.id}" title="Editar Unidade" ${unit.status === 'reserved' || unit.status === 'pending' ? 'disabled' : ''}><i class="bi bi-pencil"></i></button>
                <button class="btn btn-danger btn-sm unit-action-btn" data-action="delete" data-unit-id="${unit.id}" title="Deletar Unidade" ${unit.status === 'reserved' || unit.status === 'pending' ? 'disabled' : ''}><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('');
}

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

export async function loadManageInventoryView(token, searchTerm = '', categoryFilter = 'all', availabilityFilter = 'all') {
    const allTypesForCategories = await apiFetch(`${API_URL}/equipments/types`, token);
    const categories = [...new Set(allTypesForCategories.map(type => type.category))].sort();

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerir Inventário</h1>
            <button class="btn btn-primary inventory-action-btn" data-action="create-type"><i class="bi bi-plus-circle me-2"></i>Adicionar Tipo</button>
        </div>
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-lg-6">
                        <input type="search" id="inventorySearchInput" class="form-control" placeholder="Buscar por nome, categoria..." value="${searchTerm}">
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <select id="inventoryCategoryFilter" class="form-select">
                            <option value="all">Todas as categorias</option>
                            ${categories.map(cat => `<option value="${cat}" ${categoryFilter === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6 d-flex align-items-end">
                        <button class="btn btn-primary w-100" id="searchInventoryBtn"><i class="bi bi-funnel-fill"></i> Filtrar</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="listContainer" class="row"></div>
    `);
    
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/equipments/types`);
        if (searchTerm) url.searchParams.append('search', searchTerm);
        if (categoryFilter && categoryFilter !== 'all') url.searchParams.append('category', categoryFilter);
        if (availabilityFilter && availabilityFilter !== 'all') url.searchParams.append('availability', availabilityFilter);

        const types = await apiFetch(url.toString(), token);

        if (types.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-muted text-center">Nenhum tipo de equipamento encontrado com os filtros aplicados.</p></div>';
            return;
        }
        container.innerHTML = types.map(type => renderInventoryRow(type)).join('');
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}


// <<-- FUNÇÃO ATUALIZADA -->>
export async function loadManageUnitsView(token, typeId) {
    renderView(`
        <div id="units-view-container">
            <div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>
        </div>
    `);

    try {
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        const container = document.getElementById('units-view-container');
        
        // Define os filtros de status
        const statusFilters = [
            { key: 'all', text: 'Todos' },
            { key: 'available', text: 'Disponíveis' },
            { key: 'reserved', text: 'Reservados' }, // Inclui 'pending' e 'reserved'
            { key: 'maintenance', text: 'Manutenção' }
        ];
        
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
                <div>
                    <h1 class="h2 mb-0">Gerir Unidades</h1>
                    <p class="text-muted">Equipamento: <strong>${type.name}</strong></p>
                </div>
                <button class="btn btn-outline-secondary" id="back-to-inventory-btn"><i class="bi bi-arrow-left"></i> Voltar ao Inventário</button>
            </div>

            <div class="row">
                <div class="col-lg-4 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 id="unitFormTitle" class="mb-0">Adicionar Nova Unidade</h5>
                        </div>
                        <div class="card-body">
                            <form id="unitForm">
                                <input type="hidden" id="unitFormTypeId" value="${type.id}">
                                <input type="hidden" id="unitFormUnitId">
                                <div class="mb-3">
                                    <label for="unitIdentifier" class="form-label">Código de Identificação</label>
                                    <input type="text" class="form-control" id="unitIdentifier" placeholder="Ex: NTBK-DELL-01" required>
                                </div>
                                <div class="mb-3">
                                    <label for="serialNumber" class="form-label">Número de Série</label>
                                    <input type="text" class="form-control" id="serialNumber" placeholder="Ex: ABC123456XYZ" required>
                                </div>
                                <input type="hidden" id="unitQuantity" value="1">
                                <div class="mb-3">
                                    <label for="unitStatus" class="form-label">Status</label>
                                    <select class="form-select" id="unitStatus" required>
                                        <option value="available">Disponível</option>
                                        <option value="maintenance">Em Manutenção</option>
                                    </select>
                                </div>
                                <div id="unitFormMessage" class="mt-3"></div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">Salvar Unidade</button>
                                    <button type="button" class="btn btn-outline-secondary d-none" id="cancelEditUnitBtn">Cancelar Edição</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-lg-8">
                     <div class="mb-3">
                        <div class="btn-group w-100" role="group" id="unit-status-filter-group">
                            ${statusFilters.map(filter => `
                                <button type="button" class="btn ${filter.key === 'all' ? 'btn-primary' : 'btn-outline-primary'} unit-status-filter-btn" data-status="${filter.key}">${filter.text}</button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Código</th>
                                    <th>Nº de Série</th>
                                    <th>Status</th>
                                    <th>Info</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="unitsTableBody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Armazena as unidades originais para não precisar buscar da API a cada filtro
        container.dataset.units = JSON.stringify(type.units);
        
        populateUnitsTable(type.units, token, 'all');

    } catch(e) {
        document.getElementById('units-view-container').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
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