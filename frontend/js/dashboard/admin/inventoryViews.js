// js/dashboard/admin/inventoryViews.js

/**
 * Módulo para as Views de Gerenciamento de Inventário.
 *
 * Este script contém as funções responsáveis por renderizar as interfaces
 * de gerenciamento de inventário para gerentes e administradores. Isso inclui
 * a visualização principal dos tipos de equipamento e a tela detalhada para
 * gerenciar as unidades físicas de um tipo específico.
 *
 * Funcionalidades:
 * - `loadManageInventoryView()`: Carrega a view principal que exibe todos os
 * tipos de equipamento em formato de "cards", com estatísticas e filtros.
 * - `loadManageUnitsView()`: Carrega a view dedicada para gerenciar as
 * unidades de um tipo de equipamento, incluindo um formulário para adicionar/editar
 * e uma tabela com a lista de unidades.
 * - `populateUnitsTable()`: Função auxiliar que renderiza ou atualiza a tabela
 * de unidades com base nos dados e em um filtro de status.
 *
 * Dependências:
 * - `api.js`: Para fazer chamadas à API.
 * - `ui.js`: Para renderizar a view principal e componentes como badges e paginação.
 * - `renderers.js`: Para a função que desenha o card de um tipo de equipamento.
 */


import { API_URL, apiFetch } from '../api.js';
import { renderView, renderStatusBadge, renderPaginationControls } from '../ui.js';
import { renderInventoryRow } from './renderers.js';

/**
 * Popula a tabela de unidades de equipamento com base em um array de unidades e um filtro de status.
 * @param {Array<object>} units - O array completo de unidades para um tipo de equipamento.
 * @param {string} token - O token de autenticação.
 * @param {string} [statusFilter='all'] - O filtro de status a ser aplicado ('all', 'available', etc.).
 */
export function populateUnitsTable(units, token, statusFilter = 'all') {
    const tableBody = document.getElementById('unitsTableBody');
    if (!tableBody) return;

    // Filtra as unidades com base no status selecionado.
    const filteredUnits = units.filter(unit => {
        if (statusFilter === 'all') return true;
        // Agrupa 'reserved' e 'pending' sob o mesmo filtro para simplificar a UI.
        if (statusFilter === 'reserved') return unit.status === 'reserved' || unit.status === 'pending';
        return unit.status === statusFilter;
    });

    if (filteredUnits.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhuma unidade encontrada com este status.</td></tr>';
        return;
    }

    // Mapeia os status para classes de cor do Bootstrap para destaque visual.
    const statusRowClass = {
        available: 'table-success',
        maintenance: 'table-warning',
        reserved: 'table-info',
        pending: 'table-light'
    };

    // Gera o HTML para cada linha da tabela.
    tableBody.innerHTML = filteredUnits.map(unit => {
        let infoCell = '---';
        // Se a unidade tiver uma reserva ativa, exibe quem a reservou e até quando.
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


/**
 * Carrega a view principal de gerenciamento de inventário (lista de tipos de equipamento).
 * @param {string} token - O token de autenticação.
 * @param {object} [params={}] - Os parâmetros de filtro (pesquisa, categoria, página).
 */
export async function loadManageInventoryView(token, params = {}) {
    // Busca todas as categorias existentes para popular o dropdown de filtro.
    const categories = await apiFetch(`${API_URL}/equipments/types/categories`, token);

    // Renderiza o layout da página, incluindo os filtros.
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerir Inventário</h1>
            <button class="btn btn-primary inventory-action-btn" data-action="create-type"><i class="bi bi-plus-circle me-2"></i>Adicionar Tipo</button>
        </div>
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-lg-6">
                        <input type="search" id="inventorySearchInput" class="form-control" placeholder="Buscar por ID, nome, categoria, código ou nº de série..." value="${params.search || ''}">
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <select id="inventoryCategoryFilter" class="form-select">
                            <option value="all">Todas as categorias</option>
                            ${categories.map(cat => `<option value="${cat}" ${params.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6 d-flex align-items-end">
                        <button class="btn btn-primary w-100" id="searchInventoryBtn"><i class="bi bi-funnel-fill"></i> Filtrar</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="listContainer" class="row"></div>
        <div id="paginationContainer"></div>
    `);
    
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        // Constrói a URL para buscar os tipos de equipamento com base nos filtros.
        const url = new URL(`${API_URL}/equipments/types`);
        url.searchParams.append('page', params.page || 1);
        if (params.search) url.searchParams.append('search', params.search);
        if (params.category && params.category !== 'all') url.searchParams.append('category', params.category);

        const data = await apiFetch(url.toString(), token);

        if (data.items.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-muted text-center">Nenhum tipo de equipamento encontrado com os filtros aplicados.</p></div>';
            document.getElementById('paginationContainer').innerHTML = '';
            return;
        }
        // Renderiza um card para cada tipo de equipamento.
        container.innerHTML = data.items.map(type => renderInventoryRow(type)).join('');
        document.getElementById('paginationContainer').innerHTML = renderPaginationControls(data, 'inventory');

    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

/**
 * Carrega a view para gerenciar as unidades de um tipo de equipamento específico.
 * @param {string} token - O token de autenticação.
 * @param {number} typeId - O ID do tipo de equipamento.
 */
export async function loadManageUnitsView(token, typeId) {
    renderView(`
        <div id="units-view-container">
            <div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>
        </div>
    `);

    try {
        // Busca os dados do tipo de equipamento, que já incluem a lista de suas unidades.
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        const container = document.getElementById('units-view-container');
        
        const statusFilters = [
            { key: 'all', text: 'Todos' },
            { key: 'available', text: 'Disponíveis' },
            { key: 'reserved', text: 'Reservados' },
            { key: 'maintenance', text: 'Manutenção' }
        ];
        
        // Renderiza a view de duas colunas: formulário à esquerda, tabela à direita.
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
        
        // Armazena os dados brutos das unidades em um atributo de dados para fácil acesso pelos filtros.
        container.dataset.units = JSON.stringify(type.units);
        
        // Popula a tabela com todas as unidades inicialmente.
        populateUnitsTable(type.units, token, 'all');

    } catch(e) {
        document.getElementById('units-view-container').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}