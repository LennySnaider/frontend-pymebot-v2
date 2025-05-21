/**
 * Utilidad para procesar eventos de API relacionados con leads y emitir
 * eventos de tiempo real para el sistema de escucha
 */

import { broadcastLeadCreated, broadcastLeadUpdated, broadcastLeadDeleted } from '@/stores/leadRealTimeStore';

interface ApiResponse {
  success: boolean;
  event?: {
    type: 'create' | 'update' | 'delete';
    leadId: string;
  };
  data?: any;
}

/**
 * Procesa respuestas de API que tienen eventos de leads
 * y dispara los eventos correspondientes usando el sistema de tiempo real
 * @param response - Respuesta de la API que puede contener un evento
 * @param source - Identificador opcional de la fuente del evento para depuración
 */
export const processLeadApiEvent = (response: ApiResponse, source: string = 'unknown') => {
  // Verificar si hay un evento para procesar
  if (!response || !response.success || !response.event) {
    return;
  }

  const { event, data } = response;
  
  try {
    console.log(`[${source}] Procesando evento de lead:`, event.type, event.leadId);
    
    // Disparar el evento según su tipo
    switch (event.type) {
      case 'create':
        broadcastLeadCreated(event.leadId, data);
        break;
      
      case 'update':
        broadcastLeadUpdated(event.leadId, data);
        break;
      
      case 'delete':
        broadcastLeadDeleted(event.leadId);
        break;
      
      default:
        console.warn(`[${source}] Tipo de evento desconocido:`, event.type);
    }
  } catch (error) {
    console.error(`[${source}] Error procesando evento de lead:`, error);
  }
};

export default processLeadApiEvent;