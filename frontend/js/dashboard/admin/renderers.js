// js/dashboard/admin/renderers.js

/**
 * Módulo para Funções de Renderização de Componentes de Admin.
 *
 * Este script especializa-se em gerar o HTML para componentes dinâmicos
 * da interface do administrador, como os botões de ação em tabelas ou os
 * "cards" de inventário. Separar esta lógica em funções dedicadas
 * torna as funções de carregamento de view (`userViews.js`, `inventoryViews.js`)
 * mais limpas e fáceis de ler.
 *
 * Funcionalidades:
 * - `renderAdminReservationActions`: Gera os botões de ação (aprovar, rejeitar, etc.)
 * para a tabela de gerenciamento de reservas, com base no status atual da reserva.
 * - `renderManagerUserActions`: Renderiza as ações disponíveis para um gerente na
 * tela de visualização de usuários.
 * - `renderUserActions`: Gera o conjunto completo de botões de ação para a
 * tabela de gerenciamento de usuários, desabilitando ações conforme apropriado
 * (ex: não permitir que um admin se auto-delete).
 * - `renderInventoryRow`: Renderiza o "card" completo para um tipo de equipamento
 * na view de inventário, incluindo suas estatísticas.
 *
 * Dependências:
 * - `ui.js`: Para importar as funções de renderização de badges.
 */


import { renderStatusBadge, renderRoleBadge, renderLogLevelBadge } from '../ui.js';

/**
 * Renderiza os botões de ação para um gerente na tabela de reservas.
 * @param {object} reservation - O objeto da reserva.
 * @returns {string} - O HTML dos botões de ação apropriados para o status da reserva.
 */
export function renderAdminReservationActions(reservation) {
    const isOverdue = new Date(reservation.end_time) < new Date() && reservation.status === 'approved';

    // Se a reserva está pendente, mostra os botões de aprovar e rejeitar.
    if (reservation.status === 'pending') {
        return `
            <button class="btn btn-success btn-sm me-1 admin-action-btn" data-reservation-id="${reservation.id}" data-action="approved" title="Aprovar"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-danger btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="rejected" title="Rejeitar"><i class="bi bi-x-lg"></i></button>
        `;
    }
    // Se a reserva está aprovada, mostra o botão para marcar como devolvida.
    if (reservation.status === 'approved') {
        let buttons = `<button class="btn btn-info btn-sm text-white admin-action-btn" data-reservation-id="${reservation.id}" data-action="returned" data-unit-identifier="${reservation.equipment_unit.identifier_code || `ID ${reservation.equipment_unit.id}`}" data-user-identifier="${reservation.user.username}" title="Marcar como Devolvido"><i class="bi bi-box-arrow-down"></i></button>`;
        // Se, além de aprovada, a reserva estiver atrasada, adiciona o botão de notificação.
        if (isOverdue) {
            buttons += ` <button class="btn btn-warning btn-sm admin-action-btn" data-reservation-id="${reservation.id}" data-action="notify-overdue" title="Notificar Atraso"><i class="bi bi-envelope-at"></i></button>`;
        }
        return buttons;
    }
    // Para outros status (rejeitada, devolvida), não há ações.
    return '---';
}

/**
 * Renderiza os botões de ação para um gerente na view de visualização de usuários.
 * @param {object} user - O objeto do usuário.
 * @returns {string} - O HTML dos botões de ação.
 */
export function renderManagerUserActions(user) {
    // Para gerentes, a única ação é ver o histórico do usuário.
    return `
        <button class="btn btn-info btn-sm text-white user-action-btn" data-user-id="${user.id}" data-user-name="${user.username}" data-action="history" title="Ver Histórico">
            <i class="bi bi-clock-history"></i>
        </button>`;
}


/**
 * Renderiza o conjunto completo de botões de ação para um administrador na tabela de usuários.
 * @param {object} user - O objeto do usuário da linha atual.
 * @param {number} currentUserId - O ID do administrador logado.
 * @returns {string} - O HTML com todos os botões de ação, com a lógica de habilitação/desabilitação.
 */
export function renderUserActions(user, currentUserId) {
    const isCurrentUser = user.id === currentUserId;
    const roles = ['user', 'requester', 'manager', 'admin'];
    const userRoleIndex = roles.indexOf(user.role);

    // Botão para ver o histórico de reservas do usuário.
    const historyButton = `
        <button class="btn btn-info btn-sm text-white user-action-btn" data-user-id="${user.id}" data-user-name="${user.username}" data-action="history" title="Ver Histórico">
            <i class="bi bi-clock-history"></i>
        </button>`;

    // Botão para alterar o setor do usuário.
    const sectorButton = `
        <button class="btn btn-info btn-sm text-white user-action-btn" data-user-id="${user.id}" data-action="change-sector" title="Alterar Setor">
            <i class="bi bi-tag"></i>
        </button>`;

    // Lógica para o botão de "promover" permissão.
    let promoteButton;
    if (userRoleIndex < roles.length - 1) { // Se não for admin (nível máximo)
        const nextRole = roles[userRoleIndex + 1];
        promoteButton = `
            <button class="btn btn-success btn-sm user-action-btn" data-user-id="${user.id}" data-action="promote" data-current-role="${user.role}" title="Promover para ${nextRole}" ${isCurrentUser ? 'disabled' : ''}>
                <i class="bi bi-arrow-up-circle"></i>
            </button>`;
    } else { // Se já for admin
        promoteButton = `
            <button class="btn btn-success btn-sm" disabled title="Já está no nível mais alto">
                <i class="bi bi-arrow-up-circle"></i>
            </button>`;
    }

    // Lógica para o botão de "rebaixar" permissão.
    let demoteButton;
    if (userRoleIndex > 0) { // Se não for 'user' (nível mínimo)
        const prevRole = roles[userRoleIndex - 1];
        demoteButton = `
            <button class="btn btn-warning btn-sm user-action-btn" data-user-id="${user.id}" data-action="demote" data-current-role="${user.role}" title="Rebaixar para ${prevRole}" ${isCurrentUser ? 'disabled' : ''}>
                <i class="bi bi-arrow-down-circle"></i>
            </button>`;
    } else { // Se já for 'user'
        demoteButton = `
            <button class="btn btn-warning btn-sm" disabled title="Já está no nível mais baixo">
                <i class="bi bi-arrow-down-circle"></i>
            </button>`;
    }

    // Botão para ativar/desativar a conta do usuário.
    const toggleActiveButton = user.is_active
        ? `<button class="btn btn-secondary btn-sm user-action-btn" data-user-id="${user.id}" data-action="toggle-active" data-is-active="true" title="Desativar Usuário" ${isCurrentUser ? 'disabled' : ''}><i class="bi bi-pause-circle"></i></button>`
        : `<button class="btn btn-success btn-sm user-action-btn" data-user-id="${user.id}" data-action="toggle-active" data-is-active="false" title="Ativar Usuário"><i class="bi bi-play-circle"></i></button>`;

    // Botão para deletar o usuário.
    const deleteButton = `
        <button class="btn btn-danger btn-sm user-action-btn" data-user-id="${user.id}" data-action="delete" title="Deletar Usuário" ${isCurrentUser ? 'disabled' : ''}>
            <i class="bi bi-trash"></i>
        </button>`;

    // Agrupa todos os botões.
    return `<div class="d-flex gap-1">${historyButton}${sectorButton}${promoteButton}${demoteButton}${toggleActiveButton}${deleteButton}</div>`;
}

/**
 * Renderiza o card de um tipo de equipamento na view de gerenciamento de inventário.
 * @param {object} type - O objeto do tipo de equipamento, incluindo suas estatísticas.
 * @returns {string} - O HTML completo do card.
 */
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