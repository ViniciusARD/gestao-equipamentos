// js/dashboard/events/forms.js

/**
 * Módulo para Manipuladores de Submissão de Formulários.
 *
 * Este script contém todas as funções que são acionadas quando um formulário
 * no painel de controlo é submetido. Cada função encapsula a lógica para uma
 * ação específica, como criar uma reserva, atualizar o perfil do utilizador,
 * ou gerir entidades como setores e unidades de equipamento.
 *
 * Funcionalidades:
 * - `handleReservationSubmit`: Envia uma nova solicitação de reserva.
 * - `handleUpdateProfile`: Atualiza o nome de utilizador e o setor do utilizador logado.
 * - `handleAdminUpdateSector`: Permite que um admin altere o setor de outro utilizador.
 * - `handleReturnSubmit`: Regista a devolução de um equipamento.
 * - `handleSectorFormSubmit`: Cria ou atualiza um setor.
 * - `handleUnitFormSubmit`: Cria ou atualiza uma unidade de equipamento.
 * - `handleEnable2FASubmit`: Finaliza a ativação da autenticação de dois fatores.
 *
 * Dependências:
 * - `api.js`: Para fazer chamadas à API.
 * - `ui.js`: Para interagir com a UI (mostrar toasts, modais, etc.).
 * - `admin.js`, `views.js`: Para recarregar as vistas após uma submissão bem-sucedida.
 */


import { API_URL, apiFetch } from '../api.js';
import { showToast, setButtonLoading, renderStatusBadge, resetUnitForm } from '../ui.js'; 
import { handleEquipmentTypeSubmit, loadManageSectorsView, loadManageUnitsView, populateUnitsTable } from '../admin.js'; // <-- MUDANÇA AQUI
import { loadMyAccountView, loadMyReservationsView } from '../views.js';
import { applyMyReservationsFilter } from './filters.js';

// Reexporta a função do admin para manter o ponto de acesso centralizado.
export { handleEquipmentTypeSubmit }; 

/**
 * Lida com a submissão do formulário de criação de reserva.
 * @param {object} appState - O estado global da aplicação.
 */
export async function handleReservationSubmit(appState) {
    const token = appState.token;
    const form = document.getElementById('reservationForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('reservationMessage');
    
    // Recolhe os dados do formulário.
    const unit_id = form.unitIdToReserve.value;
    const start_time = new Date(form.startTime.value);
    const end_time = new Date(form.endTime.value);

    // Validação simples das datas.
    if (isNaN(start_time) || isNaN(end_time) || start_time >= end_time) {
        messageDiv.innerHTML = '<div class="alert alert-danger">Datas inválidas.</div>';
        return;
    }

    setButtonLoading(submitButton, true, 'Enviando...');
    messageDiv.innerHTML = '';
    try {
        // Envia a requisição para a API para criar a reserva.
        await apiFetch(`${API_URL}/reservations/`, token, {
            method: 'POST',
            body: {
                unit_id: parseInt(unit_id),
                start_time: start_time.toISOString(),
                end_time: end_time.toISOString()
            }
        });
        showToast('Reserva solicitada com sucesso!', 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide(); // Fecha o modal.
        form.reset();
        applyMyReservationsFilter(appState); // Recarrega a lista de reservas do utilizador.
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Lida com a submissão do formulário de atualização de perfil do utilizador.
 * @param {object} appState - O estado global da aplicação.
 */
export async function handleUpdateProfile(appState) {
    const token = appState.token;
    const form = document.getElementById('updateProfileForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const newUsername = document.getElementById('profileUsername').value;
    const newSectorId = document.getElementById('profileSector').value;

    const payload = {};
    let changed = false;

    // Verifica se o nome de utilizador foi alterado.
    if (newUsername !== appState.currentUser.username) {
        payload.username = newUsername;
        changed = true;
    }
    
    // Verifica se o setor foi alterado.
    const currentSectorId = appState.currentUser.sector ? appState.currentUser.sector.id.toString() : "";
    if (newSectorId !== currentSectorId) {
        payload.sector_id = newSectorId ? parseInt(newSectorId) : null;
        changed = true;
    }

    if (!changed) {
        showToast('Nenhuma alteração para guardar.', 'info');
        return;
    }

    setButtonLoading(submitButton, true, 'Guardando...');
    try {
        // Envia a requisição para a API para atualizar os dados.
        const updatedUser = await apiFetch(`${API_URL}/users/me`, token, {
            method: 'PUT',
            body: payload
        });

        // Atualiza o estado da aplicação com os novos dados do utilizador.
        appState.currentUser = updatedUser;
        document.getElementById('user-greeting').textContent = `Olá, ${updatedUser.username}!`;
        showToast('Perfil atualizado com sucesso!', 'success');

    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
        // Reverte as alterações no formulário em caso de erro.
        document.getElementById('profileUsername').value = appState.currentUser.username;
        document.getElementById('profileSector').value = currentSectorId;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Lida com a submissão do formulário de alteração de setor de um utilizador (visão do admin).
 * @param {object} appState - O estado global da aplicação.
 */
export async function handleAdminUpdateSector(appState) {
    const token = appState.token;
    const form = document.getElementById('userSectorForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const userId = form.dataset.userId;
    const sector_id = document.getElementById('userSectorSelect').value;

    setButtonLoading(submitButton, true, 'Guardando...');
    try {
        const updatedUser = await apiFetch(`${API_URL}/admin/users/${userId}/sector`, token, {
            method: 'PATCH',
            body: { sector_id: sector_id ? parseInt(sector_id) : null }
        });

        // Atualiza a célula do setor na tabela de utilizadores com o novo valor.
        const row = document.getElementById(`user-row-${userId}`);
        if (row) {
            row.querySelector('.sector-cell').innerHTML = updatedUser.sector ? updatedUser.sector.name : '<span class="text-muted">N/A</span>';
        }
        
        showToast("Setor do utilizador atualizado!", 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
    } catch (e) {
        showToast(`Erro: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Lida com a submissão do formulário de registo de devolução de equipamento.
 * @param {object} appState - O estado global da aplicação.
 */
export async function handleReturnSubmit(appState) {
    const token = appState.token;
    const form = document.getElementById('returnForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('returnMessage');
    const reservationId = document.getElementById('returnReservationId').value;

    // Monta o corpo da requisição com os dados da devolução.
    const payload = {
        status: 'returned',
        return_status: form.querySelector('input[name="returnStatus"]:checked').value,
        return_notes: document.getElementById('returnNotes').value.trim()
    };

    setButtonLoading(submitButton, true, 'Confirmando...');
    messageDiv.innerHTML = '';

    try {
        const updated = await apiFetch(`${API_URL}/admin/reservations/${reservationId}`, token, {
            method: 'PATCH',
            body: payload
        });

        // Atualiza a linha da reserva na tabela para refletir o novo status.
        const row = document.getElementById(`reservation-row-${updated.id}`);
        if (row) {
            row.querySelector('.status-cell').innerHTML = renderStatusBadge(updated.status);
            row.querySelector('.action-cell').innerHTML = '---'; // Remove os botões de ação.
        }
        
        showToast('Devolução registada com sucesso!', 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();

    } catch(e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Lida com a submissão do formulário de criação/edição de setor.
 * @param {object} appState - O estado global da aplicação.
 */
export async function handleSectorFormSubmit(appState) {
    const token = appState.token;
    const form = document.getElementById('sectorForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('sectorMessage');
    const sectorId = form.sectorId.value;
    const sectorName = form.sectorName.value;

    setButtonLoading(submitButton, true, 'Guardando...');
    messageDiv.innerHTML = '';
    
    try {
        // Decide se a operação é de criação (POST) ou atualização (PUT).
        const method = sectorId ? 'PUT' : 'POST';
        const url = sectorId ? `${API_URL}/sectors/${sectorId}` : `${API_URL}/sectors`;
        await apiFetch(url, token, {
            method,
            body: { name: sectorName }
        });
        showToast(`Setor ${sectorId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        loadManageSectorsView(token); // Recarrega a vista de setores.
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Lida com a submissão do formulário de criação/edição de unidade de equipamento.
 * @param {object} appState - O estado global da aplicação.
 */
export async function handleUnitFormSubmit(appState) {
    const token = appState.token;
    const form = document.getElementById('unitForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('unitFormMessage');
    const typeId = form.unitFormTypeId.value;
    const unitId = form.unitFormUnitId.value;
    
    // Recolhe os dados do formulário.
    const unitData = {
        type_id: parseInt(typeId),
        identifier_code: form.unitIdentifier.value,
        serial_number: form.serialNumber.value,
        status: form.unitStatus.value,
        quantity: parseInt(form.unitQuantity.value)
    };

    setButtonLoading(submitButton, true, 'Guardando...');
    messageDiv.innerHTML = '';
    try {
        const method = unitId ? 'PUT' : 'POST';
        const url = unitId ? `${API_URL}/equipments/units/${unitId}` : `${API_URL}/equipments/units`;
        // O corpo da requisição é diferente para criação e edição.
        const bodyData = unitId ? { identifier_code: unitData.identifier_code, serial_number: unitData.serial_number, status: unitData.status } : unitData;
        
        await apiFetch(url, token, { method, body: bodyData });
        
        showToast(`Unidade ${unitId ? 'atualizada' : 'criada'} com sucesso!`, 'success');
        
        // Recarrega a lista de unidades para mostrar a alteração.
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        populateUnitsTable(type.units, token);
        resetUnitForm(); // Limpa o formulário.
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Lida com a submissão do formulário de ativação da autenticação de dois fatores.
 * @param {object} appState - O estado global da aplicação.
 */
export async function handleEnable2FASubmit(appState) {
    const token = appState.token;
    const form = document.getElementById('2faEnableForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('2faEnableMessage');
    
    const otp_secret = document.getElementById('otpSecret').value;
    const otp_code = document.getElementById('otpEnableCode').value;

    setButtonLoading(submitButton, true, 'Ativando...');
    messageDiv.innerHTML = '';
    
    try {
        await apiFetch(`${API_URL}/2fa/enable`, token, {
            method: 'POST',
            body: { otp_secret, otp_code }
        });
        showToast('Autenticação de dois fatores ativada com sucesso!', 'success');
        // Atualiza o estado da aplicação e recarrega a vista da conta.
        appState.currentUser.otp_enabled = true;
        loadMyAccountView(appState.currentUser, token);
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
    } catch (e) {
        messageDiv.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    } finally {
        setButtonLoading(submitButton, false);
    }
}