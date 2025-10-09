// js/dashboard/ui.js

import { API_URL, apiFetch } from './api.js';

export function renderStatusBadge(status) {
    const statusMap = {
        'pending': { bg: 'warning', text: 'Pendente' },    // Status de Reserva e agora de Unidade
        'approved': { bg: 'success', text: 'Aprovada' },   // Status de Reserva
        'rejected': { bg: 'danger', text: 'Rejeitada' },   // Status de Reserva
        'returned': { bg: 'secondary', text: 'Devolvida' }, // Status de Reserva
        'available': { bg: 'success', text: 'Disponível' }, // Status de Unidade
        'maintenance': { bg: 'warning', text: 'Manutenção' },// Status de Unidade
        'reserved': { bg: 'info', text: 'Reservado' }      // Status de Unidade
    };
    const statusInfo = statusMap[status.toLowerCase()] || { bg: 'light', text: status };
    return `<span class="badge bg-${statusInfo.bg}">${statusInfo.text}</span>`;
}


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

export function renderLogLevelBadge(level) {
    const map = {
        'INFO': 'info',
        'WARNING': 'warning',
        'ERROR': 'danger'
    };
    return `<span class="badge bg-${map[level.toUpperCase()] || 'secondary'}">${level}</span>`;
}

export function renderView(html) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = html;
    const listContainer = document.getElementById('listContainer');
    if (listContainer) {
        listContainer.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" style="width: 3rem; height: 3rem;"></div></div>';
    }
}

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

export function setActiveNav(element) {
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

export function createToastContainer() {
    if (document.getElementById('toast-container')) return;
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '1080';
    document.body.appendChild(container);
}

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

// <<-- NOVA FUNÇÃO PARA ABRIR MODAL DE SETOR -->>
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