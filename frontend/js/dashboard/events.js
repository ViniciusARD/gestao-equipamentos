// js/dashboard/events.js

import { initializeEvents as init } from './events/listeners.js';

// Exporta a função principal para ser usada pelo main.js
export function initializeEvents(state) {
    init(state);
}