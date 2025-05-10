/**
 * Exportación de las funciones de ejecución para los nodos de negocio del chatbot
 */

// Importar las funciones de ejecución de los nodos
import { executeCheckAvailability } from '@/components/view/ChatbotBuilder/nodes/CheckAvailabilityNode';
import { executeBookAppointment } from '@/components/view/ChatbotBuilder/nodes/BookAppointmentNode';
import { executeLeadQualification } from '@/components/view/ChatbotBuilder/nodes/LeadQualificationNode';
import { executeRescheduleAppointment } from '@/components/view/ChatbotBuilder/nodes/RescheduleAppointmentNode';
import { executeCancelAppointment } from '@/components/view/ChatbotBuilder/nodes/CancelAppointmentNode';
import { executeServicesNode } from '@/components/view/ChatbotBuilder/nodes/ServicesNode';
import { executeProductNode } from '@/components/view/ChatbotBuilder/nodes/ProductNode';

// Re-exportar para uso en el motor de ejecución del chatbot
export {
  executeCheckAvailability,
  executeBookAppointment,
  executeLeadQualification,
  executeRescheduleAppointment,
  executeCancelAppointment,
  executeServicesNode,
  executeProductNode
};

// Registro de ejecutores para el motor de chatbot
export const businessNodeExecutors = {
  CheckAvailabilityNode: executeCheckAvailability,
  BookAppointmentNode: executeBookAppointment,
  LeadQualificationNode: executeLeadQualification,
  RescheduleAppointmentNode: executeRescheduleAppointment,
  CancelAppointmentNode: executeCancelAppointment,
  ServicesNode: executeServicesNode,
  ProductNode: executeProductNode
};

// Función auxiliar para ejecutar un nodo de negocio
export async function executeBusinessNode(
  nodeType: string,
  tenantId: string,
  conversationContext: any,
  nodeData: any
) {
  const executor = businessNodeExecutors[nodeType as keyof typeof businessNodeExecutors];
  
  if (!executor) {
    throw new Error(`No executor found for node type: ${nodeType}`);
  }
  
  try {
    return await executor(tenantId, conversationContext, nodeData);
  } catch (error) {
    console.error(`Error executing business node ${nodeType}:`, error);
    return {
      nextNodeId: 'error',
      outputs: {
        message: `Lo siento, hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo.`,
        context: conversationContext
      }
    };
  }
}