// js/dashboard.js

// Constantes da API
const API_URL = 'http://127.0.0.1:8000';

// Função principal que é executada quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    
    // Se não houver token, redireciona para a página de login
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Busca os dados do usuário e inicia a aplicação
    initializeApp(token);
});

/**
 * Inicializa a dashboard: busca dados do usuário, configura os listeners de eventos.
 * @param {string} token O token JWT do usuário.
 */
async function initializeApp(token) {
    // Busca dados do usuário para saudação e verificação de permissão
    const user = await fetchUserData(token);
    if (user) {
        const userGreeting = document.getElementById('user-greeting');
        userGreeting.textContent = `Olá, ${user.username}!`;

        // Se o usuário for admin, exibe o menu de admin
        if (user.role === 'admin') {
            document.getElementById('admin-menu').classList.remove('d-none');
        }
    }

    // Carrega a visualização padrão (lista de equipamentos)
    loadEquipmentsView(token);

    // Adiciona os listeners de eventos aos botões e modais
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
        // Se o token for inválido, desloga o usuário
        logout();
        return null;
    }
}

/**
 * Configura todos os listeners de eventos da página.
 * @param {string} token O token JWT.
 */
function setupEventListeners(token) {
    // Botão de Logout
    document.getElementById('logoutButton').addEventListener('click', () => logout(token));

    // Botão de toggle do menu
    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('wrapper').classList.toggle('toggled');
    });

    // Navegação do Usuário Padrão
    document.getElementById('nav-equipments').addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(e.target);
        loadEquipmentsView(token);
    });
    document.getElementById('nav-my-reservations').addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(e.target);
        loadMyReservationsView(token);
    });

    // --- NOVO: Navegação do Admin ---
    const navManageReservations = document.getElementById('nav-manage-reservations');
    if (navManageReservations) {
        navManageReservations.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNav(e.target);
            loadManageReservationsView(token);
        });
    }

    // Listener de eventos para cliques na área de conteúdo principal (event delegation)
    const mainContent = document.getElementById('main-content');
    mainContent.addEventListener('click', (event) => {
        const target = event.target;
        // Se o clique foi em um botão para ver unidades
        if (target.matches('.view-units-btn')) {
            const typeId = target.dataset.typeId;
            fetchAndShowUnits(typeId, token);
        }
        // --- NOVO: Se o clique foi em um botão de ação de reserva (admin) ---
        else if (target.matches('.admin-action-btn')) {
            const reservationId = target.dataset.reservationId;
            const action = target.dataset.action;
            handleUpdateReservationStatus(reservationId, action, token);
        }
    });
    
    // Listener de eventos para cliques no modal de unidades
    const unitsModal = document.getElementById('modalUnitList');
    unitsModal.addEventListener('click', (event) => {
        // Se o clique foi em um botão para reservar
        if (event.target.matches('.reserve-btn')) {
            const unitId = event.target.dataset.unitId;
            const unitIdentifier = event.target.dataset.unitIdentifier;
            openReserveModal(unitId, unitIdentifier);
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
 * Carrega e renderiza a lista de tipos de equipamentos na área principal.
 * @param {string} token O token JWT.
 */
async function loadEquipmentsView(token) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Tipos de Equipamentos Disponíveis</h1>
        </div>
        <div id="equipmentList" class="row">
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/equipments/types`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao carregar equipamentos.');
        const equipmentTypes = await response.json();

        const listDiv = document.getElementById('equipmentList');
        listDiv.innerHTML = '';
        if (equipmentTypes.length === 0) {
            listDiv.innerHTML = '<p class="text-muted">Nenhum equipamento cadastrado.</p>';
            return;
        }

        equipmentTypes.forEach(type => {
            listDiv.innerHTML += `
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
            `;
        });
    } catch (error) {
        mainContent.innerHTML = `<p class="text-danger">${error.message}</p>`;
        console.error(error);
    }
}

/**
 * Carrega e renderiza a lista de reservas do usuário.
 * @param {string} token O token JWT.
 */
async function loadMyReservationsView(token) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Minhas Reservas</h1>
        </div>
        <div id="reservationsList" class="table-responsive">
             <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/reservations/my-reservations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao carregar suas reservas.');
        const reservations = await response.json();
        
        const listDiv = document.getElementById('reservationsList');
        if (reservations.length === 0) {
            listDiv.innerHTML = '<p class="text-muted">Você ainda não fez nenhuma reserva.</p>';
            return;
        }

        let tableHtml = `
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
        `;
        
        const statusMap = {
            'pending': { text: 'Pendente', badge: 'warning' },
            'approved': { text: 'Aprovada', badge: 'success' },
            'rejected': { text: 'Rejeitada', badge: 'danger' },
            'returned': { text: 'Devolvido', badge: 'secondary' },
        };

        reservations.forEach(res => {
            const statusInfo = statusMap[res.status] || { text: res.status, badge: 'light' };
            tableHtml += `
                <tr>
                    <td>${res.equipment_unit.equipment_type.name}</td>
                    <td>${res.equipment_unit.identifier_code || 'N/A'}</td>
                    <td><span class="badge bg-${statusInfo.badge}">${statusInfo.text}</span></td>
                    <td>${new Date(res.start_time).toLocaleString('pt-BR')}</td>
                    <td>${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        listDiv.innerHTML = tableHtml;

    } catch (error) {
        mainContent.innerHTML = `<p class="text-danger">${error.message}</p>`;
        console.error(error);
    }
}

/**
 * --- NOVA FUNÇÃO ---
 * Carrega a view de gerenciamento de reservas para o admin.
 * @param {string} token O token JWT.
 */
async function loadManageReservationsView(token) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Gerenciar Todas as Reservas</h1>
        </div>
        <div id="adminReservationsList" class="table-responsive">
             <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/admin/reservations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao carregar as reservas.');
        const reservations = await response.json();
        
        const listDiv = document.getElementById('adminReservationsList');
        if (reservations.length === 0) {
            listDiv.innerHTML = '<p class="text-muted">Nenhuma reserva encontrada no sistema.</p>';
            return;
        }

        let tableHtml = `
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Usuário</th>
                        <th>Equipamento</th>
                        <th>Status</th>
                        <th>Período da Reserva</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        const statusMap = {
            'pending': { text: 'Pendente', badge: 'warning' },
            'approved': { text: 'Aprovada', badge: 'success' },
            'rejected': { text: 'Rejeitada', badge: 'danger' },
            'returned': { text: 'Devolvido', badge: 'secondary' },
        };

        reservations.forEach(res => {
            const statusInfo = statusMap[res.status] || { text: res.status, badge: 'light' };
            
            let actionsHtml = '';
            if (res.status === 'pending') {
                actionsHtml = `
                    <button class="btn btn-success btn-sm me-1 admin-action-btn" data-reservation-id="${res.id}" data-action="approved" title="Aprovar">
                        <i class="bi bi-check-lg"></i>
                    </button>
                    <button class="btn btn-danger btn-sm admin-action-btn" data-reservation-id="${res.id}" data-action="rejected" title="Rejeitar">
                        <i class="bi bi-x-lg"></i>
                    </button>
                `;
            } else if (res.status === 'approved') {
                 actionsHtml = `
                    <button class="btn btn-info btn-sm text-white admin-action-btn" data-reservation-id="${res.id}" data-action="returned" title="Marcar como Devolvido">
                        <i class="bi bi-box-arrow-down"></i>
                    </button>
                `;
            } else {
                actionsHtml = '---';
            }

            tableHtml += `
                <tr>
                    <td>${res.user.username} (${res.user.email})</td>
                    <td>${res.equipment_unit.equipment_type.name} (${res.equipment_unit.identifier_code || 'N/A'})</td>
                    <td><span class="badge bg-${statusInfo.badge}">${statusInfo.text}</span></td>
                    <td>${new Date(res.start_time).toLocaleString('pt-BR')} - ${new Date(res.end_time).toLocaleString('pt-BR')}</td>
                    <td>${actionsHtml}</td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        listDiv.innerHTML = tableHtml;

    } catch (error) {
        mainContent.innerHTML = `<p class="text-danger">${error.message}</p>`;
        console.error(error);
    }
}


// --- Funções dos Modais e Ações ---

/**
 * Busca e exibe as unidades de um tipo de equipamento em um modal.
 * @param {string} typeId O ID do tipo de equipamento.
 * @param {string} token O token JWT.
 */
async function fetchAndShowUnits(typeId, token) {
    const modalTitle = document.getElementById('unitsModalLabel');
    const modalBody = document.getElementById('modalUnitList');
    const unitsModal = new bootstrap.Modal(document.getElementById('unitsModal'));

    modalTitle.textContent = 'Carregando...';
    modalBody.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>';
    unitsModal.show();

    try {
        const response = await fetch(`${API_URL}/equipments/types/${typeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar unidades.');
        
        const typeWithUnits = await response.json();
        modalTitle.textContent = `Unidades de ${typeWithUnits.name}`;
        
        if (typeWithUnits.units.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nenhuma unidade cadastrada para este tipo.</p>';
            return;
        }
        
        let unitsHtml = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Status</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
        `;

        typeWithUnits.units.forEach(unit => {
            const isAvailable = unit.status === 'available';
            const statusBadge = isAvailable ? 'bg-success' : 'bg-secondary';
            const reserveButton = isAvailable
                ? `<button class="btn btn-primary btn-sm reserve-btn" data-unit-id="${unit.id}" data-unit-identifier="${unit.identifier_code || `ID ${unit.id}`}">Reservar</button>`
                : `<button class="btn btn-secondary btn-sm" disabled>Indisponível</button>`;

            unitsHtml += `
                <tr>
                    <td>${unit.identifier_code || 'N/A'}</td>
                    <td><span class="badge ${statusBadge}">${unit.status}</span></td>
                    <td>${reserveButton}</td>
                </tr>
            `;
        });
        
        unitsHtml += '</tbody></table>';
        modalBody.innerHTML = unitsHtml;

    } catch (error) {
        modalBody.innerHTML = `<p class="text-danger">${error.message}</p>`;
        console.error(error);
    }
}

/**
 * Abre o modal de reserva com os dados da unidade.
 * @param {string} unitId ID da unidade a ser reservada.
 * @param {string} unitIdentifier Identificador da unidade.
 */
function openReserveModal(unitId, unitIdentifier) {
    const unitsModal = bootstrap.Modal.getInstance(document.getElementById('unitsModal'));
    unitsModal.hide();
    
    document.getElementById('unitIdToReserve').value = unitId;
    document.getElementById('unitIdentifierText').textContent = unitIdentifier;
    document.getElementById('reservationMessage').innerHTML = '';
    document.getElementById('reservationForm').reset();
    
    const reserveModal = new bootstrap.Modal(document.getElementById('reserveModal'));
    reserveModal.show();
}

/**
 * Manipula o envio do formulário de reserva.
 * @param {string} token O token JWT.
 */
async function handleReservationSubmit(token) {
    const unit_id = document.getElementById('unitIdToReserve').value;
    const start_time = document.getElementById('startTime').value;
    const end_time = document.getElementById('endTime').value;
    const messageDiv = document.getElementById('reservationMessage');

    if (!start_time || !end_time) {
        messageDiv.innerHTML = '<div class="alert alert-danger">Por favor, preencha as datas de início e fim.</div>';
        return;
    }
    if (new Date(start_time) >= new Date(end_time)) {
        messageDiv.innerHTML = '<div class="alert alert-danger">A data de fim deve ser posterior à data de início.</div>';
        return;
    }

    messageDiv.innerHTML = '<div class="alert alert-info">Enviando solicitação...</div>';

    try {
        const response = await fetch(`${API_URL}/reservations/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                unit_id: parseInt(unit_id),
                start_time: new Date(start_time).toISOString(),
                end_time: new Date(end_time).toISOString(),
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Não foi possível fazer a reserva.');
        }
        
        messageDiv.innerHTML = '<div class="alert alert-success">Reserva solicitada com sucesso! Você pode acompanhar o status em "Minhas Reservas".</div>';
        
        setTimeout(() => {
            const reserveModal = bootstrap.Modal.getInstance(document.getElementById('reserveModal'));
            reserveModal.hide();
        }, 3000);
        
    } catch (error) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        console.error(error);
    }
}

/**
 * --- NOVA FUNÇÃO ---
 * Manipula a atualização de status de uma reserva pelo admin.
 * @param {string} reservationId ID da reserva a ser atualizada.
 * @param {string} newStatus O novo status ('approved', 'rejected', 'returned').
 * @param {string} token O token JWT do admin.
 */
async function handleUpdateReservationStatus(reservationId, newStatus, token) {
    // Confirmação para evitar cliques acidentais
    if (!confirm(`Tem certeza de que deseja alterar o status desta reserva para "${newStatus}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/reservations/${reservationId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Falha ao atualizar o status da reserva.');
        }

        // Se a operação foi bem-sucedida, recarrega a view de gerenciamento
        alert('Status da reserva atualizado com sucesso!');
        loadManageReservationsView(token);

    } catch (error) {
        alert(`Erro: ${error.message}`);
        console.error(error);
    }
}


/**
 * Desloga o usuário, remove o token e redireciona para o login.
 * @param {string|null} token O token JWT para invalidar no backend.
 */
async function logout(token = null) {
    if (token) {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Falha ao invalidar token no backend:", error);
        }
    }
    localStorage.removeItem('accessToken');
    window.location.href = 'login.html';
}