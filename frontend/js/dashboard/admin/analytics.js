// js/dashboard/admin/analytics.js

/**
 * Módulo do Painel de Análise (Analytics).
 *
 * Este script é responsável por carregar e renderizar a view de análise
 * de dados para administradores. Ele constrói uma interface com filtros
 * avançados (data, setor, equipamento, etc.) e utiliza a biblioteca Chart.js
 * para visualizar as estatísticas agregadas retornadas pela API.
 *
 * Funcionalidades:
 * - `loadAnalyticsDashboardView()`: Monta a estrutura da página de análise,
 * incluindo os filtros, e dispara a busca e renderização dos dados.
 * - `fetchAndRenderCharts()`: Busca os dados de estatísticas do endpoint
 * `/dashboard/stats` e popula tanto os cards de KPIs quanto os gráficos.
 * - `renderChart()`: Uma função auxiliar para criar ou atualizar instâncias
 * de gráficos (barras, pizza, linha, etc.), garantindo que os gráficos
 * sejam destruídos e recriados corretamente ao aplicar novos filtros.
 *
 * Dependências:
 * - `api.js`: Para a comunicação com a API.
 * - `ui.js`: Para a renderização da view principal.
 * - Chart.js: Para a criação dos gráficos.
 */


import { API_URL, apiFetch } from '../api.js';
import { renderView } from '../ui.js';

// Variáveis para armazenar as instâncias dos gráficos, permitindo que sejam
// destruídas e recriadas quando os filtros são aplicados.
let charts = {
    equipmentsChart: null,
    sectorsChart: null,
    usersChart: null,
    reservationStatusChart: null,
    reservationsByDayChart: null
};

/**
 * Carrega a view principal do painel de análise.
 * @param {string} token - O token de autenticação do usuário.
 * @param {object} [params={}] - Os parâmetros de filtro a serem aplicados.
 */
export async function loadAnalyticsDashboardView(token, params = {}) {
    // Busca os dados para preencher os dropdowns de filtro de forma paralela.
    // O `size=1000` é uma forma de garantir que todos os itens sejam retornados.
    const [sectorsData, usersData, equipmentTypesData] = await Promise.all([
        apiFetch(`${API_URL}/sectors/?size=1000`, token),
        apiFetch(`${API_URL}/admin/users?size=1000`, token),
        apiFetch(`${API_URL}/equipments/types?size=1000`, token)
    ]);

    // Renderiza o layout HTML da página, incluindo os cards e os filtros.
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

    // Após renderizar a estrutura, busca os dados e desenha os gráficos.
    fetchAndRenderCharts(token, params);
}

/**
 * Busca os dados estatísticos da API e renderiza os cards e gráficos.
 * @param {string} token - O token de autenticação.
 * @param {object} [params={}] - Os parâmetros de filtro.
 */
async function fetchAndRenderCharts(token, params = {}) {
    const chartsContainer = document.getElementById('charts-container');
    const statsCardsContainer = document.getElementById('stats-cards');
    
    // Guarda o HTML dos placeholders dos gráficos para restaurá-lo após o carregamento.
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
    // Exibe spinners de carregamento enquanto os dados são buscados.
    chartsContainer.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div><p>Carregando dados...</p></div>';
    statsCardsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border spinner-border-sm"></div></div>';


    try {
        // Constrói a URL da API com os parâmetros de filtro.
        const url = new URL(`${API_URL}/dashboard/stats`);
        if (params.start_date) url.searchParams.append('start_date', new Date(params.start_date).toISOString());
        if (params.end_date) url.searchParams.append('end_date', new Date(params.end_date + 'T23:59:59.999Z').toISOString());
        if (params.sector_id) url.searchParams.append('sector_id', params.sector_id);
        if (params.equipment_type_id) url.searchParams.append('equipment_type_id', params.equipment_type_id);
        if (params.user_id) url.searchParams.append('user_id', params.user_id);

        // Busca os dados da API.
        const data = await apiFetch(url.toString(), token);
        chartsContainer.innerHTML = originalHtml; // Restaura o HTML com os elementos <canvas>.

        // Renderiza os cards de estatísticas (KPIs).
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


        // Renderiza cada um dos gráficos com os dados obtidos.
        renderChart('equipmentsChart', 'bar', 'Nº de Reservas', data.top_equipments);
        renderChart('sectorsChart', 'pie', 'Nº de Reservas', data.top_sectors);
        renderChart('usersChart', 'bar', 'Nº de Reservas', data.top_users, { indexAxis: 'y' });
        renderChart('reservationStatusChart', 'doughnut', 'Total', data.reservation_status_counts);
        renderChart('reservationsByDayChart', 'line', 'Nº de Reservas', data.reservations_by_day, { tension: 0.1 });


    } catch (e) {
        // Em caso de erro, exibe uma mensagem de falha.
        chartsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">${e.message}</div></div>`;
        statsCardsContainer.innerHTML = '';
    }
}

/**
 * Função auxiliar para criar ou atualizar um gráfico usando Chart.js.
 * @param {string} canvasId - O ID do elemento <canvas> onde o gráfico será renderizado.
 * @param {string} type - O tipo de gráfico (ex: 'bar', 'pie', 'line').
 * @param {string} label - O rótulo para o conjunto de dados (dataset).
 * @param {Array<object>} data - O array de dados, onde cada objeto tem `name` e `count`.
 * @param {object} [extraOptions={}] - Opções adicionais para a configuração do Chart.js.
 */
function renderChart(canvasId, type, label, data, extraOptions = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = data.map(item => item.name);
    const values = data.map(item => item.count);
    
    // Destrói a instância do gráfico anterior se ela existir. Isso é crucial
    // para evitar sobreposição e problemas de memória ao reaplicar filtros.
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    const scalesOptions = {};
    if (type === 'bar' || type === 'line') {
        // Garante que os eixos de gráficos de barras e linhas exibam apenas números inteiros.
        if (extraOptions.indexAxis !== 'y') {
            scalesOptions.y = {
                ticks: {
                    stepSize: 1, 
                    beginAtZero: true
                }
            };
        } else { // Para barras horizontais.
             scalesOptions.x = {
                ticks: {
                    stepSize: 1,
                    beginAtZero: true
                }
            };
        }
    }

    // Cria uma nova instância do gráfico e a armazena na variável global `charts`.
    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                backgroundColor: [ // Paleta de cores padrão
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(201, 203, 207, 0.7)'
                ],
                borderColor: [ // Cores das bordas
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
            scales: scalesOptions, // Aplica as opções de escala (eixos)
            ...extraOptions // Mescla quaisquer outras opções personalizadas
        }
    });
}