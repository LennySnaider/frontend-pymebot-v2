/**
 * Configuración del módulo appointment_qr
 * Sistema de generación y verificación de códigos QR para citas
 */

const config = {
  // Metadata del módulo
  name: 'Appointment QR Codes',
  code: 'appointment_qr',
  description: 'Sistema para generación y verificación de códigos QR para citas, permitiendo check-in automático y validación de asistencia.',
  version: '1.0.0',
  status: 'active',
  icon: 'TbQrcode',
  
  // Dependencias
  dependencies: ['business_hours'],
  
  // Verticales compatibles (todas)
  verticalIds: ['all'],
  
  // Configuración por defecto
  defaultConfig: {
    // Configuración de QR
    qrSettings: {
      size: 300, // Tamaño del QR en pixeles
      backgroundColor: '#ffffff',
      foregroundColor: '#000000',
      margin: 4,
      includeLogoInQR: true,
      errorCorrectionLevel: 'M', // L, M, Q, H (low, medium, quartile, high)
    },
    // Configuración de tokens
    tokenSettings: {
      expiryAfterAppointment: 2, // horas después de que termina la cita
      allowMultipleScans: false,
      requireGeoValidation: false
    },
    // Configuración de distribución
    distributionSettings: {
      sendByEmail: true,
      sendByWhatsApp: false,
      includeInCalendarInvite: true,
      allowWalletIntegration: false
    }
  }
};

export default config;