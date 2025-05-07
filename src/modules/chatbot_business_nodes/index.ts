/**
 * Módulo: chatbot_business_nodes
 * 
 * Integración de nodos especializados para chatbot con funcionalidades de negocio.
 * Este módulo proporciona nodos para verificar disponibilidad, agendar citas y calificar leads.
 */

// Reexportar componentes de nodos para el editor de chatbot
export * from './components';

// Reexportar funciones de ejecución para cada nodo
export * from './execution';

// Reexportar tipos
export * from './types';

// Exportar configuración
export { default as config } from './config';