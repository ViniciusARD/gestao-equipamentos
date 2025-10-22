// js/dashboard/admin.js

/**
 * Módulo Agregador para Funcionalidades de Administração.
 *
 * Este script funciona como um "barril" (barrel file), centralizando a exportação
 * de todas as funcionalidades relacionadas ao painel de administração. Ele agrupa
 * os módulos de renderização, visualizações (views), manipuladores de eventos (handlers)
 * e a lógica do painel de análise.
 *
 * O objetivo é simplificar a importação de funcionalidades de admin em outros
 * arquivos, como o `listeners.js`, que pode importar tudo o que precisa a partir
 * deste único ponto de acesso.
 *
 * Dependências:
 * - Módulos de admin individuais (`./admin/renderers.js`, `./admin/userViews.js`, etc.).
 */


// Importa e exporta as funções de renderização de UI específica do admin
export * from './admin/renderers.js';

// Importa e exporta as funções que carregam as views do painel de admin
export * from './admin/userViews.js';
export * from './admin/inventoryViews.js';


// Importa e exporta as funções que lidam com ações e eventos do admin
export * from './admin/handlers.js';

// Importa e exporta as funções do painel de análise
export * from './admin/analytics.js';