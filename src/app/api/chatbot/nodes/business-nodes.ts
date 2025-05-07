/**
 * frontend/src/app/api/chatbot/nodes/business-nodes.ts
 * Implementación de funciones ejecutoras para nodos de negocio (citas, leads)
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import { executeCheckAvailability } from '@/components/view/ChatbotBuilder/nodes/CheckAvailabilityNode';
import { executeBookAppointment } from '@/components/view/ChatbotBuilder/nodes/BookAppointmentNode';
import { executeLeadQualification } from '@/components/view/ChatbotBuilder/nodes/LeadQualificationNode';

// Mapa de ejecutores de nodos disponibles
export const businessNodeExecutors = {
  'check-availability': executeCheckAvailability,
  'check_availability': executeCheckAvailability,
  'book-appointment': executeBookAppointment,
  'book_appointment': executeBookAppointment,
  'lead-qualification': executeLeadQualification,
  'lead_qualification': executeLeadQualification
};

// Función para ejecutar un nodo de negocio en tiempo de ejecución
export async function executeBusinessNode(
  nodeType: string,
  tenantId: string,
  conversationContext: any,
  nodeData: any
): Promise<{ nextNodeId: string; outputs: any; } | null> {
  // Verificar si existe un ejecutor para este tipo de nodo
  const executor = businessNodeExecutors[nodeType];
  
  if (!executor) {
    console.warn(`No se encontró ejecutor para nodo de tipo: ${nodeType}`);
    return null;
  }
  
  try {
    // Ejecutar el nodo con los datos proporcionados
    return await executor(tenantId, conversationContext, nodeData);
  } catch (error) {
    console.error(`Error al ejecutar nodo ${nodeType}:`, error);
    
    // Retornar un error para que el flujo continúe
    return {
      nextNodeId: 'error',
      outputs: {
        message: "Lo siento, hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
        context: conversationContext
      }
    };
  }
}