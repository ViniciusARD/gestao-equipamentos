// js/dashboard/views/reservations.js

import { API_URL, apiFetch } from '../api.js';
import { renderView, renderStatusBadge, renderPaginationControls } from '../ui.js';

export async function loadMyReservationsView(token, params = {}) {
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
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-12">
                        <input type="search" id="myReservationsSearchInput" class="form-control" placeholder="Buscar por nome ou código do equipamento..." value="${params.search || ''}">
                    </div>
                    <div class="col-12">
                        <div class="btn-group w-100" role="group">
                            ${statusFilters.map(filter => `
                                <button type="button" class="btn ${(params.status || 'all') === filter.key ? 'btn-primary' : 'btn-outline-primary'} status-filter-btn" data-status="${filter.key}">${filter.text}</button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="col-md-5">
                        <label for="myReservationsStartDate" class="form-label small">Período de</label>
                        <input type="date" id="myReservationsStartDate" class="form-control" value="${params.start_date || ''}">
                    </div>
                    <div class="col-md-5">
                        <label for="myReservationsEndDate" class="form-label small">Até</label>
                        <input type="date" id="myReservationsEndDate" class="form-control" value="${params.end_date || ''}">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                         <button class="btn btn-primary w-100" id="applyMyReservationsFilterBtn"><i class="bi bi-funnel-fill"></i></button>
                    </div>
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
        <div id="paginationContainer"></div>
    `);
    
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        const url = new URL(`${API_URL}/reservations/my-reservations`);
        url.searchParams.append('page', params.page || 1);
        if (params.search) url.searchParams.append('search', params.search);
        if (params.status && params.status !== 'all') url.searchParams.append('status', params.status);
        if (params.start_date) url.searchParams.append('start_date', new Date(params.start_date).toISOString());
        if (params.end_date) url.searchParams.append('end_date', new Date(params.end_date + 'T23:59:59.999Z').toISOString());
        
        const data = await apiFetch(url, token);
        
        if (data.items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma reserva encontrada com os filtros aplicados.</p>';
            document.getElementById('paginationContainer').innerHTML = '';
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
                        <th>Data Pedido</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(res => `
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
        document.getElementById('paginationContainer').innerHTML = renderPaginationControls(data, 'my-reservations');
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}