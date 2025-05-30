/**
 * frontend/src/utils/nodeExecutors/cancelAppointmentExecutor.ts
 * Función de ejecución para CancelAppointmentNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/CancelAppointmentNode.tsx
 */

export async function executeCancelAppointment(
  tenantId: string,
  conversationContext: any,
  nodeData: {
    update_lead_on_cancel?: boolean;
    require_reason?: boolean;
    notify_agent?: boolean;
    blacklist_time_slot?: boolean;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    const appointmentId = conversationContext.appointmentId || conversationContext.appointment_id;
    
    if (!appointmentId) {
      return {
        nextNodeId: 'failure',
        outputs: {
          message: "No encontramos una cita activa para cancelar. ¿Podrías proporcionar el ID de tu cita?",
          context: conversationContext
        }
      };
    }

    // Verificar si se requiere motivo y no se ha proporcionado
    if (nodeData.require_reason && !conversationContext.cancellation_reason) {
      return {
        nextNodeId: 'needReason',
        outputs: {
          message: "Para cancelar tu cita, necesitamos que nos proporciones el motivo de la cancelación. ¿Cuál es la razón?",
          context: {
            ...conversationContext,
            waiting_for_cancellation_reason: true
          }
        }
      };
    }

    // Preparar datos para actualizar la cita (marcarla como cancelada)
    const updateData = {
      status: 'cancelled',
      notes: `${conversationContext.notes || ''}\n\nCancelada desde chatbot. Motivo: ${conversationContext.cancellation_reason || 'No especificado'}`.trim(),
      cancelled_at: new Date().toISOString(),
      cancellation_reason: conversationContext.cancellation_reason || 'Cancelada por el cliente'
    };

    // Llamar al endpoint para actualizar la cita (cancelarla)
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
      throw new Error(errorData.error || 'Error al cancelar la cita');
    }

    const cancelledAppointment = await response.json();

    const updatedContext = {
      ...conversationContext,
      appointmentId: cancelledAppointment.id,
      appointmentStatus: 'cancelled',
      cancellationDate: new Date().toISOString(),
      cancellationReason: conversationContext.cancellation_reason || 'Cancelada por el cliente'
    };

    // Actualizar lead si está configurado
    if (nodeData.update_lead_on_cancel && conversationContext.lead_id) {
      try {
        await fetch('/api/leads/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            lead_id: conversationContext.lead_id,
            notes: `Cita cancelada. Fecha original: ${conversationContext.selectedDate} ${conversationContext.selectedTime}. Motivo: ${conversationContext.cancellation_reason || 'No especificado'}`
          })
        });
      } catch (leadError) {
        console.error('Error al actualizar lead:', leadError);
        // No fallar la cancelación por este error
      }
    }

    // TODO: Implementar blacklist_time_slot si es necesario
    // Esta funcionalidad requeriría crear un sistema de slots bloqueados

    const message = `✅ Tu cita ha sido cancelada exitosamente.\n\n📅 Cita original: ${conversationContext.selectedDate || cancelledAppointment.appointment_date}\n🕒 Hora: ${conversationContext.selectedTime || cancelledAppointment.appointment_time}\n📍 Ubicación: ${cancelledAppointment.location || 'No especificada'}\n\nCita ID: ${appointmentId.slice(-8)}\n\n${nodeData.notify_agent ? 'Hemos notificado al agente sobre la cancelación.' : ''}`;

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
      nextNodeId: 'failure',
      outputs: {
        message: `Lo siento, hubo un problema al cancelar tu cita: ${error.message}. Por favor, contacta directamente para asistencia.`,
        context: conversationContext
      }
    };
  }
}