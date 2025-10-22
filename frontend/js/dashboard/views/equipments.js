// js/dashboard/views/equipments.js

/**
 * Módulo da View de Equipamentos.
 *
 * Este script é responsável por carregar e renderizar a página de visualização
 * de equipamentos disponíveis para os usuários. Ele constrói a interface com
 * filtros de busca e categoria, busca os dados dos tipos de equipamento na API
 * e os exibe em formato de "cards".
 *
 * Funcionalidades:
 * - `loadEquipmentsView()`: Função principal que monta a estrutura da página,
 * incluindo os filtros, e inicia a busca paginada pelos equipamentos.
 * - `fetchAndShowUnits()`: Abre um modal e busca os detalhes de todas as
 * unidades físicas associadas a um tipo de equipamento específico,
 * permitindo ao usuário iniciar o processo de reserva.
 *
 * Dependências:
 * - `api.js`: Para a comunicação com a API.
 * - `ui.js`: Para renderizar a view principal e componentes como badges e paginação.
 * - Bootstrap 5 para a funcionalidade do modal.
 */


import { API_URL, apiFetch } from '../api.js';
import { renderView, renderStatusBadge, renderPaginationControls } from '../ui.js';

/**
 * Carrega e renderiza a view de listagem de equipamentos.
 * @param {string} token - O token de autenticação do usuário.
 * @param {object} params - Um objeto com os parâmetros de filtro (search, category, page).
 */
export async function loadEquipmentsView(token, params = {}) {
    // Busca todos os tipos de equipamento para extrair as categorias e popular o filtro.
    const allTypesForCategories = await apiFetch(`${API_URL}/equipments/types`, token);
    // Cria uma lista de categorias únicas e ordenadas.
    const categories = [...new Set(allTypesForCategories.items.map(type => type.category))].sort();

    // Renderiza o layout principal da página, incluindo os filtros.
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Equipamentos Disponíveis</h1>
        </div>
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="input-group">
                    <input type="search" id="equipmentsSearchInput" class="form-control" placeholder="Buscar por nome, categoria ou descrição..." value="${params.search || ''}">
                    <button class="btn btn-outline-secondary" type="button" id="searchEquipmentsBtn"><i class="bi bi-search"></i></button>
                </div>
            </div>
            <div class="col-md-4">
                <select id="equipmentsCategoryFilter" class="form-select">
                    <option value="all">Todas as categorias</option>
                    ${categories.map(cat => `<option value="${cat}" ${params.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>
        </div>
        <div id="listContainer" class="row"></div>
        <div id="paginationContainer"></div>
    `);
    
    // Exibe um spinner enquanto os dados são carregados.
    const container = document.getElementById('listContainer');
    container.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';

    try {
        // Monta a URL da API com os parâmetros de paginação e filtro.
        const url = new URL(`${API_URL}/equipments/types`);
        url.searchParams.append('page', params.page || 1);
        if (params.search) url.searchParams.append('search', params.search);
        if (params.category && params.category !== 'all') url.searchParams.append('category', params.category);
        
        // Busca os dados paginados dos equipamentos.
        const data = await apiFetch(url, token);

        // Se não houver resultados, exibe uma mensagem.
        if (data.items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center col-12">Nenhum equipamento encontrado com os filtros aplicados.</p>';
            document.getElementById('paginationContainer').innerHTML = '';
            return;
        }
        // Itera sobre os resultados e cria um card para cada tipo de equipamento.
        container.innerHTML = data.items.map(type => `
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
        // Renderiza os controles de paginação.
        document.getElementById('paginationContainer').innerHTML = renderPaginationControls(data, 'equipments');

    } catch (e) {
        // Em caso de erro, exibe uma mensagem de falha.
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

/**
 * Busca e exibe as unidades físicas de um tipo de equipamento num modal.
 * @param {string} typeId - O ID do tipo de equipamento.
 * @param {string} token - O token de autenticação.
 */
export async function fetchAndShowUnits(typeId, token) {
    const modal = new bootstrap.Modal(document.getElementById('unitsModal'));
    const modalTitle = document.getElementById('unitsModalLabel');
    const modalBody = document.getElementById('modalUnitList');

    // Prepara e exibe o modal com um spinner de carregamento.
    modalTitle.textContent = 'Carregando...';
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    modal.show();

    try {
        // Busca os detalhes do tipo de equipamento, incluindo a lista de suas unidades.
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        modalTitle.textContent = `Unidades de ${type.name}`;
        if (type.units.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nenhuma unidade cadastrada.</p>';
            return;
        }
        // Monta a tabela com as unidades encontradas.
        modalBody.innerHTML = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nº de Série</th>
                        <th>Status</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${type.units.map(unit => {
                        const isAvailable = unit.status === 'available';
                        return `
                            <tr>
                                <td>${unit.identifier_code}</td>
                                <td>${unit.serial_number}</td>
                                <td>${renderStatusBadge(unit.status)}</td>
                                <td>
                                    ${isAvailable ?
                                        `<button class="btn btn-primary btn-sm reserve-btn" data-unit-id="${unit.id}" data-unit-identifier="${unit.identifier_code}">Reservar</button>` :
                                        `<button class="btn btn-secondary btn-sm" disabled>Indisponível</button>`
                                    }
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        // Em caso de erro, exibe a mensagem no corpo do modal.
        modalBody.innerHTML = `<p class="text-danger">${e.message}</p>`;
    }
}