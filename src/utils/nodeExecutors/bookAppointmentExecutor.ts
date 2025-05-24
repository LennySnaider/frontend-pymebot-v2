/**
 * frontend/src/utils/nodeExecutors/bookAppointmentExecutor.ts
 * Función de ejecución para BookAppointmentNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/BookAppointmentNode.tsx
 */

export async function executeBookAppointment(
  tenantId: string,
  conversationContext: any,
  nodeData: {
    appointment_type_id?: string;
    location_id?: string;
    agent_id?: string;
    auto_confirm?: boolean;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Obtener datos de la cita del contexto
    const appointmentData = {
      tenant_id: tenantId,
      client_name: conversationContext.client_name || conversationContext.nombre || 'Cliente',
      client_phone: conversationContext.client_phone || conversationContext.telefono,
      client_email: conversationContext.client_email || conversationContext.email,
      appointment_type_id: nodeData.appointment_type_id || conversationContext.appointment_type_id,
      location_id: nodeData.location_id || conversationContext.location_id,
      agent_id: nodeData.agent_id || conversationContext.agent_id,
      selected_date: conversationContext.selectedDate,
      selected_time: conversationContext.selectedTime,
      notes: conversationContext.appointment_notes || ''
    };

    // Simular creación de cita (aquí iría la lógica real de reserva)
    const appointmentId = `apt_${Date.now()}`;
    
    const updatedContext = {
      ...conversationContext,
      appointmentId,
      appointmentStatus: nodeData.auto_confirm ? 'confirmed' : 'pending',
      appointmentData
    };

    const message = nodeData.auto_confirm 
      ? `✅ ¡Perfecto! Tu cita ha sido confirmada.\n\n📅 Fecha: ${appointmentData.selected_date}\n🕒 Hora: ${appointmentData.selected_time}\n\nTe enviaremos un recordatorio antes de la cita.`
      : `📝 Hemos registrado tu solicitud de cita.\n\n📅 Fecha: ${appointmentData.selected_date}\n🕒 Hora: ${appointmentData.selected_time}\n\nTe confirmaremos la disponibilidad en breve.`;

    return {
      nextNodeId: 'success',
      outputs: {
        message,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo BookAppointment:', error);
    return {
      nextNodeId: 'error',
      outputs: {
        message: "Lo siento, hubo un problema al agendar tu cita. Por favor, intenta más tarde o contacta directamente.",
        context: conversationContext
      }
    };
  }
}