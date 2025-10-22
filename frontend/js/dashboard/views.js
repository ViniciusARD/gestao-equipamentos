// js/dashboard/views.js

/**
 * Módulo Agregador de Views do Dashboard.
 *
 * Este script funciona como um "barril" (barrel file), um ponto de entrada central
 * para todas as funções de renderização de views (visualizações) do painel.
 *
 * Sua única responsabilidade é importar todas as funções de módulos de view
 * separados (como `home.js`, `equipments.js`, etc.) e reexportá-las.
 * Isso simplifica a importação em outros arquivos, como `main.js`, que agora
 * pode importar todas as views a partir de um único local.
 *
 * Dependências:
 * - Módulos de view individuais (`./views/home.js`, `./views/equipments.js`, etc.).
 */


export * from './views/home.js';
export * from './views/equipments.js';
export * from './views/reservations.js';
export * from './views/account.js';