// js/dashboard/ui.js

/**
 * Módulo de Utilitários da Interface do Usuário (UI).
 *
 * Este script contém um conjunto de funções auxiliares responsáveis por manipular
 * a interface do usuário no dashboard. Ele abstrai a lógica de renderização de
 * componentes comuns, como emblemas de status, notificações (toasts), modais e
 * controles de paginação. O objetivo é manter a consistência visual e centralizar
 * a manipulação do DOM.
 *
 * Funcionalidades:
 * - Renderização de "badges" para status, permissões e níveis de log.
 * - Funções para exibir, esconder e controlar o estado de carregamento de botões.
 * - Criação de um container de "toasts" para notificações e uma função para exibi-las.
 * - Funções para abrir e configurar diferentes modais da aplicação (reserva, edição, etc.).
 * - Geração dinâmica dos controles de paginação.
 *
 * Dependências:
 * - `api.js`: Para a constante `API_URL` e a função `apiFetch`.
 * - Bootstrap 5 para a funcionalidade de modais e toasts.
 */


import { API_URL, apiFetch } from './api.js';

/**
 * Renderiza um "badge" (emblema) do Bootstrap com base no status de uma reserva ou unidade.
 * @param {string} status - O status (ex: 'pending', 'approved', 'available').
 * @returns {string} - O HTML do badge.
 */
export function renderStatusBadge(status) {
    const statusMap = {
        'pending': { bg: 'warning', text: 'Pendente' },
        'approved': { bg: 'success', text: 'Aprovada' },
        'rejected': { bg: 'danger', text: 'Rejeitada' },
        'returned': { bg: 'secondary', text: 'Devolvida' },
        'available': { bg: 'success', text: 'Disponível' },
        'maintenance': { bg: 'warning', text: 'Manutenção' },
        'reserved': { bg: 'info', text: 'Reservado' }
    };
    const statusInfo = statusMap[status.toLowerCase()] || { bg: 'light', text: status };
    return `<span class="badge bg-${statusInfo.bg}">${statusInfo.text}</span>`;
}

/**
 * Renderiza um badge do Bootstrap para a permissão (role) de um usuário.
 * @param {string} role - A permissão (ex: 'admin', 'manager').
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
 * Renderiza um badge do Bootstrap para o nível de um log do sistema.
 * @param {string} level - O nível do log (ex: 'INFO', 'WARNING').
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
 * Renderiza o conteúdo principal de uma view no painel.
 * @param {string} html - O conteúdo HTML a ser inserido no container principal.
 */
export function renderView(html) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = html;
    // Se a view tiver um container de lista, exibe um spinner de carregamento.
    const listContainer = document.getElementById('listContainer');
    if (listContainer) {
        listContainer.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';
    }
}

/**
 * Controla o estado de carregamento de um botão.
 * @param {HTMLElement} button - O elemento do botão.
 * @param {boolean} isLoading - Se o botão deve entrar em estado de carregamento.
 * @param {string|null} loadingText - O texto a ser exibido ao lado do spinner.
 */
export function setButtonLoading(button, isLoading, loadingText = null) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML; // Salva o conteúdo original.
        const text = loadingText ? `<span class="ms-2">${loadingText}</span>` : '';
        button.innerHTML = `<span class="spinner-border spinner-border-sm"></span>${text}`;
    } else {
        button.disabled = false;
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml; // Restaura o conteúdo.
        }
    }
}

/**
 * Define qual item da navegação lateral está ativo.
 * @param {HTMLElement} element - O elemento de link da navegação.
 */
export function setActiveNav(element) {
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

/**
 * Cria o container de notificações (toasts) no corpo da página, se ainda não existir.
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
 * Exibe uma notificação (toast) para o usuário.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de notificação ('info', 'success', 'danger', etc.).
 */
export function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    // ... (atributos de acessibilidade)

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();
    // Remove o elemento do DOM após o toast ser ocultado para evitar acúmulo.
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// --- Funções de Abertura e Gerenciamento de Modais ---

/**
 * Abre o modal de reserva, preenchendo os dados da unidade selecionada.
 * @param {string} unitId - O ID da unidade a ser reservada.
 * @param {string} unitIdentifier - O identificador da unidade para exibição.
 */
export function openReserveModal(unitId, unitIdentifier) {
    bootstrap.Modal.getInstance(document.getElementById('unitsModal'))?.hide(); // Fecha o modal de unidades se estiver aberto.
    const form = document.getElementById('reservationForm');
    form.reset();
    form.unitIdToReserve.value = unitId;
    document.getElementById('unitIdentifierText').textContent = unitIdentifier;
    document.getElementById('reservationMessage').innerHTML = '';
    new bootstrap.Modal(document.getElementById('reserveModal')).show();
}

/**
 * Abre o modal para criar ou editar um tipo de equipamento.
 * @param {object|null} type - O objeto do tipo de equipamento para edição, ou nulo para criação.
 */
export function openEquipmentTypeModal(type = null) {
    const modal = new bootstrap.Modal(document.getElementById('equipmentTypeModal'));
    const form = document.getElementById('equipmentTypeForm');
    form.reset();
    document.getElementById('equipmentTypeMessage').innerHTML = '';
    document.getElementById('equipmentTypeModalLabel').textContent = type ? 'Editar Tipo de Equipamento' : 'Adicionar Novo Tipo';
    form.equipmentTypeId.value = type ? type.id : '';
    if (type) {
        // Preenche o formulário com os dados existentes para edição.
        form.typeName.value = type.name;
        form.typeCategory.value = type.category;
        form.typeDescription.value = type.description || '';
    }
    modal.show();
}

/**
 * Abre o modal para criar ou editar um setor.
 * @param {object|null} sector - O objeto do setor para edição, ou nulo para criação.
 */
export function openSectorModal(sector = null) {
    const modal = new bootstrap.Modal(document.getElementById('sectorModal'));
    const form = document.getElementById('sectorForm');
    form.reset();
    document.getElementById('sectorMessage').innerHTML = '';
    document.getElementById('sectorModalLabel').textContent = sector ? `Editar Setor: ${sector.name}` : 'Adicionar Novo Setor';
    form.sectorId.value = sector ? sector.id : '';
    if (sector) {
        form.sectorName.value = sector.name;
    }
    modal.show();
}

/**
 * Limpa e reseta o formulário de adicionar/editar unidade.
 */
export function resetUnitForm() {
    const form = document.getElementById('unitForm');
    if (!form) return;
    form.reset();
    document.getElementById('unitFormTitle').textContent = 'Adicionar Novas Unidades';
    document.getElementById('unitFormUnitId').value = '';
    document.getElementById('unitQuantity').disabled = false;
    document.getElementById('unitFormMessage').innerHTML = '';
    document.getElementById('cancelEditUnitBtn').classList.add('d-none');
}

/**
 * Abre o modal e busca o histórico de eventos de uma unidade específica.
 * @param {string} unitId - O ID da unidade.
 * @param {string} token - O token de autenticação.
 */
export async function openUnitHistoryModal(unitId, token) {
    const modal = new bootstrap.Modal(document.getElementById('unitHistoryModal'));
    const modalTitle = document.getElementById('unitHistoryModalLabel');
    const modalBody = document.getElementById('unitHistoryBody');

    modalTitle.textContent = `Histórico da Unidade ID: ${unitId}`;
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
    modal.show();

    try {
        const history = await apiFetch(`${API_URL}/equipments/units/${unitId}/history`, token);
        if (history.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">Nenhum evento registrado para esta unidade.</p>';
            return;
        }

        const eventTypeTranslations = {
            created: { text: "Criação", class: "primary" },
            returned_ok: { text: "Devolvido (OK)", class: "success" },
            sent_to_maintenance: { text: "Manutenção", class: "danger" },
        };

        // Monta a lista de eventos do histórico.
        modalBody.innerHTML = `
            <ul class="list-group">
                ${history.map(entry => {
                    const eventInfo = eventTypeTranslations[entry.event_type] || { text: entry.event_type, class: "secondary" };
                    return `
                        <li class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1"><span class="badge bg-${eventInfo.class}">${eventInfo.text}</span></h6>
                                <small>${new Date(entry.created_at).toLocaleString('pt-BR')}</small>
                            </div>
                            <p class="mb-1">${entry.notes || '<i>Sem observações.</i>'}</p>
                            <small class="text-muted">Registrado por: ${entry.user ? entry.user.username : 'Sistema'}</small>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
    } catch (e) {
        modalBody.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

/**
 * Renderiza os controles de navegação de página (anterior/próxima).
 * @param {object} data - O objeto de página retornado pela API.
 * @param {string} actionPrefix - Um prefixo para identificar a qual view a paginação pertence.
 * @returns {string} - O HTML dos controles de paginação.
 */
export function renderPaginationControls(data, actionPrefix) {
    if (data.pages <= 1) return '';

    return `
        <nav class="mt-4 d-flex justify-content-between align-items-center">
            <small class="text-muted">
                Mostrando ${data.items.length} de ${data.total} itens
            </small>
            <ul class="pagination mb-0">
                <li class="page-item ${data.page === 1 ? 'disabled' : ''}">
                    <a class="page-link pagination-btn" href="#" data-page="${data.page - 1}" data-action-prefix="${actionPrefix}">Anterior</a>
                </li>
                <li class="page-item active">
                    <span class="page-link">${data.page} de ${data.pages}</span>
                </li>
                <li class="page-item ${data.page === data.pages ? 'disabled' : ''}">
                    <a class="page-link pagination-btn" href="#" data-page="${data.page + 1}" data-action-prefix="${actionPrefix}">Próxima</a>
                </li>
            </ul>
        </nav>
    `;
}