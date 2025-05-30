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
    update_lead_stage?: boolean;
    new_lead_stage?: string;
    send_confirmation?: boolean;
    create_follow_up_task?: boolean;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Validar que tenemos los datos necesarios
    if (!conversationContext.selectedDate || !conversationContext.selectedTime) {
      throw new Error('Fecha y hora de la cita son requeridas');
    }

    // Verificar si tenemos un lead_id en el contexto
    let leadId = conversationContext.lead_id || conversationContext.leadId;
    
    if (!leadId) {
      // Si no hay lead_id, podríamos crear un lead temporal o requerir que se proporcione
      throw new Error('ID del lead es requerido para crear la cita');
    }

    // Preparar los datos para crear la cita
    const appointmentData = {
      lead_id: leadId,
      agent_id: nodeData.agent_id || conversationContext.agent_id,
      appointment_date: conversationContext.selectedDate,
      appointment_time: conversationContext.selectedTime,
      location: conversationContext.location || 'Por definir',
      property_type: conversationContext.property_type,
      status: nodeData.auto_confirm ? 'confirmed' : 'scheduled',
      notes: conversationContext.appointment_notes || `Cita agendada desde chatbot. Cliente: ${conversationContext.client_name || conversationContext.nombre || 'Cliente'}`,
      property_ids: conversationContext.property_ids || [],
      follow_up_notes: nodeData.create_follow_up_task ? 'Seguimiento programado desde chatbot' : null
    };

    // Llamar al endpoint para crear la cita
    const response = await fetch('/api/appointments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(appointmentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear la cita');
    }

    const createdAppointment = await response.json();
    
    const updatedContext = {
      ...conversationContext,
      appointmentId: createdAppointment.id,
      appointmentStatus: createdAppointment.status,
      appointmentData: createdAppointment
    };

    // Actualizar etapa del lead si está configurado
    if (nodeData.update_lead_stage && nodeData.new_lead_stage && leadId) {
      try {
        await fetch('/api/leads/update-stage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            lead_id: leadId,
            new_stage: nodeData.new_lead_stage
          })
        });
      } catch (stageError) {
        console.error('Error al actualizar etapa del lead:', stageError);
        // No fallar la creación de la cita por este error
      }
    }

    const message = nodeData.auto_confirm 
      ? `✅ ¡Perfecto! Tu cita ha sido confirmada.\n\n📅 Fecha: ${appointmentData.appointment_date}\n🕒 Hora: ${appointmentData.appointment_time}\n📍 Ubicación: ${appointmentData.location}\n\nCita ID: ${createdAppointment.id.slice(-8)}\n\nTe enviaremos un recordatorio antes de la cita.`
      : `📝 Hemos registrado tu solicitud de cita.\n\n📅 Fecha: ${appointmentData.appointment_date}\n🕒 Hora: ${appointmentData.appointment_time}\n📍 Ubicación: ${appointmentData.location}\n\nCita ID: ${createdAppointment.id.slice(-8)}\n\nTe confirmaremos la disponibilidad en breve.`;

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
      nextNodeId: 'failure',
      outputs: {
        message: `Lo siento, hubo un problema al agendar tu cita: ${error.message}. Por favor, intenta más tarde o contacta directamente.`,
        context: conversationContext
      }
    };
  }
}