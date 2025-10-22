// js/dashboard/views/home.js

/**
 * Módulo da View de Início do Dashboard.
 *
 * Este script é responsável por carregar e renderizar a página inicial do painel
 * de controle. Ele monta a estrutura da página e inicia a busca por dados
 * relevantes para o usuário, como suas próximas reservas e os equipamentos
 * mais populares do sistema, exibindo-os em cards.
 *
 * Funcionalidades:
 * - `loadDashboardHomeView()`: Função principal que renderiza o layout da página
 * de início e chama outras funções para popular os cards.
 * - `loadUpcomingReservations()`: Busca as próximas reservas do usuário na API
 * e as exibe em uma lista.
 * - `loadPopularEquipment()`: Busca os equipamentos mais reservados na API e
 * os apresenta em uma lista.
 *
 * Dependências:
 * - `api.js`: Para a comunicação com a API.
 * - `ui.js`: Para a renderização da view e de componentes como os badges de status.
 */


import { API_URL, apiFetch } from '../api.js';
import { renderView, renderStatusBadge } from '../ui.js';

/**
 * Carrega a view da página inicial do dashboard.
 * @param {string} token - O token de autenticação do usuário.
 */
export async function loadDashboardHomeView(token) {
    // Renderiza a estrutura HTML inicial da página, incluindo os placeholders de carregamento.
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

    // Dispara as funções que buscarão os dados para preencher os cards.
    loadUpcomingReservations(token);
    loadPopularEquipment(token);
}

/**
 * Busca e renderiza as próximas reservas do usuário.
 * @param {string} token - O token de autenticação do usuário.
 */
async function loadUpcomingReservations(token) {
    const container = document.getElementById('upcomingReservationsContainer');
    try {
        // Faz a chamada à API para o endpoint de próximas reservas.
        const reservations = await apiFetch(`${API_URL}/reservations/upcoming`, token);
        // Se não houver reservas, exibe uma mensagem informativa.
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted">Você não possui reservas futuras.</p>';
            return;
        }
        // Monta a lista de reservas e a insere no container.
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
        // Em caso de erro, exibe uma mensagem de falha.
        container.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

/**
 * Busca e renderiza os equipamentos mais populares.
 * @param {string} token - O token de autenticação do usuário.
 */
async function loadPopularEquipment(token) {
    const container = document.getElementById('popularEquipmentContainer');
    try {
        // Faz a chamada à API para o endpoint de estatísticas de equipamentos populares.
        const popular = await apiFetch(`${API_URL}/equipments/stats/popular`, token);
        if (popular.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum dado de popularidade ainda.</p>';
            return;
        }
        // Monta a lista de equipamentos e a insere no container.
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