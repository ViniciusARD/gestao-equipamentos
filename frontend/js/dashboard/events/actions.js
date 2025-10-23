// js/dashboard/events/actions.js

/**
 * Módulo para Manipuladores de Ações de Botões (Actions).
 *
 * Este script contém as funções de lógica de negócio que são acionadas
 * por cliques em botões específicos no painel, especialmente aqueles que
 * não envolvem a submissão de um formulário principal. Ele lida com a
 * orquestração de chamadas à API e a subsequente manipulação da UI para
 * ações como gestão de inventário, segurança da conta e integrações.
 *
 * Cada função encapsula uma ação discreta, tornando o código mais modular
 * e fácil de manter.
 *
 * Funcionalidades:
 * - `handleInventoryAction`: Direciona ações da tela de inventário (criar/editar tipo, ver unidades).
 * - `handleUnitAction`: Lida com ações para uma unidade específica (editar, deletar, ver histórico).
 * - `prepareUnitFormForEdit`: Prepara o formulário de unidade para o modo de edição.
 * - `handleGoogleConnect`: Inicia o fluxo de conexão com a conta Google.
 * - `handleGoogleDisconnect`: Desconecta a conta Google do utilizador.
 * - `handleDeleteAccount`: Gerencia o processo de auto-exclusão de conta.
 * - `handleEnable2FA`/`handleDisable2FA`: Lidam com a ativação e desativação da autenticação de dois fatores.
 * - `handleSectorAction`: Lida com a edição e exclusão de setores.
 *
 * Dependências:
 * - `api.js`: Para comunicação com a API.
 * - `ui.js`: Para interagir com a UI (modais, toasts, etc.).
 * - `views.js`, `admin.js`: Para recarregar ou navegar para outras vistas.
 */


import { API_URL, apiFetch } from '../api.js';
import { showToast, setButtonLoading, openEquipmentTypeModal, openUnitHistoryModal, openSectorModal } from '../ui.js';
import { loadMyAccountView } from '../views.js';
import { loadManageUnitsView } from '../admin.js';

/**
 * Manipula as ações de clique na view de gerenciamento de inventário.
 * @param {HTMLElement} button - O botão que foi clicado.
 * @param {string} token - O token de autenticação.
 */
export async function handleInventoryAction(button, token) {
    const { action, typeId } = button.dataset;

    if (action === 'create-type') {
        openEquipmentTypeModal(); // Abre o modal para criar um novo tipo.
    } else if (action === 'edit-type') {
        // Busca os dados do tipo e abre o modal preenchido para edição.
        const type = await apiFetch(`${API_URL}/equipments/types/${typeId}`, token);
        openEquipmentTypeModal(type);
    } else if (action === 'view-units') {
        // Carrega a view dedicada para gerenciar as unidades deste tipo.
        loadManageUnitsView(token, typeId);
    } else if (action === 'delete-type') {
        if (!confirm('Deseja deletar este tipo? Todas as unidades associadas também serão removidas.')) return;
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/types/${typeId}`, token, { method: 'DELETE' });
            document.getElementById(`inventory-row-${typeId}`).remove(); // Remove o card da UI.
            showToast('Tipo de equipamento deletado!', 'success');
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'danger');
            setButtonLoading(button, false);
        }
    }
}

/**
 * Manipula as ações de clique na tabela de unidades de equipamento.
 * @param {HTMLElement} button - O botão que foi clicado.
 * @param {string} token - O token de autenticação.
 */
export async function handleUnitAction(button, token) {
    const { action, unitId } = button.dataset;
    if (action === 'edit') {
        // Extrai os dados da linha da tabela e prepara o formulário para edição.
        const unitToEdit = {
            id: unitId,
            identifier_code: document.querySelector(`#unit-row-${unitId} td:nth-child(2)`).textContent,
            serial_number: document.querySelector(`#unit-row-${unitId} td:nth-child(3)`).textContent,
            status: document.querySelector(`#unit-row-${unitId} .badge`).textContent.toLowerCase(),
        };
        prepareUnitFormForEdit(unitToEdit);
    } else if (action === 'delete') {
        if (!confirm('Tem certeza que deseja deletar esta unidade?')) return;
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/equipments/units/${unitId}`, token, { method: 'DELETE' });
            document.getElementById(`unit-row-${unitId}`).remove(); // Remove a linha da tabela.
            showToast('Unidade deletada!', 'success');
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'danger');
            setButtonLoading(button, false);
        }
    } else if (action === 'history') {
        // Abre o modal para visualizar o histórico da unidade.
        openUnitHistoryModal(unitId, token);
    }
}

/**
 * Prepara o formulário de unidade para o modo de edição, preenchendo os campos.
 * @param {object} unit - O objeto da unidade a ser editada.
 */
export function prepareUnitFormForEdit(unit) {
    document.getElementById('unitFormTitle').textContent = `Editar Unidade ID: ${unit.id}`;
    document.getElementById('unitFormUnitId').value = unit.id;
    document.getElementById('unitIdentifier').value = unit.identifier_code;
    document.getElementById('serialNumber').value = unit.serial_number;
    document.getElementById('unitStatus').value = unit.status;
    document.getElementById('unitQuantity').value = 1;
    document.getElementById('unitQuantity').disabled = true; // Não se pode alterar a quantidade na edição.
    document.getElementById('cancelEditUnitBtn').classList.remove('d-none');
}

/**
 * Inicia o fluxo de conexão com a conta Google.
 * @param {HTMLElement} button - O botão "Conectar com o Google".
 * @param {string} token - O token de autenticação.
 */
export async function handleGoogleConnect(button, token) {
    setButtonLoading(button, true);
    try {
        // Pede à API a URL de autorização do Google.
        const response = await apiFetch(`${API_URL}/google/login`, token);
        // Abre a URL de autorização numa nova aba para o utilizador.
        window.open(response.authorization_url, '_blank');
        showToast('Abra a nova aba para autorizar o acesso à sua conta Google.', 'info');
    } catch (e) {
        showToast(`Erro ao iniciar conexão: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Desconecta a conta Google do utilizador.
 * @param {HTMLElement} button - O botão "Desconectar".
 * @param {string} token - O token de autenticação.
 * @param {object} appState - O estado da aplicação, para atualizar o `currentUser`.
 */
export async function handleGoogleDisconnect(button, token, appState) {
    if (!confirm('Tem certeza que deseja desconectar sua conta Google?')) {
        return;
    }
    setButtonLoading(button, true);
    try {
        await apiFetch(`${API_URL}/google/disconnect`, token, { method: 'DELETE' });
        showToast('Conta Google desconectada com sucesso!', 'success');
        // Atualiza o estado da aplicação e recarrega a view "Minha Conta".
        appState.currentUser.has_google_token = false;
        loadMyAccountView(appState.currentUser, token);
    } catch (e) {
        showToast(`Erro ao desconectar: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Lida com a ação de deletar a própria conta.
 * @param {HTMLElement} button - O botão "Eliminar a Minha Conta".
 * @param {string} token - O token de autenticação.
 * @param {object} appState - O estado da aplicação, para acionar o logout.
 */
export async function handleDeleteAccount(button, token, appState) {
    // Pede uma confirmação textual para evitar ações acidentais.
    const confirmation = prompt('Esta ação é irreversível. Para confirmar, digite "deletar minha conta":');
    if (confirmation !== 'deletar minha conta') {
        showToast('Ação cancelada.', 'info');
        return;
    }

    setButtonLoading(button, true);
    try {
        await apiFetch(`${API_URL}/users/me`, token, { method: 'DELETE' });
        showToast('Sua conta foi deletada. Você será desconectado.', 'success');
        // Desloga o utilizador após um breve atraso.
        setTimeout(() => appState.logout(), 3000);
    } catch (e) {
        showToast(`Erro ao deletar conta: ${e.message}`, 'danger');
        setButtonLoading(button, false);
    }
}

/**
 * Inicia o fluxo de configuração da autenticação de dois fatores (2FA).
 * @param {string} token - O token de autenticação.
 */
export async function handleEnable2FA(token) {
    const modal = new bootstrap.Modal(document.getElementById('2faSetupModal'));
    const qrContainer = document.getElementById('qrCodeContainer');
    const otpSecretInput = document.getElementById('otpSecret');
    
    qrContainer.innerHTML = '<div class="spinner-border"></div>';
    modal.show();

    try {
        // Pede à API um novo segredo e a URI para o QR code.
        const setupData = await apiFetch(`${API_URL}/2fa/setup`, token);
        otpSecretInput.value = setupData.otp_secret;
        
        // Pede à API para gerar a imagem do QR Code.
        const qrCodeUrl = `${API_URL}/2fa/qr-code?provisioning_uri=${encodeURIComponent(setupData.provisioning_uri)}`;
        qrContainer.innerHTML = `<img src="${qrCodeUrl}" alt="QR Code para 2FA" class="img-fluid qr-code-image">`;

    } catch (e) {
        qrContainer.innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
}

/**
 * Lida com a desativação da autenticação de dois fatores.
 * @param {string} token - O token de autenticação.
 * @param {object} appState - O estado da aplicação, para atualizar o `currentUser`.
 */
export async function handleDisable2FA(token, appState) {
    // Pede a senha como camada extra de segurança.
    const password = prompt("Para desativar a autenticação de dois fatores, por favor, insira sua senha:");
    if (!password) return;

    // Pede um código OTP válido para confirmar a ação.
    const otp_code = prompt("Agora, insira um código do seu aplicativo autenticador:");
    if (!otp_code) return;
    
    const button = document.getElementById('disable2faBtn');
    setButtonLoading(button, true);

    try {
        await apiFetch(`${API_URL}/2fa/disable`, token, {
            method: 'POST',
            body: { password, otp_code }
        });
        showToast('Autenticação de dois fatores desativada com sucesso!', 'success');
        // Atualiza o estado e recarrega a view "Minha Conta".
        appState.currentUser.otp_enabled = false;
        loadMyAccountView(appState.currentUser, token);
    } catch (e) {
        showToast(`Erro ao desativar 2FA: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Manipula as ações de clique na tabela de gerenciamento de setores.
 * @param {HTMLElement} button - O botão que foi clicado.
 * @param {string} token - O token de autenticação.
 */
export async function handleSectorAction(button, token) {
    const { action, sectorId, sectorName } = button.dataset;

    if (action === 'edit') {
        // Abre o modal de setor, pré-preenchido com os dados para edição.
        openSectorModal({ id: sectorId, name: sectorName });
    } else if (action === 'delete') {
        if (!confirm(`Tem certeza que deseja deletar o setor "${sectorName}"? Esta ação não pode ser desfeita.`)) return;
        
        setButtonLoading(button, true);
        try {
            await apiFetch(`${API_URL}/sectors/${sectorId}`, token, { method: 'DELETE' });
            document.getElementById(`sector-row-${sectorId}`).remove(); // Remove a linha da tabela.
            showToast('Setor deletado com sucesso!', 'success');
        } catch (e) {
            showToast(`Erro: ${e.message}`, 'danger');
            setButtonLoading(button, false);
        }
    }
}

/**
 * Handles the log export action.
 * @param {object} appState - The global application state.
 */
export async function handleExportLogs(appState) {
    const token = appState.token;
    const button = document.getElementById('exportLogsBtn');
    setButtonLoading(button, true, 'Exportando...');

    try {
        // 1. Get current filter values
        const params = {
            search: document.getElementById('logsSearchInput')?.value.trim(),
            level: document.getElementById('logsLevelFilter')?.value,
            user_id: document.getElementById('logsUserFilter')?.value,
            start_date: document.getElementById('logsStartDate')?.value,
            end_date: document.getElementById('logsEndDate')?.value,
        };

        // 2. Build URL with filters
        const url = new URL(`${API_URL}/admin/logs/export`);
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        });

        // 3. Fetch the text file from the backend
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Falha ao exportar logs.');
        }

        // 4. Create a Blob and trigger download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        
        // Extract filename from Content-Disposition header
        const disposition = response.headers.get('content-disposition');
        let filename = 'equipcontrol_audit_log.txt';
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
        
        showToast('Exportação concluída!', 'success');

    } catch (e) {
        showToast(`Erro ao exportar: ${e.message}`, 'danger');
    } finally {
        setButtonLoading(button, false);
    }
}