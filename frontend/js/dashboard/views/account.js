// js/dashboard/views/account.js

import { API_URL, apiFetch } from '../api.js';
import { renderView } from '../ui.js';

export async function loadMyAccountView(currentUser, token) {
    const twoFactorButton = currentUser.otp_enabled
        ? `<button class="btn btn-outline-warning" id="disable2faBtn"><i class="bi bi-shield-slash me-2"></i>Desativar 2FA</button>`
        : `<button class="btn btn-primary" id="enable2faBtn"><i class="bi bi-shield-check me-2"></i>Ativar 2FA</button>`;

    const sectors = await apiFetch(`${API_URL}/sectors`, token);
    const sectorOptions = sectors.map(s =>
        `<option value="${s.id}" ${currentUser.sector && currentUser.sector.id === s.id ? 'selected' : ''}>${s.name}</option>`
    ).join('');

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
                                    <label for="profileUsername" class="form-label">Nome de usuário</label>
                                    <input type="text" class="form-control" id="profileUsername" value="${currentUser.username}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="profileSector" class="form-label">Meu Setor</label>
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
                                <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Segurança</h5>
                            <p class="card-text">Aumente a segurança da sua conta com a autenticação de dois fatores (2FA). Você precisará de um app autenticador como o Google Authenticator.</p>
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
                            <h5 class="card-title">Integração com Google Agenda</h5>
                            <p class="card-text">Conecte sua conta Google para que suas reservas aprovadas sejam adicionadas automaticamente ao seu calendário.</p>
                            <button class="btn btn-outline-primary" id="connectGoogleBtn"><i class="bi bi-google me-2"></i>Conectar com Google</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <div class="card border-danger">
                    <div class="card-body">
                        <h5 class="card-title text-danger">Área de Risco</h5>
                        <p class="card-text">Deletar sua conta é uma ação irreversível. Todos os seus dados, incluindo histórico de reservas, serão removidos permanentemente.</p>
                        <button class="btn btn-danger" id="deleteAccountBtn">Deletar Minha Conta</button>
                    </div>
                </div>
            </div>
        </div>
    `);
}