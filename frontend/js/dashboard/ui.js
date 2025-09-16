// js/dashboard/ui.js

/**
 * Renderiza um distintivo (badge) de status com cores apropriadas.
 * @param {string} status - O status a ser renderizado.
 * @returns {string} - O HTML do badge.
 */
export function renderStatusBadge(status) {
    const statusMap = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger',
        'returned': 'secondary',
        'available': 'success',
        'maintenance': 'warning',
        'reserved': 'info'
    };
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const badgeClass = statusMap[status.toLowerCase()] || 'light';
    return `<span class="badge bg-${badgeClass}">${statusText}</span>`;
}

/**
 * Renderiza um distintivo (badge) para o nível de permissão (role).
 * @param {string} role - A permissão (user, requester, manager, admin).
 * @returns {string} - O HTML do badge.
 */
export function renderRoleBadge(role) {
    const map = {
        'admin': { bg: 'danger', text: 'Admin' },
        'manager': { bg: 'primary', text: 'Gerente' },
        'requester': { bg: 'success', text: 'Solicitante' },
        'user': { bg: 'secondary', text: 'Usuário' }
    };
    const roleInfo = map[role] || { bg: 'light', text: role.charAt(0).toUpperCase() + role.slice(1) };
    return `<span class="badge bg-${roleInfo.bg}">${roleInfo.text}</span>`;
}


/**
 * Renderiza um distintivo (badge) para o nível de log.
 * @param {string} level - O nível do log (INFO, WARNING, ERROR).
 * @returns {string} - O HTML do badge.
 */
export function renderLogLevelBadge(level) {
    const map = {
        'INFO': 'info',
        'WARNING': 'warning',
        'ERROR': 'danger'
    };
    return `<span class="badge bg-${map[level.toUpperCase()] || 'secondary'}">${level}</span>`;
}

/**
 * Insere o HTML em um container principal e exibe um spinner de carregamento.
 * @param {string} html - O HTML da estrutura da view.
 */
export function renderView(html) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = html;
    const listContainer = document.getElementById('listContainer');
    if (listContainer) {
        listContainer.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';
    }
}

/**
 * Controla o estado de carregamento de um botão.
 * @param {HTMLElement} button - O elemento do botão.
 * @param {boolean} isLoading - Se deve mostrar o estado de carregamento.
 * @param {string|null} loadingText - O texto a ser exibido durante o carregamento.
 */
export function setButtonLoading(button, isLoading, loadingText = null) {
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

/**
 * Marca o item de navegação ativo na barra lateral.
 * @param {HTMLElement} element - O elemento `<a>` clicado.
 */
export function setActiveNav(element) {
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

/**
 * Cria o container para as notificações (toasts) se não existir.
 */
export function createToastContainer() {
    if (document.getElementById('toast-container')) return;
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '1080';
    document.body.appendChild(container);
}

/**
 * Exibe uma notificação (toast).
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo do toast (e.g., 'info', 'success', 'danger').
 */
export function showToast(message, type = 'info') {
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
    const toast = new bootstrap.Toast(toastEl, {
        delay: 5000
    });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// --- Funções de Modal ---

export function openReserveModal(unitId, unitIdentifier) {
    bootstrap.Modal.getInstance(document.getElementById('unitsModal'))?.hide();
    const form = document.getElementById('reservationForm');
    form.reset();
    form.unitIdToReserve.value = unitId;
    document.getElementById('unitIdentifierText').textContent = unitIdentifier;
    document.getElementById('reservationMessage').innerHTML = '';
    new bootstrap.Modal(document.getElementById('reserveModal')).show();
}

export function openEquipmentTypeModal(type = null) {
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

export function openManageUnitsModal(typeId, typeName) {
    const modal = new bootstrap.Modal(document.getElementById('manageUnitsModal'));
    const modalLabel = document.getElementById('manageUnitsModalLabel');
    const tableBody = document.getElementById('unitsTableBody');
    
    resetUnitForm();
    document.getElementById('unitFormTypeId').value = typeId;
    modalLabel.textContent = `Gerenciar Unidades de: ${typeName}`;
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border"></div></td></tr>';

    modal.show();
}

export function resetUnitForm() {
    const form = document.getElementById('unitForm');
    form.reset();
    document.getElementById('unitFormTitle').textContent = 'Adicionar Nova Unidade';
    document.getElementById('unitFormUnitId').value = '';
    document.getElementById('unitFormMessage').innerHTML = '';
    document.getElementById('cancelEditUnitBtn').style.display = 'none';
}