/**
 * frontend/src/utils/nodeExecutors/rescheduleAppointmentExecutor.ts
 * Función de ejecución para RescheduleAppointmentNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/RescheduleAppointmentNode.tsx
 */

export async function executeRescheduleAppointment(
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
          message: "No encontramos una cita activa para reprogramar. ¿Podrías proporcionar el ID de tu cita o tu número de teléfono?",
          context: conversationContext
        }
      };
    }

    const updatedContext = {
      ...conversationContext,
      rescheduleRequested: true,
      originalAppointmentId: appointmentId,
      newSelectedDate: conversationContext.newSelectedDate,
      newSelectedTime: conversationContext.newSelectedTime
    };

    const message = conversationContext.newSelectedDate && conversationContext.newSelectedTime
      ? `✅ Tu cita ha sido reprogramada exitosamente.\n\n📅 Nueva fecha: ${conversationContext.newSelectedDate}\n🕒 Nueva hora: ${conversationContext.newSelectedTime}\n\nTe enviaremos una confirmación por email.`
      : "Para reprogramar tu cita, por favor selecciona una nueva fecha y hora disponible.";

    return {
      nextNodeId: 'success',
      outputs: {
        message,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo RescheduleAppointment:', error);
    return {
      nextNodeId: 'error',
      outputs: {
        message: "Lo siento, hubo un problema al reprogramar tu cita. Por favor, contacta directamente para asistencia.",
        context: conversationContext
      }
    };
  }
}