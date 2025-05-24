/**
 * frontend/src/utils/nodeExecutors/cancelAppointmentExecutor.ts
 * Función de ejecución para CancelAppointmentNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/CancelAppointmentNode.tsx
 */

export async function executeCancelAppointment(
  tenantId: string,
  conversationContext: any,
  nodeData: any
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    const appointmentId = conversationContext.appointmentId || conversationContext.appointment_id;
    
    if (!appointmentId) {
      return {
        nextNodeId: 'no_appointment',
        outputs: {
          message: "No encontramos una cita activa para cancelar. ¿Podrías proporcionar el ID de tu cita o tu número de teléfono?",
          context: conversationContext
        }
      };
    }

    // Simular cancelación de cita
    const updatedContext = {
      ...conversationContext,
      appointmentStatus: 'cancelled',
      cancellationDate: new Date().toISOString(),
      cancellationReason: conversationContext.cancellationReason || 'Cancelada por el cliente'
    };

    const message = `✅ Tu cita ha sido cancelada exitosamente.\n\n📅 Cita original: ${conversationContext.selectedDate || 'Fecha no disponible'}\n🕒 Hora: ${conversationContext.selectedTime || 'Hora no disponible'}\n\n¿Hay algo más en lo que podemos ayudarte?`;

    return {
      nextNodeId: 'success',
      outputs: {
        message,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo CancelAppointment:', error);
    return {
      nextNodeId: 'error',
      outputs: {
        message: "Lo siento, hubo un problema al cancelar tu cita. Por favor, contacta directamente para asistencia.",
        context: conversationContext
      }
    };
  }
}