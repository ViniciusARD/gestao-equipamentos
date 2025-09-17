// js/dashboard/views.js

import { API_URL, apiFetch } from './api.js';
import { renderView, renderStatusBadge, showToast } from './ui.js';

/**
 * Carrega a nova view principal do dashboard.
 * @param {string} token - O token de autorização.
 */
export async function loadDashboardHomeView(token) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Início</h1>
        </div>
        <div id="dashboardContainer" class="row">
            <div class="col-lg-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-calendar-event me-2"></i> Suas Próximas Reservas
                    </div>
                    <div class="card-body" id="upcomingReservationsContainer">
                        <div class="text-center"><div class="spinner-border"></div></div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-star-fill me-2"></i> Equipamentos Mais Populares
                    </div>
                    <div class="card-body" id="popularEquipmentContainer">
                        <div class="text-center"><div class="spinner-border"></div></div>
                    </div>
                </div>
            </div>
        </div>
    `);

    // Carrega os dados para os cards
    loadUpcomingReservations(token);
    loadPopularEquipment(token);
}


async function loadUpcomingReservations(token) {
    const container = document.getElementById('upcomingReservationsContainer');
    try {
        const reservations = await apiFetch(`${API_URL}/reservations/upcoming`, token);
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted">Você não possui reservas futuras.</p>';
            return;
        }
        container.innerHTML = `
            <ul class="list-group list-group-flush">
                ${reservations.map(res => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${res.equipment_unit.equipment_type.name}</strong>
                            <small class="d-block text-muted">
                                ${new Date(res.start_time).toLocaleString('pt-BR')} até ${new Date(res.end_time).toLocaleString('pt-BR')}
                            </small>
                        </div>
                        ${renderStatusBadge(res.status)}
                    </li>
                `).join('')}
            </ul>
        `;
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

async function loadPopularEquipment(token) {
    const container = document.getElementById('popularEquipmentContainer');
    try {
        const popular = await apiFetch(`${API_URL}/equipments/stats/popular`, token);
        if (popular.length === 0) {
            container.innerHTML = '<p class="text-muted">Ainda não há dados de popularidade.</p>';
            return;
        }
        container.innerHTML = `
            <ul class="list-group list-group-flush">
                ${popular.map(type => `
                    <li class="list-group-item">
                        <strong>${type.name}</strong>
                        <small class="d-block text-muted">${type.category}</small>
                    </li>
                `).join('')}
            </ul>
        `;
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}


/**
 * Carrega a view de listagem de equipamentos.
 * @param {string} token - O token de autorização.
 */
export async function loadEquipmentsView(token, searchTerm = '', categoryFilter = 'all') {
    // Obter todas as categorias para o filtro, mas sem aplicar os filtros atuais
    const allTypesForCategories = await apiFetch(`${API_URL}/equipments/types`, token);
    const categories = [...new Set(allTypesForCategories.map(type => type.category))].sort();


    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Equipamentos Disponíveis</h1>
        </div>
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="input-group">
                    <input type="search" id="equipmentsSearchInput" class="form-control" placeholder="Buscar por nome, categoria ou descrição..." value="${searchTerm}">
                    <button class="btn btn-outline-secondary" type="button" id="searchEquipmentsBtn"><i class="bi bi-search"></i></button>
                </div>
            </div>
            <div class="col-md-4">
                <select id="equipmentsCategoryFilter" class="form-select">
                    <option value="all">Todas as categorias</option>
                    ${categories.map(cat => `<option value="${cat}" ${categoryFilter === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>
        </div>
        <div id="listContainer" class="row"></div>
    `);
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/equipments/types`);
        if (searchTerm) {
            url.searchParams.append('search', searchTerm);
        }
        if (categoryFilter && categoryFilter !== 'all') {
            url.searchParams.append('category', categoryFilter);
        }
        const types = await apiFetch(url, token);

        if (types.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum equipamento encontrado com os filtros aplicados.</p>';
            return;
        }
        container.innerHTML = types.map(type => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${type.name}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${type.category}</h6>
                        <p class="card-text flex-grow-1">${type.description || 'Sem descrição.'}</p>
                        <div class="mt-auto pt-3">
                            <span class="badge bg-light text-dark p-2">
                                ${type.available_units} de ${type.total_units} disponíveis
                            </span>
                            <button class="btn btn-outline-primary float-end view-units-btn" data-type-id="${type.id}">Ver Unidades</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}


/**
 * Carrega a view com as reservas do usuário logado.
 * @param {string} token - O token de autorização.
 * @param {string} searchTerm - O termo de busca opcional.
 * @param {string} statusFilter - O filtro de status opcional.
 */
export async function loadMyReservationsView(token, searchTerm = '', statusFilter = 'all') {
    const statusFilters = [
        { key: 'all', text: 'Todas' },
        { key: 'pending', text: 'Pendentes' },
        { key: 'approved', text: 'Aprovadas' },
        { key: 'returned', text: 'Devolvidas' },
        { key: 'rejected', text: 'Rejeitadas' }
    ];

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Minhas Reservas</h1>
        </div>
        <div class="row mb-4">
            <div class="col-lg-7 mb-2 mb-lg-0">
                <div class="input-group">
                    <input type="search" id="myReservationsSearchInput" class="form-control" placeholder="Buscar por nome ou código do equipamento..." value="${searchTerm}">
                    <button class="btn btn-outline-secondary" type="button" id="searchMyReservationsBtn"><i class="bi bi-search"></i></button>
                </div>
            </div>
            <div class="col-lg-5">
                <div class="btn-group w-100" role="group">
                    ${statusFilters.map(filter => `
                        <button type="button" class="btn ${statusFilter === filter.key ? 'btn-primary' : 'btn-outline-primary'} status-filter-btn" data-status="${filter.key}">${filter.text}</button>
                    `).join('')}
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/reservations/my-reservations`);
        if (searchTerm) {
            url.searchParams.append('search', searchTerm);
        }
        if (statusFilter && statusFilter !== 'all') {
            url.searchParams.append('status', statusFilter);
        }
        
        const reservations = await apiFetch(url, token);
        
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma reserva encontrada com os filtros aplicados.</p>';
            return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Equipamento</th>
                        <th>Código</th>
                        <th>Status</th>
                        <th>Início</th>
                        <th>Fim</th>
                        <th>Data Solicitação</th>
                    </tr>
                </thead>
                <tbody>
                    ${reservations.map(res => `
                        <tr>
                            <td>${res.equipment_unit.equipment_type.name}</td>
                            <td>${res.equipment_unit.identifier_code || 'N/A'}</td>
                            <td>${renderStatusBadge(res.status)}</td>
                            <td>${new Date(res.start_time).toLocaleString('pt-BR')}</td>
                            <td>${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                            <td>${new Date(res.created_at).toLocaleDateString('pt-BR')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}


/**
 * Carrega a view de gerenciamento da conta do usuário.
 * @param {object} currentUser - O objeto do usuário logado.
 */
export function loadMyAccountView(currentUser) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Minha Conta</h1>
        </div>
        <div id="accountContainer">
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Atualizar Perfil</h5>
                            <form id="updateProfileForm">
                                <div class="mb-3">
                                    <label for="profileUsername" class="form-label">Nome de Usuário</label>
                                    <input type="text" class="form-control" id="profileUsername" value="${currentUser.username}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="profileEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="profileEmail" value="${currentUser.email}" disabled>
                                    <div class="form-text">O email não pode ser alterado.</div>
                                </div>
                                <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Integração com Google Agenda</h5>
                            <p class="card-text">Conecte sua conta do Google para que suas reservas aprovadas sejam automaticamente adicionadas à sua agenda.</p>
                            <button class="btn btn-outline-primary" id="connectGoogleBtn"><i class="bi bi-google me-2"></i>Conectar com Google</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <div class="card border-danger">
                    <div class="card-body">
                        <h5 class="card-title text-danger">Zona de Perigo</h5>
                        <p class="card-text">A exclusão da sua conta é uma ação irreversível. Todos os seus dados, incluindo o histórico de reservas, serão permanentemente removidos.</p>
                        <button class="btn btn-danger" id="deleteAccountBtn">Excluir Minha Conta</button>
                    </div>
                </div>
            </div>
        </div>
    `);
}


/**
 * Busca e exibe as unidades de um tipo de equipamento em um modal.
 * @param {string} typeId - O ID do tipo de equipamento.
 * @param {string} token - O token de autorização.
 */
export async function fetchAndShowUnits(typeId, token) {
    const modal = new bootstrap.Modal(document.getElementById('unitsModal'));
    const modalTitle = document.getElementById('unitsModalLabel');
    const modalBody = document.getElementById('modalUnitList');
    modalTitle.textContent = 'Carregando...';
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    modal.show();

    try {
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        modalTitle.textContent = `Unidades de ${type.name}`;
        if (type.units.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nenhuma unidade cadastrada.</p>';
            return;
        }
        modalBody.innerHTML = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Status</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${type.units.map(unit => {
                        const isAvailable = unit.status === 'available';
                        return `
                            <tr>
                                <td>${unit.identifier_code || 'N/A'}</td>
                                <td>${renderStatusBadge(unit.status)}</td>
                                <td>
                                    ${isAvailable ?
                                        `<button class="btn btn-primary btn-sm reserve-btn" data-unit-id="${unit.id}" data-unit-identifier="${unit.identifier_code || `ID ${unit.id}`}">Reservar</button>` :
                                        `<button class="btn btn-secondary btn-sm" disabled>Indisponível</button>`
                                    }
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        modalBody.innerHTML = `<p class="text-danger">${e.message}</p>`;
    }
}