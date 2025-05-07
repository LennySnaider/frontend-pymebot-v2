/**
 * Exportación de los componentes de nodos de negocio para el constructor de chatbot
 */

// Importar componentes desde las ubicaciones implementadas
import CheckAvailabilityNode from '@/components/view/ChatbotBuilder/nodes/CheckAvailabilityNode';
import BookAppointmentNode from '@/components/view/ChatbotBuilder/nodes/BookAppointmentNode';
import LeadQualificationNode from '@/components/view/ChatbotBuilder/nodes/LeadQualificationNode';
import RescheduleAppointmentNode from '@/components/view/ChatbotBuilder/nodes/RescheduleAppointmentNode';
import CancelAppointmentNode from '@/components/view/ChatbotBuilder/nodes/CancelAppointmentNode';

// Re-exportar para uso en otros módulos
export {
  CheckAvailabilityNode,
  BookAppointmentNode,
  LeadQualificationNode,
  RescheduleAppointmentNode,
  CancelAppointmentNode
};

// Exportar registro de nodos para integrarse con el constructor de chatbot
export const businessNodeRegistry = {
  CheckAvailabilityNode: {
    type: 'CheckAvailabilityNode',
    label: 'Verificar Disponibilidad',
    category: 'business',
    component: CheckAvailabilityNode,
    initialData: {
      tenant_id: '',
      appointment_type_id: '',
      location_id: '',
      agent_id: '',
      availableMessage: 'Tenemos disponibilidad para esta fecha. ¿Te gustaría agendar una cita?',
      unavailableMessage: 'Lo siento, no tenemos disponibilidad para esa fecha. ¿Te gustaría ver otras opciones?'
    },
    description: 'Verifica disponibilidad de citas para una fecha específica',
    outputs: [
      { id: 'available', label: 'Disponible' },
      { id: 'unavailable', label: 'No Disponible' },
      { id: 'error', label: 'Error' }
    ]
  },
  BookAppointmentNode: {
    type: 'BookAppointmentNode',
    label: 'Agendar Cita',
    category: 'business',
    component: BookAppointmentNode,
    initialData: {
      tenant_id: '',
      update_lead_stage: true,
      new_lead_stage: 'confirmed',
      send_confirmation: true,
      create_follow_up_task: true,
      successMessage: 'Tu cita ha sido agendada correctamente. Te hemos enviado un correo con los detalles.',
      failureMessage: 'Lo siento, no pudimos agendar tu cita. Por favor, intenta de nuevo más tarde.'
    },
    description: 'Agenda una cita con la información proporcionada',
    outputs: [
      { id: 'success', label: 'Éxito' },
      { id: 'failure', label: 'Fallo' }
    ]
  },
  RescheduleAppointmentNode: {
    type: 'RescheduleAppointmentNode',
    label: 'Reprogramar Cita',
    category: 'business',
    component: RescheduleAppointmentNode,
    initialData: {
      tenant_id: '',
      update_lead_on_reschedule: true,
      require_reason: true,
      notify_agent: true,
      send_confirmation: true,
      max_reschedule_attempts: 3,
      success_message: 'Tu cita ha sido reprogramada correctamente. Te hemos enviado los detalles actualizados.',
      failure_message: 'Lo siento, no pudimos reprogramar tu cita. Por favor, intenta de nuevo más tarde.'
    },
    description: 'Reprograma una cita existente a un nuevo horario',
    outputs: [
      { id: 'success', label: 'Éxito' },
      { id: 'failure', label: 'Fallo' }
    ]
  },
  CancelAppointmentNode: {
    type: 'CancelAppointmentNode',
    label: 'Cancelar Cita',
    category: 'business',
    component: CancelAppointmentNode,
    initialData: {
      tenant_id: '',
      update_lead_on_cancel: true,
      require_reason: true,
      notify_agent: true,
      blacklist_time_slot: false,
      success_message: 'Tu cita ha sido cancelada correctamente. Lamentamos no poder atenderte esta vez.',
      failure_message: 'Lo siento, no pudimos cancelar tu cita. Por favor, intenta de nuevo más tarde.'
    },
    description: 'Cancela una cita existente',
    outputs: [
      { id: 'success', label: 'Éxito' },
      { id: 'failure', label: 'Fallo' },
      { id: 'needReason', label: 'Requiere Motivo' }
    ]
  },
  LeadQualificationNode: {
    type: 'LeadQualificationNode',
    label: 'Calificar Lead',
    category: 'business',
    component: LeadQualificationNode,
    initialData: {
      tenant_id: '',
      questions: [
        {
          id: 'q1',
          text: '¿Estás interesado en nuestros servicios para los próximos 3 meses?',
          weight: 30
        },
        {
          id: 'q2',
          text: '¿Tienes un presupuesto asignado para este proyecto?',
          weight: 25
        },
        {
          id: 'q3',
          text: '¿Has trabajado con otros proveedores similares antes?',
          weight: 15
        }
      ],
      high_score_threshold: 70,
      medium_score_threshold: 40,
      update_lead_stage: true,
      high_score_stage: 'opportunity',
      medium_score_stage: 'qualification',
      low_score_stage: 'prospecting'
    },
    description: 'Califica un lead basado en sus respuestas a preguntas clave',
    outputs: [
      { id: 'high', label: 'Alto Potencial' },
      { id: 'medium', label: 'Potencial Medio' },
      { id: 'low', label: 'Bajo Potencial' }
    ]
  }
};