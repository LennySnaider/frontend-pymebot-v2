'use client';

import { SendAppointmentQREmailOptions, AppointmentEmailService } from './AppointmentEmailService';

/**
 * Wrapper de cliente para AppointmentEmailService
 * Este componente solo debe utilizarse en contexto de cliente
 */
export const AppointmentEmailServiceWrapper = {
  /**
   * Envía un email de confirmación de cita con QR
   * @param options - Opciones para el email
   */
  sendAppointmentQREmail: async (options: SendAppointmentQREmailOptions) => {
    const service = AppointmentEmailService.getInstance();
    return await service.sendAppointmentQREmail(options);
  }
};

export default AppointmentEmailServiceWrapper;