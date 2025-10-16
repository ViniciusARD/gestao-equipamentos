// js/dashboard/admin/renderers.js

import { renderStatusBadge, renderRoleBadge, renderLogLevelBadge } from '../ui.js';

export function renderAdminReservationActions(reservation) {
    const isOverdue = new Date(reservation.end_time) < new Date() && reservation.status === 'approved';

    if (reservation.status === 'pending') {
        return `
            <button class="btn btn-success btn-sm me-1 admin-action-btn" data-reservation-id="${reservation.id}" data-action="approved" title="Aprovar"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-danger btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="rejected" title="Rejeitar"><i class="bi bi-x-lg"></i></button>
        `;
    }
    if (reservation.status === 'approved') {
        let buttons = `<button class="btn btn-info btn-sm text-white admin-action-btn" data-reservation-id="${reservation.id}" data-action="returned" data-unit-identifier="${reservation.equipment_unit.identifier_code || `ID ${reservation.equipment_unit.id}`}" data-user-identifier="${reservation.user.username}" title="Marcar como Devolvido"><i class="bi bi-box-arrow-down"></i></button>`;
        if (isOverdue) {
            buttons += ` <button class="btn btn-warning btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="notify-overdue" title="Notificar Atraso"><i class="bi bi-envelope-at"></i></button>`;
        }
        return buttons;
    }
    return '---';
}

export function renderManagerUserActions(user) {
    return `
        <button class="btn btn-info btn-sm text-white user-action-btn" data-user-id="${user.id}" data-user-name="${user.username}" data-action="history" title="Ver Histórico">
            <i class="bi bi-clock-history"></i>
        </button>`;
}

export function renderUserActions(user, currentUserId) {
    const isCurrentUser = user.id === currentUserId;
    const roles = ['user', 'requester', 'manager', 'admin'];
    const userRoleIndex = roles.indexOf(user.role);

    const historyButton = `
        <button class="btn btn-info btn-sm text-white user-action-btn" data-user-id="${user.id}" data-user-name="${user.username}" data-action="history" title="Ver Histórico">
            <i class="bi bi-clock-history"></i>
        </button>`;

    const sectorButton = `
        <button class="btn btn-info btn-sm text-white user-action-btn" data-user-id="${user.id}" data-action="change-sector" title="Alterar Setor">
            <i class="bi bi-tag"></i>
        </button>`;

    let promoteButton;
    if (userRoleIndex < roles.length - 1) {
        const nextRole = roles[userRoleIndex + 1];
        promoteButton = `
            <button class="btn btn-success btn-sm user-action-btn" data-user-id="${user.id}" data-action="promote" data-current-role="${user.role}" title="Promover para ${nextRole}" ${isCurrentUser ? 'disabled' : ''}>
                <i class="bi bi-arrow-up-circle"></i>
            </button>`;
    } else {
        promoteButton = `
            <button class="btn btn-success btn-sm" disabled title="Já está no nível mais alto">
                <i class="bi bi-arrow-up-circle"></i>
            </button>`;
    }

    let demoteButton;
    if (userRoleIndex > 0) {
        const prevRole = roles[userRoleIndex - 1];
        demoteButton = `
            <button class="btn btn-warning btn-sm user-action-btn" data-user-id="${user.id}" data-action="demote" data-current-role="${user.role}" title="Rebaixar para ${prevRole}" ${isCurrentUser ? 'disabled' : ''}>
                <i class="bi bi-arrow-down-circle"></i>
            </button>`;
    } else {
        demoteButton = `
            <button class="btn btn-warning btn-sm" disabled title="Já está no nível mais baixo">
                <i class="bi bi-arrow-down-circle"></i>
            </button>`;
    }

    const toggleActiveButton = user.is_active
        ? `<button class="btn btn-secondary btn-sm user-action-btn" data-user-id="${user.id}" data-action="toggle-active" data-is-active="true" title="Desativar Usuário" ${isCurrentUser ? 'disabled' : ''}><i class="bi bi-pause-circle"></i></button>`
        : `<button class="btn btn-success btn-sm user-action-btn" data-user-id="${user.id}" data-action="toggle-active" data-is-active="false" title="Ativar Usuário"><i class="bi bi-play-circle"></i></button>`;


    const deleteButton = `
        <button class="btn btn-danger btn-sm user-action-btn" data-user-id="${user.id}" data-action="delete" title="Deletar Usuário" ${isCurrentUser ? 'disabled' : ''}>
            <i class="bi bi-trash"></i>
        </button>`;

    return `<div class="d-flex gap-1">${historyButton}${sectorButton}${promoteButton}${demoteButton}${toggleActiveButton}${deleteButton}</div>`;
}

export function renderInventoryRow(type) {
    return `
    <div class="col-md-6 col-lg-4 mb-4" id="inventory-row-${type.id}">
        <div class="card h-100">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${type.name}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${type.category}</h6>
                <p class="card-text small text-muted flex-grow-1">${type.description || 'Sem descrição.'}</p>
                
                <div class="d-flex justify-content-around text-center my-3 py-2 border-top border-bottom">
                    <div>
                        <h4 class="mb-0">${type.total_units}</h4>
                        <small class="text-muted">Total</small>
                    </div>
                    <div>
                        <h4 class="mb-0 text-success">${type.available_units}</h4>
                        <small class="text-muted">Disponíveis</small>
                    </div>
                     <div>
                        <h4 class="mb-0 text-info">${type.reserved_units}</h4>
                        <small class="text-muted">Reservadas</small>
                    </div>
                    <div>
                        <h4 class="mb-0 text-warning">${type.maintenance_units}</h4>
                        <small class="text-muted">Manutenção</small>
                    </div>
                </div>

                <div class="d-flex gap-2 mt-auto">
                    <button class="btn btn-primary flex-grow-1 inventory-action-btn" data-action="view-units" data-type-id="${type.id}" title="Gerenciar Unidades"><i class="bi bi-hdd-stack"></i> Unidades (${type.total_units})</button>
                    <button class="btn btn-secondary inventory-action-btn" data-action="edit-type" data-type-id="${type.id}" title="Editar Tipo"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-outline-danger inventory-action-btn" data-action="delete-type" data-type-id="${type.id}" title="Deletar Tipo"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>
    </div>
    `;
}