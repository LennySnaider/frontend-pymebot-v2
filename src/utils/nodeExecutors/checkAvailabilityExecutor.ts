/**
 * frontend/src/utils/nodeExecutors/checkAvailabilityExecutor.ts
 * Función de ejecución para CheckAvailabilityNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/CheckAvailabilityNode.tsx
 */

import BusinessHoursService from '@/services/BusinessHoursService';

export async function executeCheckAvailability(
  tenantId: string,
  conversationContext: any,
  nodeData: {
    appointment_type_id?: string;
    location_id?: string;
    agent_id?: string;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Obtener fecha de la conversación o usar la fecha actual
    const dateToCheck = conversationContext.selectedDate || new Date().toISOString().split('T')[0];
    
    // Consultar disponibilidad
    const availability = await BusinessHoursService.getAvailabilityForDate(
      tenantId,
      dateToCheck,
      nodeData.appointment_type_id || conversationContext.appointment_type_id,
      nodeData.location_id || conversationContext.location_id,
      nodeData.agent_id || conversationContext.agent_id
    );
    
    // Guardar los resultados en el contexto
    const hasAvailability = availability.available_slots.length > 0;
    const updatedContext = {
      ...conversationContext,
      availableSlots: availability.available_slots,
      hasAvailability,
      checkedDate: dateToCheck,
      businessHours: availability.business_hours
    };
    
    // Generar mensaje de respuesta
    let message;
    if (hasAvailability) {
      const slotsText = availability.available_slots
        .map((slot: any, index: number) => `${index + 1}. ${slot.start_time} - ${slot.end_time}`)
        .join('\n');
      
      message = `✅ Tenemos disponibilidad para el ${dateToCheck}:\n\n${slotsText}\n\n¿Te gustaría agendar alguno de estos horarios?`;
    } else {
      message = `❌ Lo siento, no tenemos disponibilidad para el ${dateToCheck}. ¿Te gustaría verificar otra fecha?`;
    }
    
    return {
      nextNodeId: hasAvailability ? 'available' : 'not_available',
      outputs: {
        message,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo CheckAvailability:', error);
    return {
      nextNodeId: 'error',
      outputs: {
        message: "Lo siento, hubo un problema al verificar la disponibilidad. Por favor, intenta más tarde.",
        context: conversationContext
      }
    };
  }
}