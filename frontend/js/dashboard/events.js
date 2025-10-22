// js/dashboard/events.js

/**
 * Módulo de Entrada para Eventos do Dashboard.
 *
 * Este script funciona como o ponto de entrada principal para a inicialização de
 * todos os eventos da interface do usuário no painel de controle.
 *
 * Sua única responsabilidade é importar a função de inicialização do módulo
 * `listeners.js` e reexportá-la para ser consumida pelo `main.js`. Isso
 * centraliza o ponto de acesso à lógica de eventos e torna o código mais modular.
 *
 * Dependências:
 * - `listeners.js`: Onde a lógica principal de manipulação de eventos está implementada.
 */


import { initializeEvents as init } from './events/listeners.js';

/**
 * Inicializa os "escutadores" de eventos globais da aplicação.
 * @param {object} state - O objeto de estado global da aplicação (appState).
 */
export function initializeEvents(state) {
    // Chama a função de inicialização importada do módulo de listeners.
    init(state);
}