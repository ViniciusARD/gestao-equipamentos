// js/dashboard/admin/handlers.js

/**
 * Módulo para Manipuladores de Ações de Admin (Handlers).
 *
 * Este script centraliza a lógica de negócio para ações específicas
 * realizadas por gerentes e administradores, como atualizar o status de uma
 * reserva, gerenciar as permissões de um usuário ou criar um novo tipo
 * de equipamento.
 *
 * Cada função aqui é tipicamente chamada a partir do `listeners.js` em
 * resposta a um evento de clique ou submissão e encapsula a comunicação
 * com a API e a subsequente atualização da interface do usuário.
 *
 * Funcionalidades:
 * - `handleUpdateReservationStatus`: Aprova, rejeita ou abre o modal de devolução de uma reserva.
 * - `handleUserAction`: Promove, rebaixa, ativa/desativa ou deleta um usuário.
 * - `handleEquipmentTypeSubmit`: Lida com a criação ou edição de um tipo de equipamento.
 *
 * Dependências:
 * - `api.js`: Para a comunicação com a API.
 * - `ui.js`: Para interações com a UI, como exibir toasts e controlar o estado de botões.
 * - `renderers.js`: Para renderizar novamente componentes, como os botões de ação, após uma atualização.
 * - `inventoryViews.js`: Para recarregar a view de inventário após uma alteração.
 */


import { API_URL, apiFetch } from '../api.js';
import { showToast, setButtonLoading, renderStatusBadge, renderRoleBadge } from '../ui.js';
import { renderAdminReservationActions, renderUserActions } from './renderers.js';
import { loadManageInventoryView } from './inventoryViews.js';

/**
 * Lida com as ações de gerenciamento de uma reserva (aprovar, rejeitar, devolver, notificar).
 * @param {HTMLElement} button - O botão que acionou a ação.
 * @param {string} token - O token de autenticação.
 */
export async function handleUpdateReservationStatus(button, token) {
    const { reservationId, action, unitIdentifier, userIdentifier } = button.dataset;

    // Se a ação for 'returned', abre o modal de devolução em vez de fazer uma chamada direta à API.
    if (action === 'returned') {
        const returnModal = new bootstrap.Modal(document.getElementById('returnModal'));
        document.getElementById('returnReservationId').value = reservationId;
        document.getElementById('returnUnitIdentifier').textContent = unitIdentifier;
        document.getElementById('returnUserIdentifier').textContent = userIdentifier;
        document.getElementById('returnForm').reset();
        document.getElementById('returnMessage').innerHTML = '';
        returnModal.show();
        return;
    }
    
    setButtonLoading(button, true);
    try {
        let updated;
        if (action === 'notify-overdue') {
            // Caso especial para notificar atraso.
            await apiFetch(`${API_URL}/admin/reservations/${reservationId}/notify-overdue`, token, { method: 'POST' });
            showToast('Notificação de atraso enviada!', 'success');
        } else {
            // Para outras ações (approved, rejected), atualiza o status.
            updated = await apiFetch(`${API_URL}/admin/reservations/${reservationId}`, token, { method: 'PATCH', body: { status: action } });
            
            // Atualiza a linha da tabela dinamicamente com os novos dados.
            const row = document.getElementById(`reservation-row-${updated.id}`);
            if (row) {
                row.querySelector('.status-cell').innerHTML = renderStatusBadge(updated.status);
                row.querySelector('.action-cell').innerHTML = renderAdminReservationActions(updated);
            }
            showToast('Status da reserva atualizado!', 'success');
        }
    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Lida com as ações de gerenciamento de um usuário (promover, rebaixar, ativar, deletar, etc.).
 * @param {HTMLElement} button - O botão que acionou a ação.
 * @param {string} token - O token de autenticação.
 * @param {number} currentUserId - O ID do administrador logado (para evitar auto-ações).
 */
export async function handleUserAction(button, token, currentUserId) {
    const { userId, action, currentRole, isActive } = button.dataset;
    
    if (action === 'delete' && !confirm(`Tem certeza que deseja deletar o usuário ID ${userId}?`)) return;

    // Se a ação for 'change-sector', abre o modal de mudança de setor.
    if (action === 'change-sector') {
        const modal = new bootstrap.Modal(document.getElementById('userSectorModal'));
        const form = document.getElementById('userSectorForm');
        form.dataset.userId = userId;
        
        const sectorSelect = document.getElementById('userSectorSelect');
        sectorSelect.innerHTML = '<option>Carregando...</option>';
        
        // Busca a lista de setores para popular o dropdown do modal.
        const sectorsData = await apiFetch(`${API_URL}/sectors/?size=1000`, token);
        sectorSelect.innerHTML = '<option value="">Nenhum</option>' + sectorsData.items.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        modal.show();
        return;
    }
    
    setButtonLoading(button, true);

    // Lógica para determinar a nova permissão (role) ao promover/rebaixar.
    const roles = ['user', 'requester', 'manager', 'admin'];
    const currentRoleIndex = roles.indexOf(currentRole);
    let newRole = '';

    if (action === 'promote') {
        if (currentRoleIndex < roles.length - 1) newRole = roles[currentRoleIndex + 1];
    } else if (action === 'demote') {
        if (currentRoleIndex > 0) newRole = roles[currentRoleIndex - 1];
    }

    try {
        let updated;
        if (action === 'promote' || action === 'demote') {
            if (!newRole) {
                showToast('Ação inválida para este nível de usuário.', 'warning');
            } else {
                updated = await apiFetch(`${API_URL}/admin/users/${userId}/role`, token, { method: 'PATCH', body: { role: newRole } });
                showToast('Permissão alterada!', 'success');
            }
        } else if (action === 'toggle-active') {
            const newStatus = isActive !== 'true';
            updated = await apiFetch(`${API_URL}/admin/users/${userId}/status`, token, { method: 'PATCH', body: { is_active: newStatus } });
            showToast(`Usuário ${newStatus ? 'ativado' : 'desativado'}!`, 'success');
        } else if (action === 'delete') {
            await apiFetch(`${API_URL}/admin/users/${userId}`, token, { method: 'DELETE' });
            document.getElementById(`user-row-${userId}`).remove();
            showToast('Usuário deletado!', 'success');
        }

        // Se uma ação resultou em um usuário atualizado, atualiza a UI.
        if (updated) {
            const row = document.getElementById(`user-row-${updated.id}`);
            if (row) {
                row.querySelector('.role-cell').innerHTML = renderRoleBadge(updated.role);
                row.querySelector('.status-cell').innerHTML = updated.is_active ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-danger">Inativo</span>';
                row.querySelector('.action-cell').innerHTML = renderUserActions(updated, currentUserId);
            }
        }
    } catch (e) {
        // --- INÍCIO DA ALTERAÇÃO ---
        showToast(`Erro: ${e.message}`, 'danger');
        // --- FIM DA ALTERAÇÃO ---
    } finally {
        if (action !== 'delete') {
            setButtonLoading(button, false);
        }
    }
}

/**
 * Lida com a submissão do formulário de criação ou edição de um tipo de equipamento.
 * @param {string} token - O token de autenticação.
 */
export async function handleEquipmentTypeSubmit(token) {
    const form = document.getElementById('equipmentTypeForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('equipmentTypeMessage');
    const typeId = form.equipmentTypeId.value;
    
    // Coleta os dados do formulário.
    const typeData = {
        name: form.typeName.value,
        category: form.typeCategory.value,
        description: form.typeDescription.value
    };

    setButtonLoading(submitButton, true, 'Salvando...');
    messageDiv.innerHTML = '';
    try {
        // Decide se a operação é de criação (POST) ou atualização (PUT).
        const method = typeId ? 'PUT' : 'POST';
        const url = typeId ? `${API_URL}/equipments/types/${typeId}` : `${API_URL}/equipments/types`;
        
        await apiFetch(url, token, { method, body: typeData });
        
        showToast(`Tipo ${typeId ? 'atualizado' : 'criado'}!`, 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        
        // Recarrega a view de inventário para refletir as alterações.
        loadManageInventoryView(token, {});

    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}