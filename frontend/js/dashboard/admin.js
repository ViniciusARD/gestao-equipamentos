// js/dashboard/admin.js

// Importa e exporta as funções de renderização de UI específica do admin
export * from './admin/renderers.js';

// Importa e exporta as funções que carregam as views do painel de admin
export * from './admin/views.js';

// Importa e exporta as funções que lidam com ações e eventos do admin
export * from './admin/handlers.js';

// Exporta a função do painel de análise para manter a compatibilidade
import { loadAnalyticsDashboardView } from './analytics.js';
export { loadAnalyticsDashboardView };