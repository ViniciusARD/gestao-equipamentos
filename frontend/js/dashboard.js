// js/dashboard.js

// Constantes da API
const API_URL = 'http://127.0.0.1:8000';

// Função principal que é executada quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    initializeApp(token);

    // Prepara o container para as notificações (toasts)
    createToastContainer();
});

/**
 * Inicializa a dashboard.
 * @param {string} token O token JWT do usuário.
 */
async function initializeApp(token) {
    const user = await fetchUserData(token);
    if (user) {
        document.getElementById('user-greeting').textContent = `Olá, ${user.username}!`;
        if (user.role === 'admin') {
            document.getElementById('admin-menu').classList.remove('d-none');
        }
    }

    loadEquipmentsView(token);
    setupEventListeners(token);
}

/**
 * Busca os dados do usuário autenticado.
 * @param {string} token O token JWT.
 * @returns {Promise<object|null>} Os dados do usuário ou null em caso de erro.
 */
async function fetchUserData(token) {
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar dados do usuário.');
        return await response.json();
    } catch (error) {
        console.error(error);
        logout();
        return null;
    }
}

/**
 * Configura todos os listeners de eventos da página.
 * @param {string} token O token JWT.
 */
function setupEventListeners(token) {
    // Listener de eventos para cliques em QUALQUER LUGAR (event delegation)
    document.body.addEventListener('click', (event) => {
        const target = event.target.closest('a, button'); // Encontra o link ou botão mais próximo do clique
        if (!target) return;

        // Ações de navegação
        if (target.id === 'nav-equipments') {
            event.preventDefault();
            setActiveNav(target);
            loadEquipmentsView(token);
        } else if (target.id === 'nav-my-reservations') {
            event.preventDefault();
            setActiveNav(target);
            loadMyReservationsView(token);
        } else if (target.id === 'nav-manage-reservations') {
            event.preventDefault();
            setActiveNav(target);
            loadManageReservationsView(token);
        }
        // Ações da página
        else if (target.id === 'logoutButton') logout(token);
        else if (target.id === 'menu-toggle') document.getElementById('wrapper').classList.toggle('toggled');
        else if (target.matches('.view-units-btn')) fetchAndShowUnits(target.dataset.typeId, token);
        else if (target.matches('.reserve-btn')) openReserveModal(target.dataset.unitId, target.dataset.unitIdentifier);
        else if (target.matches('.admin-action-btn')) {
             event.preventDefault();
             handleUpdateReservationStatus(target, token);
        }
    });

    // Listener para o envio do formulário de reserva
    document.getElementById('reservationForm').addEventListener('submit', (event) => {
        event.preventDefault();
        handleReservationSubmit(token);
    });
}

/**
 * Define o link de navegação ativo.
 * @param {HTMLElement} element O elemento clicado.
 */
function setActiveNav(element) {
    document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

// --- Funções de Carregamento de Views ---

/**
 * Carrega a view de tipos de equipamentos.
 * @param {string} token O token JWT.
 */
async function loadEquipmentsView(token) {
    renderView(`
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Tipos de Equipamentos Disponíveis</h1>
        </div>
        <div id="equipmentList" class="row"></div>
    `);

    try {
        const equipmentTypes = await apiFetch(`${API_URL}/equipments/types`, token);
        const listDiv = document.getElementById('equipmentList');
        
        if (equipmentTypes.length === 0) {
            listDiv.innerHTML = '<p class="text-muted">Nenhum equipamento cadastrado.</p>';
            return;
        }

        listDiv.innerHTML = equipmentTypes.map(type => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${type.name}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${type.category}</h6>
                        <p class="card-text flex-grow-1">${type.description || 'Sem descrição.'}</p>
                        <button class="btn btn-outline-primary mt-auto view-units-btn" data-type-id="${type.id}">
                            Ver Unidades Disponíveis
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Carrega a view "Minhas Reservas".
 * @param {string} token O token JWT.
 */
async function loadMyReservationsView(token) {
    renderView(`
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Minhas Reservas</h1>
        </div>
        <div id="reservationsList" class="table-responsive"></div>
    `);

    try {
        const reservations = await apiFetch(`${API_URL}/reservations/my-reservations`, token);
        const listDiv = document.getElementById('reservationsList');

        if (reservations.length === 0) {
            listDiv.innerHTML = '<p class="text-muted">Você ainda não fez nenhuma reserva.</p>';
            return;
        }
        
        const tableHtml = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Equipamento</th><th>Código</th><th>Status</th><th>Início</th><th>Fim</th>
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
            </table>`;
        listDiv.innerHTML = tableHtml;
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Carrega a view de gerenciamento de reservas para o admin.
 * @param {string} token O token JWT.
 */
async function loadManageReservationsView(token) {
    renderView(`
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Todas as Reservas</h1>
        </div>
        <div id="adminReservationsList" class="table-responsive"></div>
    `);

    try {
        const reservations = await apiFetch(`${API_URL}/admin/reservations`, token);
        const listDiv = document.getElementById('adminReservationsList');

        if (reservations.length === 0) {
            listDiv.innerHTML = '<p class="text-muted">Nenhuma reserva encontrada no sistema.</p>';
            return;
        }

        const tableHtml = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Usuário</th><th>Equipamento</th><th>Status</th><th>Período</th><th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${reservations.map(res => `
                        <tr id="reservation-row-${res.id}">
                            <td>${res.user.username}</td>
                            <td>${res.equipment_unit.equipment_type.name} (${res.equipment_unit.identifier_code || 'N/A'})</td>
                            <td class="status-cell">${renderStatusBadge(res.status)}</td>
                            <td>${new Date(res.start_time).toLocaleString('pt-BR')} - ${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                            <td class="action-cell">${renderAdminActions(res)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
        listDiv.innerHTML = tableHtml;

    } catch (error) {
        handleApiError(error);
    }
}

// --- Funções dos Modais e Ações ---

/**
 * Manipula a atualização de status de uma reserva pelo admin.
 * @param {HTMLButtonElement} button O botão que foi clicado.
 * @param {string} token O token JWT do admin.
 */
async function handleUpdateReservationStatus(button, token) {
    const reservationId = button.dataset.reservationId;
    const newStatus = button.dataset.action;
    
    // Feedback visual imediato
    const originalButtonHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;

    try {
        const updatedReservation = await apiFetch(`${API_URL}/admin/reservations/${reservationId}`, token, {
            method: 'PATCH',
            body: { status: newStatus }
        });

        // Atualização "cirúrgica" da linha da tabela
        const row = document.getElementById(`reservation-row-${updatedReservation.id}`);
        if (row) {
            row.querySelector('.status-cell').innerHTML = renderStatusBadge(updatedReservation.status);
            row.querySelector('.action-cell').innerHTML = renderAdminActions(updatedReservation);
        }
        showToast('Status da reserva atualizado com sucesso!', 'success');
    } catch (error) {
        showToast(`Erro: ${error.message}`, 'danger');
        // Restaura o botão em caso de erro
        button.disabled = false;
        button.innerHTML = originalButtonHtml;
    }
}


/**
 * Busca e exibe as unidades de um tipo de equipamento em um modal.
 * @param {string} typeId O ID do tipo de equipamento.
 * @param {string} token O token JWT.
 */
async function fetchAndShowUnits(typeId, token) {
    const unitsModal = new bootstrap.Modal(document.getElementById('unitsModal'));
    const modalTitle = document.getElementById('unitsModalLabel');
    const modalBody = document.getElementById('modalUnitList');

    modalTitle.textContent = 'Carregando...';
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    unitsModal.show();

    try {
        const typeWithUnits = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        modalTitle.textContent = `Unidades de ${typeWithUnits.name}`;
        
        if (typeWithUnits.units.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nenhuma unidade cadastrada para este tipo.</p>';
            return;
        }
        
        modalBody.innerHTML = `
            <table class="table table-hover">
                <thead><tr><th>Código</th><th>Status</th><th>Ação</th></tr></thead>
                <tbody>
                    ${typeWithUnits.units.map(unit => {
                        const isAvailable = unit.status === 'available';
                        return `
                        <tr>
                            <td>${unit.identifier_code || 'N/A'}</td>
                            <td><span class="badge ${isAvailable ? 'bg-success' : 'bg-secondary'}">${unit.status}</span></td>
                            <td>
                                ${isAvailable ? `<button class="btn btn-primary btn-sm reserve-btn" data-unit-id="${unit.id}" data-unit-identifier="${unit.identifier_code || `ID ${unit.id}`}">Reservar</button>` : `<button class="btn btn-secondary btn-sm" disabled>Indisponível</button>`}
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>`;
    } catch (error) {
        modalBody.innerHTML = `<p class="text-danger">${error.message}</p>`;
    }
}

/**
 * Manipula o envio do formulário de reserva.
 * @param {string} token O token JWT.
 */
async function handleReservationSubmit(token) {
    const form = document.getElementById('reservationForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('reservationMessage');
    
    const unit_id = document.getElementById('unitIdToReserve').value;
    const start_time = new Date(document.getElementById('startTime').value);
    const end_time = new Date(document.getElementById('endTime').value);

    if (isNaN(start_time) || isNaN(end_time) || start_time >= end_time) {
        messageDiv.innerHTML = '<div class="alert alert-danger">Datas inválidas.</div>';
        return;
    }

    // Feedback visual
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Enviando...`;
    messageDiv.innerHTML = '';

    try {
        await apiFetch(`${API_URL}/reservations/`, token, {
            method: 'POST',
            body: {
                unit_id: parseInt(unit_id),
                start_time: start_time.toISOString(),
                end_time: end_time.toISOString(),
            }
        });
        
        showToast('Reserva solicitada com sucesso!', 'success');
        const reserveModal = bootstrap.Modal.getInstance(document.getElementById('reserveModal'));
        reserveModal.hide();
        form.reset();

    } catch (error) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}


// --- Funções Auxiliares e Utilitários ---

/**
 * Função centralizada para fazer chamadas à API.
 * @param {string} url O endpoint da API.
 * @param {string} token O token JWT.
 * @param {object} options Opções adicionais para o fetch (method, body).
 * @returns {Promise<any>} A resposta JSON da API.
 */
async function apiFetch(url, token, options = {}) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const config = {
        method: options.method || 'GET',
        headers,
        ...options
    };

    if (config.body) {
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || 'Ocorreu um erro na API.');
    }
    return data;
}

/**
 * Lida com erros da API, mostrando-os na view principal.
 * @param {Error} error O objeto de erro.
 */
function handleApiError(error) {
    console.error(error);
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
}

/**
 * Renderiza o conteúdo principal e mostra um spinner.
 * @param {string} initialHtml O HTML inicial para a view.
 */
function renderView(initialHtml) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = initialHtml;
    const listContainer = mainContent.children[1]; // O segundo elemento (div da lista)
    if(listContainer) {
        listContainer.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    }
}

/**
 * Abre o modal de reserva.
 * @param {string} unitId ID da unidade.
 * @param {string} unitIdentifier Identificador da unidade.
 */
function openReserveModal(unitId, unitIdentifier) {
    bootstrap.Modal.getInstance(document.getElementById('unitsModal'))?.hide();
    
    document.getElementById('unitIdToReserve').value = unitId;
    document.getElementById('unitIdentifierText').textContent = unitIdentifier;
    document.getElementById('reservationMessage').innerHTML = '';
    document.getElementById('reservationForm').reset();
    
    const reserveModal = new bootstrap.Modal(document.getElementById('reserveModal'));
    reserveModal.show();
}

/**
 * Gera o HTML para o badge de status de uma reserva.
 * @param {string} status O status da reserva.
 * @returns {string} HTML do badge.
 */
function renderStatusBadge(status) {
    const statusMap = {
        'pending': { text: 'Pendente', badge: 'warning' },
        'approved': { text: 'Aprovada', badge: 'success' },
        'rejected': { text: 'Rejeitada', badge: 'danger' },
        'returned': { text: 'Devolvido', badge: 'secondary' },
    };
    const info = statusMap[status] || { text: status, badge: 'light' };
    return `<span class="badge bg-${info.badge}">${info.text}</span>`;
}

/**
 * Gera o HTML para os botões de ação do admin.
 * @param {object} reservation O objeto da reserva.
 * @returns {string} HTML dos botões.
 */
function renderAdminActions(reservation) {
    if (reservation.status === 'pending') {
        return `
            <button class="btn btn-success btn-sm me-1 admin-action-btn" data-reservation-id="${reservation.id}" data-action="approved" title="Aprovar"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-danger btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="rejected" title="Rejeitar"><i class="bi bi-x-lg"></i></button>
        `;
    }
    if (reservation.status === 'approved') {
        return `<button class="btn btn-info btn-sm text-white admin-action-btn" data-reservation-id="${reservation.id}" data-action="returned" title="Marcar como Devolvido"><i class="bi bi-box-arrow-down"></i></button>`;
    }
    return '---';
}

/** Desloga o usuário. */
async function logout(token = null) {
    if (token) {
        try {
            await apiFetch(`${API_URL}/auth/logout`, token, { method: 'POST' });
        } catch (error) {
            console.error("Falha ao invalidar token no backend:", error);
        }
    }
    localStorage.removeItem('accessToken');
    window.location.href = 'login.html';
}

// --- Sistema de Notificações (Toasts) ---

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '1080';
    document.body.appendChild(container);
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}