/**
 * Configuración del módulo business_hours
 * Gestión de horarios de negocio y disponibilidad para citas
 */

const config = {
  // Metadata del módulo
  name: 'Business Hours',
  code: 'business_hours',
  description: 'Sistema de gestión de horarios de negocio, disponibilidad y citas para todos los verticales.',
  version: '1.0.0',
  status: 'active',
  icon: 'TbCalendarTime',
  
  // Dependencias
  dependencies: [],
  
  // Verticales compatibles (todas)
  verticalIds: ['all'],
  
  // Configuración por defecto
  defaultConfig: {
    // Configuración para días laborables predeterminados
    defaultBusinessHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      saturday: { isOpen: false, openTime: '10:00', closeTime: '14:00' },
      sunday: { isOpen: false, openTime: '00:00', closeTime: '00:00' }
    },
    // Configuración para citas
    appointmentSettings: {
      defaultDuration: 30, // minutos
      bufferTime: 10, // minutos entre citas
      maxDailyAppointments: 20,
      minAdvanceTime: 2, // horas
      maxAdvanceTime: 30, // días
      allowWeekends: false,
      requireApproval: false
    }
  }
};

export default config;