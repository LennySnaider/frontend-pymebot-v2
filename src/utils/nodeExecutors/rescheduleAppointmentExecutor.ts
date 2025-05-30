/**
 * frontend/src/utils/nodeExecutors/rescheduleAppointmentExecutor.ts
 * Función de ejecución para RescheduleAppointmentNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/RescheduleAppointmentNode.tsx
 */

export async function executeRescheduleAppointment(
  tenantId: string,
  conversationContext: any,
  nodeData: {
    update_lead_on_reschedule?: boolean;
    require_reason?: boolean;
    notify_agent?: boolean;
    send_confirmation?: boolean;
    send_whatsapp?: boolean;
    max_reschedule_attempts?: number;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    const appointmentId = conversationContext.appointmentId || conversationContext.appointment_id;
    
    if (!appointmentId) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: "No encontramos una cita activa para reprogramar. ¿Podrías proporcionar el ID de tu cita?",
          context: conversationContext
        }
      };
    }

    // Verificar si se requiere motivo y no se ha proporcionado
    if (nodeData.require_reason && !conversationContext.reschedule_reason) {
      return {
        nextNodeId: 'needReason',
        outputs: {
          message: "Para reprogramar tu cita, necesitamos que nos proporciones el motivo del cambio. ¿Cuál es la razón?",
          context: {
            ...conversationContext,
            waiting_for_reschedule_reason: true
          }
        }
      };
    }

    // Verificar si se han proporcionado nueva fecha y hora
    if (!conversationContext.newSelectedDate || !conversationContext.newSelectedTime) {
      return {
        nextNodeId: 'needDateTime',
        outputs: {
          message: "Para reprogramar tu cita, necesitamos que selecciones una nueva fecha y hora disponible. ¿Cuál sería tu preferencia?",
          context: {
            ...conversationContext,
            waiting_for_new_datetime: true
          }
        }
      };
    }

    // Verificar límite de reprogramaciones
    const rescheduleCount = conversationContext.reschedule_count || 0;
    if (nodeData.max_reschedule_attempts && rescheduleCount >= nodeData.max_reschedule_attempts) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: `Has alcanzado el límite máximo de reprogramaciones (${nodeData.max_reschedule_attempts}). Por favor, contacta directamente para más asistencia.`,
          context: conversationContext
        }
      };
    }

    // Preparar datos para actualizar la cita
    const updateData = {
      appointment_date: conversationContext.newSelectedDate,
      appointment_time: conversationContext.newSelectedTime,
      status: 'rescheduled',
      notes: `${conversationContext.notes || ''}\n\nReprogramada desde chatbot. Motivo: ${conversationContext.reschedule_reason || 'No especificado'}`.trim(),
      reschedule_count: rescheduleCount + 1
    };

    // Llamar al endpoint para actualizar la cita
    const response = await fetch(`/api/appointments/update/${appointmentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al reprogramar la cita');
    }

    const updatedAppointment = await response.json();

    const updatedContext = {
      ...conversationContext,
      appointmentId: updatedAppointment.id,
      appointmentStatus: updatedAppointment.status,
      rescheduleCount: rescheduleCount + 1,
      originalAppointmentDate: conversationContext.selectedDate,
      originalAppointmentTime: conversationContext.selectedTime,
      selectedDate: conversationContext.newSelectedDate,
      selectedTime: conversationContext.newSelectedTime,
      reschedule_reason: conversationContext.reschedule_reason
    };

    // Actualizar lead si está configurado
    if (nodeData.update_lead_on_reschedule && conversationContext.lead_id) {
      try {
        await fetch('/api/leads/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            lead_id: conversationContext.lead_id,
            notes: `Cita reprogramada. Nueva fecha: ${conversationContext.newSelectedDate} ${conversationContext.newSelectedTime}`
          })
        });
      } catch (leadError) {
        console.error('Error al actualizar lead:', leadError);
        // No fallar la reprogramación por este error
      }
    }

    const message = `✅ Tu cita ha sido reprogramada exitosamente.\n\n📅 Nueva fecha: ${conversationContext.newSelectedDate}\n🕒 Nueva hora: ${conversationContext.newSelectedTime}\n📍 Ubicación: ${updatedAppointment.location || 'Por confirmar'}\n\nCita ID: ${appointmentId.slice(-8)}\n\n${nodeData.send_confirmation ? 'Te enviaremos una confirmación por email.' : ''}`;

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
      nextNodeId: 'failure',
      outputs: {
        message: `Lo siento, hubo un problema al reprogramar tu cita: ${error.message}. Por favor, contacta directamente para asistencia.`,
        context: conversationContext
      }
    };
  }
}