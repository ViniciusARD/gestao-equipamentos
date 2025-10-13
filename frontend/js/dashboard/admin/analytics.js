// js/dashboard/admin/analytics.js

import { API_URL, apiFetch } from '../api.js';
import { renderView } from '../ui.js';

// Variáveis para armazenar as instâncias dos gráficos
let charts = {
    equipmentsChart: null,
    sectorsChart: null,
    usersChart: null,
    reservationStatusChart: null
};

// Função principal para carregar a view do painel
export async function loadAnalyticsDashboardView(token, params = {}) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Painel de Análise</h1>
            <small class="text-muted">Estatísticas de TOP 5 baseadas em reservas APROVADAS.</small>
        </div>
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">Filtros</h5>
                <div class="row g-3">
                    <div class="col-md-5">
                        <label for="analyticsStartDate" class="form-label small">Período de</label>
                        <input type="date" id="analyticsStartDate" class="form-control" value="${params.start_date || ''}">
                    </div>
                    <div class="col-md-5">
                        <label for="analyticsEndDate" class="form-label small">Até</label>
                        <input type="date" id="analyticsEndDate" class="form-control" value="${params.end_date || ''}">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-primary w-100" id="applyAnalyticsFilterBtn"><i class="bi bi-funnel-fill"></i> Aplicar</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="charts-container" class="row">
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
        </div>
    `);

    fetchAndRenderCharts(token, params);
}

// Busca os dados e renderiza os gráficos
async function fetchAndRenderCharts(token, params = {}) {
    const chartsContainer = document.getElementById('charts-container');
    const originalHtml = chartsContainer.innerHTML;
    chartsContainer.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div><p>Carregando dados...</p></div>';

    try {
        const url = new URL(`${API_URL}/dashboard/stats`);
        if (params.start_date) url.searchParams.append('start_date', new Date(params.start_date).toISOString());
        if (params.end_date) url.searchParams.append('end_date', new Date(params.end_date + 'T23:59:59.999Z').toISOString());

        const data = await apiFetch(url.toString(), token);
        chartsContainer.innerHTML = originalHtml; // Restaura o HTML com os canvas

        // Renderiza cada gráfico
        renderChart('equipmentsChart', 'bar', 'Nº de Reservas', data.top_equipments);
        renderChart('sectorsChart', 'pie', 'Nº de Reservas', data.top_sectors);
        renderChart('usersChart', 'bar', 'Nº de Reservas', data.top_users, { indexAxis: 'y' });
        renderChart('reservationStatusChart', 'doughnut', 'Total', data.reservation_status_counts);


    } catch (e) {
        chartsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">${e.message}</div></div>`;
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
    if (type === 'bar') {
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
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
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