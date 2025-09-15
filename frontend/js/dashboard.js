// js/dashboard.js

const API_URL = 'http://127.0.0.1:8000';
let currentUserId = null;
let currentUser = null; // Armazenará o objeto completo do usuário logado

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { window.location.href = 'login.html'; return; }
    initializeApp(token);
    createToastContainer();
});

async function initializeApp(token) {
    const user = await fetchUserData(token);
    if (user) {
        currentUserId = user.id;
        currentUser = user; // Salva o objeto completo do usuário
        document.getElementById('user-greeting').textContent = `Olá, ${user.username}!`;
        if (user.role === 'admin') {
            document.getElementById('admin-menu').classList.remove('d-none');
        }
    }
    loadEquipmentsView(token);
    setupEventListeners(token);
}

async function fetchUserData(token) {
    try {
        const response = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao buscar dados do usuário.');
        return await response.json();
    } catch (error) {
        console.error(error);
        logout();
        return null;
    }
}

function setupEventListeners(token) {
    document.body.addEventListener('click', (event) => {
        const target = event.target.closest('a, button');
        if (!target) return;

        const navActions = {
            'nav-equipments': () => loadEquipmentsView(token),
            'nav-my-reservations': () => loadMyReservationsView(token),
            'nav-my-account': () => loadMyAccountView(token), // NOVO
            'nav-manage-reservations': () => loadManageReservationsView(token),
            'nav-manage-users': () => loadManageUsersView(token),
            'nav-manage-inventory': () => loadManageInventoryView(token)
        };
        if (navActions[target.id]) {
            event.preventDefault(); setActiveNav(target); navActions[target.id]();
        }
        
        const pageActions = {
            'logoutButton': () => logout(token),
            'menu-toggle': () => document.getElementById('wrapper').classList.toggle('toggled'),
            '.view-units-btn': () => fetchAndShowUnits(target.dataset.typeId, token),
            '.reserve-btn': () => openReserveModal(target.dataset.unitId, target.dataset.unitIdentifier),
            '.admin-action-btn': () => { event.preventDefault(); handleUpdateReservationStatus(target, token); },
            '.user-action-btn': () => { event.preventDefault(); handleUserAction(target, token); },
            '.inventory-action-btn': () => { event.preventDefault(); handleInventoryAction(target, token); },
            '.unit-action-btn': () => { event.preventDefault(); handleUnitAction(target, token); },
            '#cancelEditUnitBtn': () => { event.preventDefault(); resetUnitForm(); },
            '#connectGoogleBtn': () => { event.preventDefault(); handleGoogleConnect(target, token); }, // NOVO
            '#deleteAccountBtn': () => { event.preventDefault(); handleDeleteAccount(target, token); } // NOVO
        };

        for (const selector in pageActions) {
            if (target.matches(selector) || target.id === selector.substring(1)) {
                pageActions[selector]();
                return; // Evita múltiplas ações
            }
        }
    });

    // Listeners de Formulário centralizados
    document.body.addEventListener('submit', (event) => {
        if (event.target.id === 'reservationForm') {
            event.preventDefault(); handleReservationSubmit(token);
        } else if (event.target.id === 'equipmentTypeForm') {
            event.preventDefault(); handleEquipmentTypeSubmit(token);
        } else if (event.target.id === 'unitForm') {
            event.preventDefault(); handleUnitFormSubmit(token);
        } else if (event.target.id === 'updateProfileForm') { // NOVO
            event.preventDefault(); handleUpdateProfile(token);
        }
    });
}

function setActiveNav(element) {
    document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

// --- Funções de Carregamento de Views ---

async function loadEquipmentsView(token) {
    renderView(`<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom"><h1 class="h2">Equipamentos Disponíveis</h1></div><div id="listContainer" class="row"></div>`);
    try {
        const types = await apiFetch(`${API_URL}/equipments/types`, token);
        const container = document.getElementById('listContainer');
        if (types.length === 0) { container.innerHTML = '<p class="text-muted">Nenhum equipamento cadastrado.</p>'; return; }
        container.innerHTML = types.map(type => `
            <div class="col-md-6 col-lg-4 mb-4"><div class="card h-100"><div class="card-body d-flex flex-column">
                <h5 class="card-title">${type.name}</h5><h6 class="card-subtitle mb-2 text-muted">${type.category}</h6>
                <p class="card-text flex-grow-1">${type.description || 'Sem descrição.'}</p>
                <button class="btn btn-outline-primary mt-auto view-units-btn" data-type-id="${type.id}">Ver Unidades</button>
            </div></div></div>`).join('');
    } catch (e) { handleApiError(e); }
}

async function loadMyReservationsView(token) {
    renderView(`<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom"><h1 class="h2">Minhas Reservas</h1></div><div id="listContainer" class="table-responsive"></div>`);
    try {
        const reservations = await apiFetch(`${API_URL}/reservations/my-reservations`, token);
        const container = document.getElementById('listContainer');
        if (reservations.length === 0) { container.innerHTML = '<p class="text-muted">Você não fez nenhuma reserva.</p>'; return; }
        container.innerHTML = `<table class="table table-striped table-hover"><thead class="table-dark"><tr><th>Equipamento</th><th>Código</th><th>Status</th><th>Início</th><th>Fim</th></tr></thead><tbody>${reservations.map(res => `
            <tr><td>${res.equipment_unit.equipment_type.name}</td><td>${res.equipment_unit.identifier_code||'N/A'}</td><td>${renderStatusBadge(res.status)}</td><td>${new Date(res.start_time).toLocaleString('pt-BR')}</td><td>${new Date(res.end_time).toLocaleString('pt-BR')}</td></tr>`).join('')}</tbody></table>`;
    } catch (e) { handleApiError(e); }
}

/**
 * --- NOVA VIEW ---
 * Carrega a página de gerenciamento de conta do usuário.
 */
function loadMyAccountView(token) {
    // CORREÇÃO APLICADA AQUI: Injeta o HTML diretamente sem usar a renderView para evitar o spinner infinito.
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


// --- Funções de Ações e Modais ---

/**
 * --- NOVA FUNÇÃO ---
 * Lida com a atualização do perfil do usuário.
 * @param {string} token O token JWT.
 */
async function handleUpdateProfile(token) {
    const form = document.getElementById('updateProfileForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const newUsername = document.getElementById('profileUsername').value;

    if (newUsername === currentUser.username) {
        showToast('Nenhuma alteração para salvar.', 'info');
        return;
    }
    
    setButtonLoading(submitButton, true, 'Salvando...');
    try {
        const updatedUser = await apiFetch(`${API_URL}/users/me`, token, {
            method: 'PUT',
            body: { username: newUsername }
        });
        
        // Atualiza os dados locais
        currentUser = updatedUser;
        document.getElementById('user-greeting').textContent = `Olá, ${updatedUser.username}!`;
        
        showToast('Nome de usuário atualizado com sucesso!', 'success');

    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
        // Reverte o campo para o valor original em caso de erro
        document.getElementById('profileUsername').value = currentUser.username;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * --- NOVA FUNÇÃO ---
 * Inicia o fluxo de conexão com a conta Google.
 * @param {HTMLButtonElement} button O botão clicado.
 * @param {string} token O token JWT.
 */
async function handleGoogleConnect(button, token) {
    setButtonLoading(button, true);
    try {
        const response = await apiFetch(`${API_URL}/google/login`, token);
        // Abre a URL de autorização em uma nova aba
        window.open(response.authorization_url, '_blank');
        showToast('Abra a nova aba para autorizar o acesso à sua conta Google.', 'info');
    } catch (e) {
        showToast(`Erro ao iniciar conexão: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * --- NOVA FUNÇÃO ---
 * Lida com a exclusão da conta do próprio usuário.
 * @param {HTMLButtonElement} button O botão clicado.
 * @param {string} token O token JWT.
 */
async function handleDeleteAccount(button, token) {
    const confirmation = prompt('Esta ação é irreversível. Para confirmar, digite "excluir minha conta":');
    if (confirmation !== 'excluir minha conta') {
        showToast('Ação cancelada.', 'info');
        return;
    }

    setButtonLoading(button, true);
    try {
        await apiFetch(`${API_URL}/users/me`, token, { method: 'DELETE' });
        showToast('Sua conta foi excluída. Você será desconectado.', 'success');
        
        setTimeout(() => {
            logout(); // Desloga sem chamar a API, pois o usuário não existe mais
        }, 3000);

    } catch (e) {
        showToast(`Erro ao excluir conta: ${e.message}`, 'danger');
        setButtonLoading(button, false);
    }
}


// --- Funções das Views de Admin (Sem alterações, apenas omitidas por brevidade) ---
async function loadManageReservationsView(token) {
    renderView(`<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom"><h1 class="h2">Gerenciar Reservas</h1></div><div id="listContainer" class="table-responsive"></div>`);
    try {
        const reservations = await apiFetch(`${API_URL}/admin/reservations`, token);
        const container = document.getElementById('listContainer');
        if (reservations.length === 0) { container.innerHTML = '<p class="text-muted">Nenhuma reserva no sistema.</p>'; return; }
        container.innerHTML = `<table class="table table-striped table-hover"><thead class="table-dark"><tr><th>Usuário</th><th>Equipamento</th><th>Status</th><th>Período</th><th>Ações</th></tr></thead><tbody>${reservations.map(res => `
            <tr id="reservation-row-${res.id}"><td data-label="Usuário">${res.user.username}</td><td data-label="Equipamento">${res.equipment_unit.equipment_type.name} (${res.equipment_unit.identifier_code||'N/A'})</td><td class="status-cell" data-label="Status">${renderStatusBadge(res.status)}</td><td data-label="Período">${new Date(res.start_time).toLocaleString('pt-BR')} - ${new Date(res.end_time).toLocaleString('pt-BR')}</td><td class="action-cell" data-label="Ações">${renderAdminActions(res)}</td></tr>`).join('')}</tbody></table>`;
    } catch (e) { handleApiError(e); }
}
async function loadManageUsersView(token) {
    renderView(`<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom"><h1 class="h2">Gerenciar Usuários</h1></div><div id="listContainer" class="table-responsive"></div>`);
    try {
        const users = await apiFetch(`${API_URL}/admin/users`, token);
        const container = document.getElementById('listContainer');
        if (users.length === 0) { container.innerHTML = '<p class="text-muted">Nenhum usuário encontrado.</p>'; return; }
        container.innerHTML = `<table class="table table-striped table-hover"><thead class="table-dark"><tr><th>ID</th><th>Username</th><th>Email</th><th>Permissão</th><th>Ações</th></tr></thead><tbody>${users.map(user => `
            <tr id="user-row-${user.id}"><td>${user.id}</td><td>${user.username}</td><td>${user.email}</td><td class="role-cell">${renderRoleBadge(user.role)}</td><td class="action-cell">${renderUserActions(user)}</td></tr>`).join('')}</tbody></table>`;
    } catch (e) { handleApiError(e); }
}
async function loadManageInventoryView(token) {
    renderView(`<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom"><h1 class="h2">Gerenciar Tipos de Equipamento</h1><button class="btn btn-primary inventory-action-btn" data-action="create-type"><i class="bi bi-plus-circle me-2"></i>Adicionar Tipo</button></div><div id="listContainer" class="table-responsive"></div>`);
    try {
        const types = await apiFetch(`${API_URL}/equipments/types`, token);
        const container = document.getElementById('listContainer');
        if (types.length === 0) { container.innerHTML = '<p class="text-muted">Nenhum tipo de equipamento cadastrado.</p>'; return; }
        container.innerHTML = `<table class="table table-striped table-hover"><thead class="table-dark"><tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Ações</th></tr></thead><tbody id="inventory-table-body">${types.map(type => renderInventoryRow(type)).join('')}</tbody></table>`;
    } catch (e) { handleApiError(e); }
}
async function handleUpdateReservationStatus(button, token) {
    const { reservationId, action } = button.dataset;
    setButtonLoading(button, true);
    try {
        const updated = await apiFetch(`${API_URL}/admin/reservations/${reservationId}`, token, { method: 'PATCH', body: { status: action } });
        const row = document.getElementById(`reservation-row-${updated.id}`);
        if (row) {
            row.querySelector('.status-cell').innerHTML = renderStatusBadge(updated.status);
            row.querySelector('.action-cell').innerHTML = renderAdminActions(updated);
        }
        showToast('Status da reserva atualizado!', 'success');
    } catch (e) { showToast(`Erro: ${e.message}`, 'danger'); setButtonLoading(button, false); }
}
async function handleUserAction(button, token) {
    const { userId, action, currentRole } = button.dataset;
    if (action === 'delete' && !confirm(`Tem certeza que deseja excluir o usuário ID ${userId}?`)) return;
    setButtonLoading(button, true);
    try {
        if (action === 'toggle-role') {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            const updated = await apiFetch(`${API_URL}/admin/users/${userId}/role`, token, { method: 'PATCH', body: { role: newRole } });
            const row = document.getElementById(`user-row-${updated.id}`);
            if (row) {
                row.querySelector('.role-cell').innerHTML = renderRoleBadge(updated.role);
                row.querySelector('.action-cell').innerHTML = renderUserActions(updated);
            }
            showToast('Permissão alterada!', 'success');
        } else if (action === 'delete') {
            await apiFetch(`${API_URL}/admin/users/${userId}`, token, { method: 'DELETE' });
            document.getElementById(`user-row-${userId}`).remove();
            showToast('Usuário excluído!', 'success');
        }
    } catch (e) { showToast(`Erro: ${e.message}`, 'danger'); setButtonLoading(button, false); }
}
async function handleInventoryAction(button, token) {
    const { action, typeId } = button.dataset;
    if (action === 'create-type') openEquipmentTypeModal();
    else if (action === 'edit-type') {
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        openEquipmentTypeModal(type);
    } else if (action === 'view-units') {
        openManageUnitsModal(typeId, token);
    } else if (action === 'delete-type') {
        if (!confirm('Deseja excluir este tipo? Todas as unidades e reservas associadas serão perdidas.')) return;
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/types/${typeId}`, token, { method: 'DELETE' });
            document.getElementById(`inventory-row-${typeId}`).remove();
            showToast('Tipo de equipamento excluído!', 'success');
        } catch (e) { showToast(`Erro: ${e.message}`, 'danger'); setButtonLoading(button, false); }
    }
}
async function fetchAndShowUnits(typeId, token) {
    const modal = new bootstrap.Modal(document.getElementById('unitsModal'));
    const modalTitle = document.getElementById('unitsModalLabel');
    const modalBody = document.getElementById('modalUnitList');
    modalTitle.textContent = 'Carregando...';
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    modal.show();
    try {
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        modalTitle.textContent = `Unidades de ${type.name}`;
        if (type.units.length === 0) { modalBody.innerHTML = '<p class="text-muted">Nenhuma unidade cadastrada.</p>'; return; }
        modalBody.innerHTML = `<table class="table table-hover"><thead><tr><th>Código</th><th>Status</th><th>Ação</th></tr></thead><tbody>${type.units.map(unit => {
            const isAvailable = unit.status === 'available';
            return `<tr><td>${unit.identifier_code||'N/A'}</td><td>${renderStatusBadge(unit.status)}</td><td>${isAvailable ? `<button class="btn btn-primary btn-sm reserve-btn" data-unit-id="${unit.id}" data-unit-identifier="${unit.identifier_code||`ID ${unit.id}`}">Reservar</button>` : `<button class="btn btn-secondary btn-sm" disabled>Indisponível</button>`}</td></tr>`;
        }).join('')}</tbody></table>`;
    } catch (e) { modalBody.innerHTML = `<p class="text-danger">${e.message}</p>`; }
}
async function handleReservationSubmit(token) {
    const form = document.getElementById('reservationForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('reservationMessage');
    const unit_id = form.unitIdToReserve.value;
    const start_time = new Date(form.startTime.value);
    const end_time = new Date(form.endTime.value);
    if (isNaN(start_time) || isNaN(end_time) || start_time >= end_time) {
        messageDiv.innerHTML = '<div class="alert alert-danger">Datas inválidas.</div>'; return;
    }
    setButtonLoading(submitButton, true, 'Enviando...');
    messageDiv.innerHTML = '';
    try {
        await apiFetch(`${API_URL}/reservations/`, token, { method: 'POST', body: { unit_id: parseInt(unit_id), start_time: start_time.toISOString(), end_time: end_time.toISOString() } });
        showToast('Reserva solicitada!', 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        form.reset();
    } catch (e) { messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally { setButtonLoading(submitButton, false); }
}
async function handleEquipmentTypeSubmit(token) {
    const form = document.getElementById('equipmentTypeForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('equipmentTypeMessage');
    const typeId = form.equipmentTypeId.value;
    const typeData = { name: form.typeName.value, category: form.typeCategory.value, description: form.typeDescription.value };
    setButtonLoading(submitButton, true, 'Salvando...');
    messageDiv.innerHTML = '';
    try {
        const method = typeId ? 'PUT' : 'POST';
        const url = typeId ? `${API_URL}/equipments/types/${typeId}` : `${API_URL}/equipments/types`;
        const savedType = await apiFetch(url, token, { method, body: typeData });
        const newRowHtml = renderInventoryRow(savedType);
        if (typeId) {
            document.getElementById(`inventory-row-${typeId}`).outerHTML = newRowHtml;
        } else {
            document.getElementById('inventory-table-body').insertAdjacentHTML('beforeend', newRowHtml);
        }
        showToast(`Tipo ${typeId ? 'atualizado' : 'criado'}!`, 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
    } catch (e) { messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally { setButtonLoading(submitButton, false); }
}
function renderInventoryRow(type) {
    return `<tr id="inventory-row-${type.id}"><td>${type.id}</td><td>${type.name}</td><td>${type.category}</td><td><button class="btn btn-info btn-sm me-1 text-white inventory-action-btn" data-action="view-units" data-type-id="${type.id}" title="Gerenciar Unidades"><i class="bi bi-hdd-stack"></i></button><button class="btn btn-secondary btn-sm me-1 inventory-action-btn" data-action="edit-type" data-type-id="${type.id}" title="Editar Tipo"><i class="bi bi-pencil"></i></button><button class="btn btn-danger btn-sm inventory-action-btn" data-action="delete-type" data-type-id="${type.id}" title="Excluir Tipo"><i class="bi bi-trash"></i></button></td></tr>`;
}
async function openManageUnitsModal(typeId, token) {
    const modal = new bootstrap.Modal(document.getElementById('manageUnitsModal'));
    const modalLabel = document.getElementById('manageUnitsModalLabel');
    const tableBody = document.getElementById('unitsTableBody');
    resetUnitForm();
    document.getElementById('unitFormTypeId').value = typeId;
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border"></div></td></tr>';
    modal.show();
    try {
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        modalLabel.textContent = `Gerenciar Unidades de: ${type.name}`;
        populateUnitsTable(type.units);
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${e.message}</td></tr>`;
    }
}
function populateUnitsTable(units) {
    const tableBody = document.getElementById('unitsTableBody');
    if (units.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhuma unidade cadastrada.</td></tr>';
        return;
    }
    tableBody.innerHTML = units.map(unit => `
        <tr id="unit-row-${unit.id}">
            <td>${unit.id}</td>
            <td>${unit.identifier_code || 'N/A'}</td>
            <td>${renderStatusBadge(unit.status)}</td>
            <td>
                <button class="btn btn-secondary btn-sm me-1 unit-action-btn" data-action="edit" data-unit-id="${unit.id}" title="Editar Unidade" ${unit.status === 'reserved' ? 'disabled' : ''}><i class="bi bi-pencil"></i></button>
                <button class="btn btn-danger btn-sm unit-action-btn" data-action="delete" data-unit-id="${unit.id}" title="Excluir Unidade" ${unit.status === 'reserved' ? 'disabled' : ''}><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}
async function handleUnitFormSubmit(token) {
    const form = document.getElementById('unitForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('unitFormMessage');
    const typeId = form.unitFormTypeId.value;
    const unitId = form.unitFormUnitId.value;
    const unitData = {
        type_id: parseInt(typeId),
        identifier_code: form.unitIdentifier.value || null,
        status: form.unitStatus.value
    };
    setButtonLoading(submitButton, true, 'Salvando...');
    messageDiv.innerHTML = '';
    try {
        const method = unitId ? 'PUT' : 'POST';
        const url = unitId ? `${API_URL}/equipments/units/${unitId}` : `${API_URL}/equipments/units`;
        await apiFetch(url, token, { method, body: unitData });
        showToast(`Unidade ${unitId ? 'atualizada' : 'criada'}!`, 'success');
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        populateUnitsTable(type.units);
        resetUnitForm();
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}
async function handleUnitAction(button, token) {
    const { action, unitId } = button.dataset;
    if (action === 'edit') {
        const unitToEdit = {
            id: unitId,
            identifier_code: document.querySelector(`#unit-row-${unitId} td:nth-child(2)`).textContent,
            status: document.querySelector(`#unit-row-${unitId} .badge`).textContent.toLowerCase(),
        };
        prepareUnitFormForEdit(unitToEdit);
    } else if (action === 'delete') {
        if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/units/${unitId}`, token, { method: 'DELETE' });
            document.getElementById(`unit-row-${unitId}`).remove();
            showToast('Unidade excluída!', 'success');
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'danger');
            setButtonLoading(button, false);
        }
    }
}
function prepareUnitFormForEdit(unit) {
    document.getElementById('unitFormTitle').textContent = `Editar Unidade ID: ${unit.id}`;
    document.getElementById('unitFormUnitId').value = unit.id;
    document.getElementById('unitIdentifier').value = unit.identifier_code !== 'N/A' ? unit.identifier_code : '';
    document.getElementById('unitStatus').value = unit.status;
    document.getElementById('cancelEditUnitBtn').style.display = 'block';
}
function resetUnitForm() {
    const form = document.getElementById('unitForm');
    form.reset();
    document.getElementById('unitFormTitle').textContent = 'Adicionar Nova Unidade';
    document.getElementById('unitFormUnitId').value = '';
    document.getElementById('unitFormMessage').innerHTML = '';
    document.getElementById('cancelEditUnitBtn').style.display = 'none';
}
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
function handleApiError(error) { console.error(error); document.getElementById('main-content').innerHTML = `<div class="alert alert-danger">${error.message}</div>`; }

function renderView(html) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = html;
    const listContainer = document.getElementById('listContainer');
    if (listContainer) listContainer.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';
}

function openReserveModal(unitId, unitIdentifier) {
    bootstrap.Modal.getInstance(document.getElementById('unitsModal'))?.hide();
    const form = document.getElementById('reservationForm');
    form.reset();
    form.unitIdToReserve.value = unitId;
    document.getElementById('unitIdentifierText').textContent = unitIdentifier;
    document.getElementById('reservationMessage').innerHTML = '';
    new bootstrap.Modal(document.getElementById('reserveModal')).show();
}
function openEquipmentTypeModal(type = null) {
    const modal = new bootstrap.Modal(document.getElementById('equipmentTypeModal'));
    const form = document.getElementById('equipmentTypeForm');
    form.reset();
    document.getElementById('equipmentTypeMessage').innerHTML = '';
    document.getElementById('equipmentTypeModalLabel').textContent = type ? 'Editar Tipo de Equipamento' : 'Adicionar Novo Tipo';
    form.equipmentTypeId.value = type ? type.id : '';
    if (type) {
        form.typeName.value = type.name;
        form.typeCategory.value = type.category;
        form.typeDescription.value = type.description || '';
    }
    modal.show();
}
function renderStatusBadge(status) {
    const map = { 'pending': 'warning', 'approved': 'success', 'rejected': 'danger', 'returned': 'secondary', 'available': 'success', 'maintenance': 'warning', 'reserved': 'info' };
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
function setButtonLoading(button, isLoading, loadingText = null) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        const text = loadingText ? `<span class="ms-2">${loadingText}</span>` : '';
        button.innerHTML = `<span class="spinner-border spinner-border-sm"></span>${text}`;
    } else {
        button.disabled = false;
        if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    }
}
async function logout(token = null) {
    if (token) {
        try { await apiFetch(`${API_URL}/auth/logout`, token, { method: 'POST' }); }
        catch (e) { console.error("Falha ao invalidar token:", e); }
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