/**
 * Exportación de las funciones de ejecución para los nodos de negocio del chatbot
 */

// Importar las funciones de ejecución desde los nuevos ejecutores migrados
import { executeCheckAvailability } from '@/utils/nodeExecutors/checkAvailabilityExecutor';
import { executeBookAppointment } from '@/utils/nodeExecutors/bookAppointmentExecutor';
import { executeLeadQualification } from '@/utils/nodeExecutors/leadQualificationExecutor';
import { executeRescheduleAppointment } from '@/utils/nodeExecutors/rescheduleAppointmentExecutor';
import { executeCancelAppointment } from '@/utils/nodeExecutors/cancelAppointmentExecutor';
import { executeServicesNode } from '@/utils/nodeExecutors/servicesNodeExecutor';
import { executeProductNode } from '@/utils/nodeExecutors/productNodeExecutor';

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