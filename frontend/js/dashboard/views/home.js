// js/dashboard/views/home.js

import { API_URL, apiFetch } from '../api.js';
import { renderView, renderStatusBadge } from '../ui.js';

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
            container.innerHTML = '<p class="text-muted">Nenhum dado de popularidade ainda.</p>';
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