// js/dashboard/views/account.js

/**
 * Módulo da View "Minha Conta".
 *
 * Este script é responsável por carregar e renderizar a página de gestão
 * de perfil do utilizador. Ele constrói dinamicamente a interface com base
 * nos dados do utilizador atual, permitindo que ele atualize as suas informações,
 * gira as definições de segurança e as integrações.
 *
 * Funcionalidades:
 * - `loadMyAccountView()`: A função principal que busca os dados necessários (como a lista de setores)
 * e renderiza o layout completo da página "Minha Conta".
 * - Renderização condicional de botões e textos com base no estado do utilizador
 * (por exemplo, se o 2FA está ativo ou se a conta Google está conectada).
 *
 * Dependências:
 * - `api.js`: Para a comunicação com a API.
 * - `ui.js`: Para a renderização da view principal.
 */


import { API_URL, apiFetch } from '../api.js';
import { renderView } from '../ui.js';

/**
 * Carrega e renderiza a view "Minha Conta".
 * @param {object} currentUser - O objeto com os dados do utilizador autenticado.
 * @param {string} token - O token de autenticação.
 */
export async function loadMyAccountView(currentUser, token) {
    // Decide qual botão de 2FA exibir: "Ativar" se estiver desativado, "Desativar" se estiver ativo.
    const twoFactorButton = currentUser.otp_enabled
        ? `<button class="btn btn-outline-warning" id="disable2faBtn"><i class="bi bi-shield-slash me-2"></i>Desativar 2FA</button>`
        : `<button class="btn btn-primary" id="enable2faBtn"><i class="bi bi-shield-check me-2"></i>Ativar 2FA</button>`;

    // Define o conteúdo do card de integração com o Google com base no estado da conexão.
    const googleIntegrationContent = currentUser.has_google_token
        ? `
            <p class="card-text text-success"><i class="bi bi-check-circle-fill me-2"></i>A sua conta Google está conectada.</p>
            <p class="card-text"><small>As reservas aprovadas serão adicionadas à sua agenda.</small></p>
            <button class="btn btn-outline-danger" id="disconnectGoogleBtn"><i class="bi bi-google me-2"></i>Desconectar</button>
        `
        : `
            <p class="card-text">Conecte a sua conta Google para que as suas reservas aprovadas sejam adicionadas automaticamente ao seu calendário.</p>
            <button class="btn btn-outline-primary" id="connectGoogleBtn"><i class="bi bi-google me-2"></i>Conectar com o Google</button>
        `;

    // Busca a lista completa de setores para popular o campo de seleção.
    const sectorsData = await apiFetch(`${API_URL}/sectors/?size=1000`, token);
    const sectorOptions = sectorsData.items.map(s =>
        // Marca o setor atual do utilizador como selecionado.
        `<option value="${s.id}" ${currentUser.sector && currentUser.sector.id === s.id ? 'selected' : ''}>${s.name}</option>`
    ).join('');

    // Renderiza a estrutura HTML completa da página.
    renderView(`
        <div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Minha Conta</h1>
        </div>
        <div id="accountContainer">
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Atualizar Perfil</h5>
                            <form id="updateProfileForm">
                                <div class="mb-3">
                                    <label for="profileUsername" class="form-label">Nome de utilizador</label>
                                    <input type="text" class="form-control" id="profileUsername" value="${currentUser.username}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="profileSector" class="form-label">O Meu Setor</label>
                                    <select id="profileSector" class="form-select">
                                        <option value="">Nenhum</option>
                                        ${sectorOptions}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="profileEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="profileEmail" value="${currentUser.email}" disabled>
                                    <div class="form-text">O e-mail não pode ser alterado.</div>
                                </div>
                                <button type="submit" class="btn btn-primary">Guardar Alterações</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Segurança</h5>
                            <p class="card-text">Aumente a segurança da sua conta com a autenticação de dois fatores (2FA). Você precisará de uma app de autenticação como o Google Authenticator.</p>
                            <div id="2fa-button-container">
                                ${twoFactorButton}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-4">
                     <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Integração com o Google Agenda</h5>
                            ${googleIntegrationContent}
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <div class="card border-danger">
                    <div class="card-body">
                        <h5 class="card-title text-danger">Área de Risco</h5>
                        <p class="card-text">Eliminar a sua conta é uma ação irreversível. Todos os seus dados, incluindo o histórico de reservas, serão removidos permanentemente.</p>
                        <button class="btn btn-danger" id="deleteAccountBtn">Eliminar a Minha Conta</button>
                    </div>
                </div>
            </div>
        </div>
    `);
}