// js/dashboard/admin/renderers.js

import { renderStatusBadge, renderRoleBadge, renderLogLevelBadge } from '../ui.js';

export function renderAdminReservationActions(reservation) {
    if (reservation.status === 'pending') {
        return `
            <button class="btn btn-success btn-sm me-1 admin-action-btn" data-reservation-id="${reservation.id}" data-action="approved" title="Aprovar"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-danger btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="rejected" title="Rejeitar"><i class="bi bi-x-lg"></i></button>
        `;
    }
    if (reservation.status === 'approved') {
        return `<button class="btn btn-info btn-sm text-white admin-action-btn" data-reservation-id="${reservation.id}" data-action="returned" data-unit-identifier="${reservation.equipment_unit.identifier_code || `ID ${reservation.equipment_unit.id}`}" title="Marcar como Devolvido"><i class="bi bi-box-arrow-down"></i></button>`;
    }
    return '---';
}

export function renderUserActions(user, currentUserId) {
    const isCurrentUser = user.id === currentUserId;
    const roles = ['user', 'requester', 'manager', 'admin'];
    const userRoleIndex = roles.indexOf(user.role);

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

    return `<div class="d-flex gap-1">${sectorButton}${promoteButton}${demoteButton}${toggleActiveButton}${deleteButton}</div>`;
}

export function renderInventoryRow(type) {
    return `
        <tr id="inventory-row-${type.id}">
            <td>${type.name}</td>
            <td>${type.category}</td>
            <td class="text-center">${type.total_units}</td>
            <td class="text-center">${type.available_units}</td>
            <td>
                <button class="btn btn-info btn-sm me-1 text-white inventory-action-btn" data-action="view-units" data-type-id="${type.id}" data-type-name="${type.name}" title="Gerenciar Unidades"><i class="bi bi-hdd-stack"></i></button>
                <button class="btn btn-secondary btn-sm me-1 inventory-action-btn" data-action="edit-type" data-type-id="${type.id}" title="Editar Tipo"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-danger btn-sm inventory-action-btn" data-action="delete-type" data-type-id="${type.id}" title="Deletar Tipo"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `;
}