// js/dashboard/views/reservations.js

/**
 * Módulo da View "Minhas Reservas".
 *
 * Este script é responsável por carregar e renderizar a página onde os
 * utilizadores podem visualizar o seu próprio histórico de reservas. Ele constrói
 * a interface com vários controlos de filtro e busca os dados
 * paginados do endpoint `my-reservations` da API.
 *
 * Funcionalidades:
 * - `loadMyReservationsView()`: A função principal que monta a estrutura da
 * página, incluindo a barra de pesquisa, filtros de status e seletores de data.
 * Em seguida, ela busca e exibe a lista de reservas que correspondem aos filtros aplicados.
 *
 * Dependências:
 * - `api.js`: Para a comunicação com a API.
 * - `ui.js`: Para renderizar a view principal, os badges de status e os controlos de paginação.
 */


import { API_URL, apiFetch } from '../api.js';
import { renderView, renderStatusBadge, renderPaginationControls } from '../ui.js';

/**
 * Carrega e renderiza a view "Minhas Reservas".
 * @param {string} token - O token de autenticação do utilizador.
 * @param {object} params - Um objeto com os parâmetros de filtro (search, status, start_date, end_date, page).
 */
export async function loadMyReservationsView(token, params = {}) {
    // Define as opções de filtro de status que serão exibidas como botões.
    const statusFilters = [
        { key: 'all', text: 'Todas' },
        { key: 'pending', text: 'Pendentes' },
        { key: 'approved', text: 'Aprovadas' },
        { key: 'overdue', text: 'Atrasadas' },
        { key: 'returned', text: 'Devolvidas' },
        { key: 'rejected', text: 'Rejeitadas' }
    ];

    const sortOptions = [
        { key: 'start_time', text: 'Início da Reserva' },
        { key: 'end_time', text: 'Fim da Reserva' },
        { key: 'created_at', text: 'Data de Solicitação' },
        { key: 'equipment', text: 'Equipamento' },
        { key: 'status', text: 'Status' }
    ];

    // Renderiza a estrutura HTML principal da página, incluindo os formulários de filtro.
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
                    <div class="col-md-3">
                        <label for="myReservationsStartDate" class="form-label small">Período de</label>
                        <input type="date" id="myReservationsStartDate" class="form-control" value="${params.start_date || ''}">
                    </div>
                    <div class="col-md-3">
                        <label for="myReservationsEndDate" class="form-label small">Até</label>
                        <input type="date" id="myReservationsEndDate" class="form-control" value="${params.end_date || ''}">
                    </div>
                    <div class="col-md-3">
                        <label for="myReservationsSortBy" class="form-label small">Ordenar por</label>
                        <select id="myReservationsSortBy" class="form-select">
                            ${sortOptions.map(opt => `<option value="${opt.key}" ${params.sort_by === opt.key ? 'selected' : ''}>${opt.text}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="myReservationsSortDir" class="form-label small">Direção</label>
                        <select id="myReservationsSortDir" class="form-select">
                            <option value="asc" ${params.sort_dir === 'asc' ? 'selected' : ''}>Ascendente</option>
                            <option value="desc" ${params.sort_dir === 'desc' ? 'selected' : ''}>Descendente</option>
                        </select>
                    </div>
                    <div class="col-md-1 d-flex align-items-end">
                         <button class="btn btn-primary w-100" id="applyMyReservationsFilterBtn"><i class="bi bi-funnel-fill"></i></button>
                    </div>
                </div>
            </div>
        </div>
        <div id="listContainer" class="table-responsive"></div>
        <div id="paginationContainer"></div>
    `);
    
    // Exibe um spinner de carregamento enquanto os dados são buscados.
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        // Monta a URL da API com os parâmetros de paginação e filtro.
        const url = new URL(`${API_URL}/reservations/my-reservations`);
        url.searchParams.append('page', params.page || 1);
        if (params.search) url.searchParams.append('search', params.search);
        if (params.status && params.status !== 'all') url.searchParams.append('status', params.status);
        if (params.start_date) url.searchParams.append('start_date', new Date(params.start_date).toISOString());
        if (params.end_date) url.searchParams.append('end_date', new Date(params.end_date + 'T23:59:59.999Z').toISOString());
        if (params.sort_by) url.searchParams.append('sort_by', params.sort_by);
        if (params.sort_dir) url.searchParams.append('sort_dir', params.sort_dir);
        
        // Busca os dados paginados das reservas.
        const data = await apiFetch(url, token);
        
        // Se não houver resultados, exibe uma mensagem.
        if (data.items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma reserva encontrada com os filtros aplicados.</p>';
            document.getElementById('paginationContainer').innerHTML = '';
            return;
        }
        // Monta a tabela com as reservas encontradas.
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
        // Renderiza os controlos de paginação.
        document.getElementById('paginationContainer').innerHTML = renderPaginationControls(data, 'my-reservations');
    } catch (e) {
        // Em caso de erro, exibe uma mensagem de falha.
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}