'use client';

// Exportamos las versiones cliente de los servicios
export * from './EmailService';
export * from './AppointmentEmailServiceWrapper';
export * from './config';

import { EmailService } from './EmailService';
import { AppointmentEmailServiceWrapper } from './AppointmentEmailServiceWrapper';
import emailConfig from './config';

// Inicializa el servicio de email
export const initializeEmailService = () => {
  // Solo inicializa si hay una API key
  if (emailConfig.resend.apiKey) {
    EmailService.initialize({
      apiKey: emailConfig.resend.apiKey,
      defaultFrom: emailConfig.resend.defaultFrom,
    });
    
    // El servicio de AppointmentEmail se inicializa cuando se solicita getInstance()
    return true;
  }
  return false;
};

export {
  EmailService,
  AppointmentEmailServiceWrapper as AppointmentEmailService, // Reemplazamos con la versión compatible con cliente
  emailConfig,
};