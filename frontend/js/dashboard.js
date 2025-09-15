// js/dashboard.js

// Constantes da API
const API_URL = 'http://127.0.0.1:8000';
let currentUserId = null; // Armazenará o ID do usuário logado

// Função principal que é executada quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    initializeApp(token);
    createToastContainer();
});

/**
 * Inicializa a dashboard.
 * @param {string} token O token JWT do usuário.
 */
async function initializeApp(token) {
    const user = await fetchUserData(token);
    if (user) {
        currentUserId = user.id; // Salva o ID do usuário logado
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
    document.body.addEventListener('click', (event) => {
        const target = event.target.closest('a, button');
        if (!target) return;

        // Ações de navegação
        if (target.id === 'nav-equipments') {
            event.preventDefault(); setActiveNav(target); loadEquipmentsView(token);
        } else if (target.id === 'nav-my-reservations') {
            event.preventDefault(); setActiveNav(target); loadMyReservationsView(token);
        } else if (target.id === 'nav-manage-reservations') {
            event.preventDefault(); setActiveNav(target); loadManageReservationsView(token);
        } else if (target.id === 'nav-manage-users') {
            event.preventDefault(); setActiveNav(target); loadManageUsersView(token);
        } else if (target.id === 'nav-manage-inventory') { // NOVO
            event.preventDefault(); setActiveNav(target); loadManageInventoryView(token);
        }
        // Ações da página
        else if (target.id === 'logoutButton') logout(token);
        else if (target.id === 'menu-toggle') document.getElementById('wrapper').classList.toggle('toggled');
        else if (target.matches('.view-units-btn')) fetchAndShowUnits(target.dataset.typeId, token);
        else if (target.matches('.reserve-btn')) openReserveModal(target.dataset.unitId, target.dataset.unitIdentifier);
        else if (target.matches('.admin-action-btn')) {
             event.preventDefault(); handleUpdateReservationStatus(target, token);
        } else if (target.matches('.user-action-btn')) {
            event.preventDefault(); handleUserAction(target, token);
        } else if (target.matches('.inventory-action-btn')) { // NOVO
            event.preventDefault(); handleInventoryAction(target, token);
        }
    });

    document.getElementById('reservationForm').addEventListener('submit', (event) => {
        event.preventDefault(); handleReservationSubmit(token);
    });
    
    // NOVO: Listener para o formulário de tipo de equipamento
    document.getElementById('equipmentTypeForm').addEventListener('submit', (event) => {
        event.preventDefault(); handleEquipmentTypeSubmit(token);
    });
}

/** Define o link de navegação ativo. */
function setActiveNav(element) {
    document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

// --- Funções de Carregamento de Views ---

async function loadEquipmentsView(token) {
    renderView(`
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Tipos de Equipamentos Disponíveis</h1>
        </div>
        <div id="listContainer" class="row"></div>
    `);
    try {
        const equipmentTypes = await apiFetch(`${API_URL}/equipments/types`, token);
        const container = document.getElementById('listContainer');
        if (equipmentTypes.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum equipamento cadastrado.</p>'; return;
        }
        container.innerHTML = equipmentTypes.map(type => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${type.name}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${type.category}</h6>
                        <p class="card-text flex-grow-1">${type.description || 'Sem descrição.'}</p>
                        <button class="btn btn-outline-primary mt-auto view-units-btn" data-type-id="${type.id}">Ver Unidades Disponíveis</button>
                    </div>
                </div>
            </div>`).join('');
    } catch (error) { handleApiError(error); }
}

async function loadMyReservationsView(token) {
    renderView(`
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Minhas Reservas</h1>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const reservations = await apiFetch(`${API_URL}/reservations/my-reservations`, token);
        const container = document.getElementById('listContainer');
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted">Você ainda não fez nenhuma reserva.</p>'; return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark"><tr><th>Equipamento</th><th>Código</th><th>Status</th><th>Início</th><th>Fim</th></tr></thead>
                <tbody>${reservations.map(res => `
                    <tr>
                        <td>${res.equipment_unit.equipment_type.name}</td>
                        <td>${res.equipment_unit.identifier_code || 'N/A'}</td>
                        <td>${renderStatusBadge(res.status)}</td>
                        <td>${new Date(res.start_time).toLocaleString('pt-BR')}</td>
                        <td>${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    } catch (error) { handleApiError(error); }
}

async function loadManageReservationsView(token) {
    renderView(`
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Todas as Reservas</h1>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const reservations = await apiFetch(`${API_URL}/admin/reservations`, token);
        const container = document.getElementById('listContainer');
        if (reservations.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma reserva encontrada no sistema.</p>'; return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark"><tr><th>Usuário</th><th>Equipamento</th><th>Status</th><th>Período</th><th>Ações</th></tr></thead>
                <tbody>${reservations.map(res => `
                    <tr id="reservation-row-${res.id}">
                        <td>${res.user.username}</td>
                        <td>${res.equipment_unit.equipment_type.name} (${res.equipment_unit.identifier_code || 'N/A'})</td>
                        <td class="status-cell">${renderStatusBadge(res.status)}</td>
                        <td>${new Date(res.start_time).toLocaleString('pt-BR')} - ${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                        <td class="action-cell">${renderAdminActions(res)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    } catch (error) { handleApiError(error); }
}

async function loadManageUsersView(token) {
    renderView(`
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Usuários</h1>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const users = await apiFetch(`${API_URL}/admin/users`, token);
        const container = document.getElementById('listContainer');
        if (users.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum usuário encontrado.</p>'; return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark"><tr><th>ID</th><th>Username</th><th>Email</th><th>Permissão</th><th>Ações</th></tr></thead>
                <tbody>${users.map(user => `
                    <tr id="user-row-${user.id}">
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td class="role-cell">${renderRoleBadge(user.role)}</td>
                        <td class="action-cell">${renderUserActions(user)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    } catch (error) { handleApiError(error); }
}

/**
 * --- NOVA FUNÇÃO ---
 * Carrega a view de gerenciamento de inventário (tipos de equipamento).
 * @param {string} token O token JWT.
 */
async function loadManageInventoryView(token) {
    renderView(`
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Tipos de Equipamento</h1>
            <button class="btn btn-primary inventory-action-btn" data-action="create-type">
                <i class="bi bi-plus-circle me-2"></i> Adicionar Novo Tipo
            </button>
        </div>
        <div id="listContainer" class="table-responsive"></div>
    `);
    try {
        const equipmentTypes = await apiFetch(`${API_URL}/equipments/types`, token);
        const container = document.getElementById('listContainer');
        if (equipmentTypes.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum tipo de equipamento cadastrado.</p>'; return;
        }
        container.innerHTML = `
            <table class="table table-striped table-hover">
                <thead class="table-dark"><tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Ações</th></tr></thead>
                <tbody id="inventory-table-body">${equipmentTypes.map(type => renderInventoryRow(type)).join('')}</tbody>
            </table>`;
    } catch (error) { handleApiError(error); }
}

// --- Funções de Ações e Modais ---

async function handleUpdateReservationStatus(button, token) {
    const reservationId = button.dataset.reservationId;
    const newStatus = button.dataset.action;
    
    setButtonLoading(button, true);
    try {
        const updatedReservation = await apiFetch(`${API_URL}/admin/reservations/${reservationId}`, token, { method: 'PATCH', body: { status: newStatus } });
        const row = document.getElementById(`reservation-row-${updatedReservation.id}`);
        if (row) {
            row.querySelector('.status-cell').innerHTML = renderStatusBadge(updatedReservation.status);
            row.querySelector('.action-cell').innerHTML = renderAdminActions(updatedReservation);
        }
        showToast('Status da reserva atualizado!', 'success');
    } catch (error) {
        showToast(`Erro: ${error.message}`, 'danger');
        setButtonLoading(button, false);
    }
}

async function handleUserAction(button, token) {
    const userId = button.dataset.userId;
    const action = button.dataset.action;

    if (action === 'delete' && !confirm(`Tem certeza de que deseja excluir o usuário ID ${userId}?`)) return;

    setButtonLoading(button, true);
    try {
        if (action === 'toggle-role') {
            const newRole = button.dataset.currentRole === 'admin' ? 'user' : 'admin';
            const updatedUser = await apiFetch(`${API_URL}/admin/users/${userId}/role`, token, { method: 'PATCH', body: { role: newRole } });
            const row = document.getElementById(`user-row-${updatedUser.id}`);
            if (row) {
                row.querySelector('.role-cell').innerHTML = renderRoleBadge(updatedUser.role);
                row.querySelector('.action-cell').innerHTML = renderUserActions(updatedUser);
            }
            showToast('Permissão alterada!', 'success');
        } else if (action === 'delete') {
            await apiFetch(`${API_URL}/admin/users/${userId}`, token, { method: 'DELETE' });
            document.getElementById(`user-row-${userId}`).remove();
            showToast('Usuário excluído!', 'success');
        }
    } catch (error) {
        showToast(`Erro: ${error.message}`, 'danger');
        setButtonLoading(button, false);
    }
}

/**
 * --- NOVA FUNÇÃO ---
 * Manipula ações de inventário (CRUD de tipos de equipamento).
 * @param {HTMLButtonElement} button O botão clicado.
 * @param {string} token O token JWT do admin.
 */
async function handleInventoryAction(button, token) {
    const action = button.dataset.action;
    const typeId = button.dataset.typeId;

    if (action === 'create-type') {
        openEquipmentTypeModal();
    } else if (action === 'edit-type') {
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        openEquipmentTypeModal(type);
    } else if (action === 'delete-type') {
        if (!confirm(`Tem certeza de que deseja excluir este tipo de equipamento? Todas as suas unidades e reservas associadas também serão excluídas.`)) return;

        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/types/${typeId}`, token, { method: 'DELETE' });
            document.getElementById(`inventory-row-${typeId}`).remove();
            showToast('Tipo de equipamento excluído!', 'success');
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'danger');
            setButtonLoading(button, false);
        }
    }
}

async function fetchAndShowUnits(typeId, token) {
    const unitsModal = new bootstrap.Modal(document.getElementById('unitsModal'));
    const modalTitle = document.getElementById('unitsModalLabel');
    const modalBody = document.getElementById('modalUnitList');
    modalTitle.textContent = 'Carregando...';
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    unitsModal.show();
    try {
        const typeWithUnits = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        modalTitle.textContent = `Unidades de ${typeWithUnits.name}`;
        if (typeWithUnits.units.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nenhuma unidade cadastrada.</p>'; return;
        }
        modalBody.innerHTML = `
            <table class="table table-hover">
                <thead><tr><th>Código</th><th>Status</th><th>Ação</th></tr></thead>
                <tbody>${typeWithUnits.units.map(unit => {
                    const isAvailable = unit.status === 'available';
                    return `<tr>
                        <td>${unit.identifier_code || 'N/A'}</td>
                        <td><span class="badge ${isAvailable ? 'bg-success' : 'bg-secondary'}">${unit.status}</span></td>
                        <td>${isAvailable ? `<button class="btn btn-primary btn-sm reserve-btn" data-unit-id="${unit.id}" data-unit-identifier="${unit.identifier_code || `ID ${unit.id}`}">Reservar</button>` : `<button class="btn btn-secondary btn-sm" disabled>Indisponível</button>`}</td>
                    </tr>`; }).join('')}
                </tbody>
            </table>`;
    } catch (error) { modalBody.innerHTML = `<p class="text-danger">${error.message}</p>`; }
}

async function handleReservationSubmit(token) {
    const form = document.getElementById('reservationForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('reservationMessage');
    const unit_id = document.getElementById('unitIdToReserve').value;
    const start_time = new Date(document.getElementById('startTime').value);
    const end_time = new Date(document.getElementById('endTime').value);
    if (isNaN(start_time) || isNaN(end_time) || start_time >= end_time) {
        messageDiv.innerHTML = '<div class="alert alert-danger">Datas inválidas.</div>'; return;
    }
    setButtonLoading(submitButton, true, 'Enviando...');
    messageDiv.innerHTML = '';
    try {
        await apiFetch(`${API_URL}/reservations/`, token, {
            method: 'POST',
            body: { unit_id: parseInt(unit_id), start_time: start_time.toISOString(), end_time: end_time.toISOString() }
        });
        showToast('Reserva solicitada com sucesso!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('reserveModal')).hide();
        form.reset();
    } catch (error) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    } finally { setButtonLoading(submitButton, false); }
}

/**
 * --- NOVA FUNÇÃO ---
 * Manipula o envio do formulário de criar/editar tipo de equipamento.
 * @param {string} token O token JWT.
 */
async function handleEquipmentTypeSubmit(token) {
    const form = document.getElementById('equipmentTypeForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('equipmentTypeMessage');
    const typeId = document.getElementById('equipmentTypeId').value;

    const typeData = {
        name: document.getElementById('typeName').value,
        category: document.getElementById('typeCategory').value,
        description: document.getElementById('typeDescription').value,
    };

    setButtonLoading(submitButton, true, 'Salvando...');
    messageDiv.innerHTML = '';

    try {
        const method = typeId ? 'PUT' : 'POST';
        const url = typeId ? `${API_URL}/equipments/types/${typeId}` : `${API_URL}/equipments/types`;
        
        const savedType = await apiFetch(url, token, { method, body: typeData });

        const tableBody = document.getElementById('inventory-table-body');
        const newRowHtml = renderInventoryRow(savedType);

        if (typeId) { // Editando
            document.getElementById(`inventory-row-${typeId}`).outerHTML = newRowHtml;
        } else { // Criando
            tableBody.insertAdjacentHTML('beforeend', newRowHtml);
        }

        showToast(`Tipo de equipamento ${typeId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('equipmentTypeModal')).hide();

    } catch (error) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// --- Funções Auxiliares e Utilitários ---

async function apiFetch(url, token, options = {}) {
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const config = { method: options.method || 'GET', headers, ...options };
    if (config.body) config.body = JSON.stringify(config.body);
    const response = await fetch(url, config);
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Erro na API.');
    return data;
}

function handleApiError(error) {
    console.error(error);
    document.getElementById('main-content').innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
}

function renderView(initialHtml) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = initialHtml;
    const listContainer = document.getElementById('listContainer');
    if (listContainer) {
        listContainer.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';
    }
}

function openReserveModal(unitId, unitIdentifier) {
    bootstrap.Modal.getInstance(document.getElementById('unitsModal'))?.hide();
    document.getElementById('unitIdToReserve').value = unitId;
    document.getElementById('unitIdentifierText').textContent = unitIdentifier;
    document.getElementById('reservationMessage').innerHTML = '';
    document.getElementById('reservationForm').reset();
    new bootstrap.Modal(document.getElementById('reserveModal')).show();
}

/**
 * --- NOVA FUNÇÃO ---
 * Abre o modal para criar ou editar um tipo de equipamento.
 * @param {object|null} type O objeto do tipo de equipamento para edição, ou null para criação.
 */
function openEquipmentTypeModal(type = null) {
    const modal = new bootstrap.Modal(document.getElementById('equipmentTypeModal'));
    const form = document.getElementById('equipmentTypeForm');
    const modalLabel = document.getElementById('equipmentTypeModalLabel');

    form.reset();
    document.getElementById('equipmentTypeMessage').innerHTML = '';

    if (type) { // Modo de edição
        modalLabel.textContent = 'Editar Tipo de Equipamento';
        document.getElementById('equipmentTypeId').value = type.id;
        document.getElementById('typeName').value = type.name;
        document.getElementById('typeCategory').value = type.category;
        document.getElementById('typeDescription').value = type.description || '';
    } else { // Modo de criação
        modalLabel.textContent = 'Adicionar Novo Tipo';
        document.getElementById('equipmentTypeId').value = '';
    }
    modal.show();
}

function renderStatusBadge(status) {
    const map = { 'pending': 'warning', 'approved': 'success', 'rejected': 'danger', 'returned': 'secondary' };
    const text = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="badge bg-${map[status] || 'light'}">${text}</span>`;
}

function renderAdminActions(reservation) {
    if (reservation.status === 'pending') return `<button class="btn btn-success btn-sm me-1 admin-action-btn" data-reservation-id="${reservation.id}" data-action="approved" title="Aprovar"><i class="bi bi-check-lg"></i></button><button class="btn btn-danger btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="rejected" title="Rejeitar"><i class="bi bi-x-lg"></i></button>`;
    if (reservation.status === 'approved') return `<button class="btn btn-info btn-sm text-white admin-action-btn" data-reservation-id="${reservation.id}" data-action="returned" title="Marcar como Devolvido"><i class="bi bi-box-arrow-down"></i></button>`;
    return '---';
}

function renderRoleBadge(role) {
    const map = { 'admin': 'primary', 'user': 'secondary' };
    const text = role.charAt(0).toUpperCase() + role.slice(1);
    return `<span class="badge bg-${map[role] || 'light'}">${text}</span>`;
}

function renderUserActions(user) {
    const isCurrentUser = user.id === currentUserId;
    const toggleRoleText = user.role === 'admin' ? 'Tornar Usuário' : 'Tornar Admin';
    const toggleRoleIcon = user.role === 'admin' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle';
    const toggleButton = `<button class="btn btn-warning btn-sm me-1 user-action-btn" data-user-id="${user.id}" data-action="toggle-role" data-current-role="${user.role}" title="${toggleRoleText}" ${isCurrentUser ? 'disabled' : ''}><i class="bi ${toggleRoleIcon}"></i></button>`;
    const deleteButton = `<button class="btn btn-danger btn-sm user-action-btn" data-user-id="${user.id}" data-action="delete" title="Excluir Usuário" ${isCurrentUser ? 'disabled' : ''}><i class="bi bi-trash"></i></button>`;
    return `${toggleButton}${deleteButton}`;
}

/**
 * --- NOVA FUNÇÃO ---
 * Renderiza uma linha da tabela de inventário.
 * @param {object} type O objeto do tipo de equipamento.
 * @returns {string} O HTML da linha <tr>.
 */
function renderInventoryRow(type) {
    return `
        <tr id="inventory-row-${type.id}">
            <td>${type.id}</td>
            <td>${type.name}</td>
            <td>${type.category}</td>
            <td>
                <button class="btn btn-info btn-sm me-1 text-white inventory-action-btn" data-action="view-units" data-type-id="${type.id}" title="Gerenciar Unidades"><i class="bi bi-hdd-stack"></i></button>
                <button class="btn btn-secondary btn-sm me-1 inventory-action-btn" data-action="edit-type" data-type-id="${type.id}" title="Editar Tipo"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-danger btn-sm inventory-action-btn" data-action="delete-type" data-type-id="${type.id}" title="Excluir Tipo"><i class="bi bi-trash"></i></button>
            </td>
        </tr>`;
}

/**
 * --- NOVA FUNÇÃO ---
 * Controla o estado de loading de um botão.
 * @param {HTMLButtonElement} button O elemento do botão.
 * @param {boolean} isLoading Se deve mostrar o spinner.
 * @param {string|null} loadingText Texto opcional para mostrar durante o loading.
 */
function setButtonLoading(button, isLoading, loadingText = null) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        const text = loadingText ? `<span class="ms-2">${loadingText}</span>` : '';
        button.innerHTML = `<span class="spinner-border spinner-border-sm"></span>${text}`;
    } else {
        button.disabled = false;
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }
}

async function logout(token = null) {
    if (token) {
        try { await apiFetch(`${API_URL}/auth/logout`, token, { method: 'POST' }); }
        catch (error) { console.error("Falha ao invalidar token:", error); }
    }
    localStorage.removeItem('accessToken');
    window.location.href = 'login.html';
}

function createToastContainer() {
    if (document.getElementById('toast-container')) return;
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
    toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}