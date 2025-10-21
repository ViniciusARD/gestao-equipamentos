// js/dashboard/admin/analytics.js

import { API_URL, apiFetch } from '../api.js';
import { renderView } from '../ui.js';

// Variáveis para armazenar as instâncias dos gráficos
let charts = {
    equipmentsChart: null,
    sectorsChart: null,
    usersChart: null,
    reservationStatusChart: null,
    reservationsByDayChart: null
};

// Função principal para carregar a view do painel
export async function loadAnalyticsDashboardView(token, params = {}) {
    // CORREÇÃO: Busca todos os itens para os dropdowns de filtro, com a barra final na URL
    const [sectorsData, usersData, equipmentTypesData] = await Promise.all([
        apiFetch(`${API_URL}/sectors/?size=1000`, token),
        apiFetch(`${API_URL}/admin/users?size=1000`, token),
        apiFetch(`${API_URL}/equipments/types?size=1000`, token)
    ]);

    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Painel de Análise</h1>
        </div>

        <div class="row" id="stats-cards">
            </div>

        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">Filtros</h5>
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-6">
                        <label for="analyticsStartDate" class="form-label small">Data de Início</label>
                        <input type="date" id="analyticsStartDate" class="form-control" value="${params.start_date || ''}">
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label for="analyticsEndDate" class="form-label small">Data Final</label>
                        <input type="date" id="analyticsEndDate" class="form-control" value="${params.end_date || ''}">
                    </div>
                     <div class="col-lg-2 col-md-4">
                        <label for="analyticsSectorFilter" class="form-label small">Setor</label>
                        <select id="analyticsSectorFilter" class="form-select">
                            <option value="">Todos</option>
                            ${sectorsData.items.map(s => `<option value="${s.id}" ${params.sector_id == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-lg-2 col-md-4">
                        <label for="analyticsEquipmentTypeFilter" class="form-label small">Equipamento</label>
                        <select id="analyticsEquipmentTypeFilter" class="form-select">
                            <option value="">Todos</option>
                            ${equipmentTypesData.items.map(et => `<option value="${et.id}" ${params.equipment_type_id == et.id ? 'selected' : ''}>${et.name}</option>`).join('')}
                        </select>
                    </div>
                     <div class="col-lg-2 col-md-4">
                        <label for="analyticsUserFilter" class="form-label small">Usuário</label>
                        <select id="analyticsUserFilter" class="form-select">
                            <option value="">Todos</option>
                             ${usersData.items.map(u => `<option value="${u.id}" ${params.user_id == u.id ? 'selected' : ''}>${u.username}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-12 d-flex justify-content-end">
                        <button class="btn btn-primary" id="applyAnalyticsFilterBtn"><i class="bi bi-funnel-fill me-2"></i>Aplicar Filtros</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="charts-container" class="row">
            </div>
    `);

    fetchAndRenderCharts(token, params);
}

// Busca os dados e renderiza os gráficos
async function fetchAndRenderCharts(token, params = {}) {
    const chartsContainer = document.getElementById('charts-container');
    const statsCardsContainer = document.getElementById('stats-cards');
    const originalHtml = `
        <div class="col-xl-6 mb-4">
            <div class="card h-100">
                <div class="card-header">Top 5 Equipamentos Mais Reservados</div>
                <div class="card-body"><canvas id="equipmentsChart"></canvas></div>
            </div>
        </div>
        <div class="col-xl-6 mb-4">
            <div class="card h-100">
                <div class="card-header">Status Gerais das Reservas</div>
                <div class="card-body"><canvas id="reservationStatusChart"></canvas></div>
            </div>
        </div>
        <div class="col-xl-6 mb-4">
            <div class="card h-100">
                <div class="card-header">Top 5 Setores Que Mais Reservam</div>
                <div class="card-body"><canvas id="sectorsChart"></canvas></div>
            </div>
        </div>
        <div class="col-xl-6 mb-4">
            <div class="card h-100">
                <div class="card-header">Top 5 Usuários Que Mais Reservam</div>
                <div class="card-body"><canvas id="usersChart"></canvas></div>
            </div>
        </div>
         <div class="col-12 mb-4">
            <div class="card h-100">
                <div class="card-header">Reservas por Dia da Semana</div>
                <div class="card-body" style="min-height: 300px;"><canvas id="reservationsByDayChart"></canvas></div>
            </div>
        </div>
    `;
    chartsContainer.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div><p>Carregando dados...</p></div>';
    statsCardsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border spinner-border-sm"></div></div>';


    try {
        const url = new URL(`${API_URL}/dashboard/stats`);
        if (params.start_date) url.searchParams.append('start_date', new Date(params.start_date).toISOString());
        if (params.end_date) url.searchParams.append('end_date', new Date(params.end_date + 'T23:59:59.999Z').toISOString());
        if (params.sector_id) url.searchParams.append('sector_id', params.sector_id);
        if (params.equipment_type_id) url.searchParams.append('equipment_type_id', params.equipment_type_id);
        if (params.user_id) url.searchParams.append('user_id', params.user_id);


        const data = await apiFetch(url.toString(), token);
        chartsContainer.innerHTML = originalHtml; // Restaura o HTML com os canvas

        // Renderiza os cards de estatísticas
        statsCardsContainer.innerHTML = `
            <div class="col-md-4 mb-4">
                <div class="card text-white bg-primary h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-people-fill me-2"></i>Total de Usuários</h5>
                        <p class="card-text fs-4">${data.total_users}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card text-white bg-success h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-hdd-stack-fill me-2"></i>Total de Equipamentos</h5>
                        <p class="card-text fs-4">${data.total_equipments}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card text-white bg-info h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-calendar-check-fill me-2"></i>Reservas (no período)</h5>
                        <p class="card-text fs-4">${data.total_reservations}</p>
                    </div>
                </div>
            </div>
        `;


        // Renderiza cada gráfico
        renderChart('equipmentsChart', 'bar', 'Nº de Reservas', data.top_equipments);
        renderChart('sectorsChart', 'pie', 'Nº de Reservas', data.top_sectors);
        renderChart('usersChart', 'bar', 'Nº de Reservas', data.top_users, { indexAxis: 'y' });
        renderChart('reservationStatusChart', 'doughnut', 'Total', data.reservation_status_counts);
        renderChart('reservationsByDayChart', 'line', 'Nº de Reservas', data.reservations_by_day, { tension: 0.1 });


    } catch (e) {
        chartsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">${e.message}</div></div>`;
        statsCardsContainer.innerHTML = '';
    }
}

// Função auxiliar para criar/atualizar um gráfico
function renderChart(canvasId, type, label, data, extraOptions = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = data.map(item => item.name);
    const values = data.map(item => item.count);
    
    // Destrói o gráfico anterior se ele existir
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    const scalesOptions = {};
    if (type === 'bar' || type === 'line') {
        // Se for um gráfico de barras com eixo y (padrão)
        if (extraOptions.indexAxis !== 'y') {
            scalesOptions.y = {
                ticks: {
                    stepSize: 1, // Garante que o eixo Y só mostre inteiros
                    beginAtZero: true
                }
            };
        } else { // Se for um gráfico de barras com eixo x (barras horizontais)
             scalesOptions.x = {
                ticks: {
                    stepSize: 1, // Garante que o eixo X só mostre inteiros
                    beginAtZero: true
                }
            };
        }
    }


    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(201, 203, 207, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: scalesOptions, // Aplica as opções de escala
            ...extraOptions
        }
    });
}