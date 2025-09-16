// js/dashboard/views.js

import { API_URL, apiFetch } from './api.js';
import { renderView, renderStatusBadge, showToast } from './ui.js';

/**
 * Carrega a view principal de listagem de equipamentos.
 * @param {string} token - O token de autorização.
 */
export async function loadEquipmentsView(token) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Equipamentos Disponíveis</h1>
        </div>
        <div id="listContainer" class="row"></div>
    `);
    try {
        const types = await apiFetch(`${API_URL}/equipments/types`, token);
        const container = document.getElementById('listContainer');
        if (types.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum equipamento cadastrado.</p>';
            return;
        }
        container.innerHTML = types.map(type => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${type.name}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${type.category}</h6>
                        <p class="card-text flex-grow-1">${type.description || 'Sem descrição.'}</p>
                        <button class="btn btn-outline-primary mt-auto view-units-btn" data-type-id="${type.id}">Ver Unidades</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

/**
 * Carrega a view com as reservas do usuário logado.
 * @param {string} token - O token de autorização.
 */
export async function loadMyReservationsView(token) {
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Minhas Reservas</h1>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const reservations = await apiFetch(`${API_URL}/reservations/my-reservations`, token);
        const container = document.getElementById('listContainer');
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted">Você não fez nenhuma reserva.</p>';
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
                    </tr>
                </thead>
                <tbody>
                    ${reservations.map(res => `
                        <tr>
                            <td>${res.equipment_unit.equipment_type.name}</td>
                            <td>${res.equipment_unit.identifier_code || 'N/A'}</td>
                            <td>${renderStatusBadge(res.status)}</td>
                            <td>${new Date(res.start_time).toLocaleString('pt-BR')}</td>
                            <td>${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        document.getElementById('listContainer').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

/**
 * Carrega a view de gerenciamento da conta do usuário.
 * @param {object} currentUser - O objeto do usuário logado.
 */
export function loadMyAccountView(currentUser) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Minha Conta</h1>
        </div>
        <div id="accountContainer">
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Atualizar Perfil</h5>
                            <form id="updateProfileForm">
                                <div class="mb-3">
                                    <label for="profileUsername" class="form-label">Nome de Usuário</label>
                                    <input type="text" class="form-control" id="profileUsername" value="${currentUser.username}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="profileEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="profileEmail" value="${currentUser.email}" disabled>
                                    <div class="form-text">O email não pode ser alterado.</div>
                                </div>
                                <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Integração com Google Agenda</h5>
                            <p class="card-text">Conecte sua conta do Google para que suas reservas aprovadas sejam automaticamente adicionadas à sua agenda.</p>
                            <button class="btn btn-outline-primary" id="connectGoogleBtn"><i class="bi bi-google me-2"></i>Conectar com Google</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <div class="card border-danger">
                    <div class="card-body">
                        <h5 class="card-title text-danger">Zona de Perigo</h5>
                        <p class="card-text">A exclusão da sua conta é uma ação irreversível. Todos os seus dados, incluindo o histórico de reservas, serão permanentemente removidos.</p>
                        <button class="btn btn-danger" id="deleteAccountBtn">Excluir Minha Conta</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Busca e exibe as unidades de um tipo de equipamento em um modal.
 * @param {string} typeId - O ID do tipo de equipamento.
 * @param {string} token - O token de autorização.
 */
export async function fetchAndShowUnits(typeId, token) {
    const modal = new bootstrap.Modal(document.getElementById('unitsModal'));
    const modalTitle = document.getElementById('unitsModalLabel');
    const modalBody = document.getElementById('modalUnitList');
    modalTitle.textContent = 'Carregando...';
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    modal.show();

    try {
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        modalTitle.textContent = `Unidades de ${type.name}`;
        if (type.units.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nenhuma unidade cadastrada.</p>';
            return;
        }
        modalBody.innerHTML = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Status</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${type.units.map(unit => {
                        const isAvailable = unit.status === 'available';
                        return `
                            <tr>
                                <td>${unit.identifier_code || 'N/A'}</td>
                                <td>${renderStatusBadge(unit.status)}</td>
                                <td>
                                    ${isAvailable ? 
                                        `<button class="btn btn-primary btn-sm reserve-btn" data-unit-id="${unit.id}" data-unit-identifier="${unit.identifier_code || `ID ${unit.id}`}">Reservar</button>` : 
                                        `<button class="btn btn-secondary btn-sm" disabled>Indisponível</button>`
                                    }
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        modalBody.innerHTML = `<p class="text-danger">${e.message}</p>`;
    }
}