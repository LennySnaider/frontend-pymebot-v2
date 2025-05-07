/**
 * Configuración del módulo chatbot_business_nodes
 * Integración de nodos especializados para chatbot con funcionalidades de negocio
 */

const config = {
  // Metadata del módulo
  name: 'Chatbot Business Nodes',
  code: 'chatbot_business_nodes',
  description: 'Nodos especializados para el chatbot que permiten integración con citas, ventas y otros sistemas de negocio.',
  version: '1.0.0',
  status: 'active',
  icon: 'TbMessageChatbot',
  
  // Dependencias
  dependencies: ['chatbot_builder'],
  
  // Verticales compatibles (todas)
  verticalIds: ['all'],
  
  // Configuración por defecto
  defaultConfig: {
    enabledNodes: [
      'CheckAvailabilityNode',
      'BookAppointmentNode',
      'LeadQualificationNode',
      'RescheduleAppointmentNode',
      'CancelAppointmentNode'
    ],
    nodeDefaults: {
      CheckAvailabilityNode: {
        availableMessage: 'Tenemos disponibilidad para esta fecha. ¿Te gustaría agendar una cita?',
        unavailableMessage: 'Lo siento, no tenemos disponibilidad para esa fecha. ¿Te gustaría ver otras opciones?'
      },
      BookAppointmentNode: {
        successMessage: 'Tu cita ha sido agendada correctamente. Te hemos enviado un correo con los detalles.',
        failureMessage: 'Lo siento, no pudimos agendar tu cita. Por favor, intenta de nuevo más tarde.'
      },
      RescheduleAppointmentNode: {
        update_lead_on_reschedule: true,
        require_reason: true,
        notify_agent: true,
        send_confirmation: true,
        max_reschedule_attempts: 3,
        success_message: 'Tu cita ha sido reprogramada correctamente. Te hemos enviado los detalles actualizados.',
        failure_message: 'Lo siento, no pudimos reprogramar tu cita. Por favor, intenta de nuevo más tarde.'
      },
      CancelAppointmentNode: {
        update_lead_on_cancel: true,
        require_reason: true,
        notify_agent: true,
        blacklist_time_slot: false,
        success_message: 'Tu cita ha sido cancelada correctamente. Lamentamos no poder atenderte esta vez.',
        failure_message: 'Lo siento, no pudimos cancelar tu cita. Por favor, intenta de nuevo más tarde.'
      },
      LeadQualificationNode: {
        highScoreThreshold: 70,
        mediumScoreThreshold: 40,
        defaultQuestions: [
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
        ]
      }
    }
  }
};

export default config;