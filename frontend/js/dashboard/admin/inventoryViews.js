// js/dashboard/admin/inventoryViews.js

import { API_URL, apiFetch } from '../api.js';
import { renderView, renderStatusBadge } from '../ui.js';
import { renderInventoryRow } from './renderers.js';

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