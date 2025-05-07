'use client';

/**
 * Configuración para el servicio de email
 */
export const emailConfig = {
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFrom: process.env.RESEND_DEFAULT_FROM || 'info@pymebot.ai',
  },
  appointments: {
    defaultSubject: 'Confirmación de tu cita',
    defaultReplyTo: 'soporte@pymebot.ai',
  },
};

export default emailConfig;