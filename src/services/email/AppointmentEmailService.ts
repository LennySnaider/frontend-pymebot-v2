'use client';

import { renderToString } from 'react-dom/server';
import { EmailService } from './EmailService';
import AppointmentQRTemplate from './templates/AppointmentQRTemplate';

/**
 * Opciones para enviar un email de cita con QR
 */
export interface SendAppointmentQREmailOptions {
  to: string;
  recipientName: string;
  appointmentDate: string;
  appointmentTime: string;
  qrCodeUrl: string;
  appointmentLocation?: string;
  appointmentDetails?: string;
  validationUrl?: string;
  tenantName?: string;
  subject?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Servicio para enviar emails relacionados con citas
 */
export class AppointmentEmailService {
  private emailService: EmailService;
  private static instance: AppointmentEmailService;

  /**
   * Constructor del servicio
   */
  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  /**
   * Obtiene la instancia del servicio
   */
  public static getInstance(): AppointmentEmailService {
    if (!AppointmentEmailService.instance) {
      AppointmentEmailService.instance = new AppointmentEmailService();
    }
    return AppointmentEmailService.instance;
  }

  /**
   * Envía un email de confirmación de cita con QR
   * @param options - Opciones para el email
   */
  public async sendAppointmentQREmail(options: SendAppointmentQREmailOptions): Promise<{ id: string; message: string }> {
    const {
      to,
      recipientName,
      appointmentDate,
      appointmentTime,
      qrCodeUrl,
      appointmentLocation,
      appointmentDetails,
      validationUrl,
      tenantName,
      subject,
      from,
      replyTo,
      cc,
      bcc
    } = options;

    // Renderiza la plantilla a HTML
    const emailHtml = renderToString(
      AppointmentQRTemplate({
        recipientName,
        appointmentDate,
        appointmentTime,
        qrCodeUrl,
        appointmentLocation,
        appointmentDetails,
        validationUrl,
        tenantName,
      }) as any
    );

    // Crea una versión texto plano para clientes que no soportan HTML
    const textVersion = `
Confirmación de Cita - ${tenantName || 'PymeBot'}

Hola ${recipientName},

Tu cita ha sido confirmada para el ${appointmentDate} a las ${appointmentTime}.
${appointmentLocation ? `La cita será en ${appointmentLocation}.` : ''}
${appointmentDetails ? `\nDetalles adicionales:\n${appointmentDetails}` : ''}

Tu código QR está disponible en el email HTML. Si no puedes verlo, visita ${validationUrl || 'nuestra página web'} para verificar tu cita.

Si necesitas cambiar o cancelar tu cita, responde a este correo o contacta directamente con nosotros.

¡Esperamos verte pronto!

El equipo de ${tenantName || 'PymeBot'}
    `;

    // Envía el email
    return this.emailService.sendEmail({
      to,
      subject: subject || `Confirmación de cita - ${appointmentDate}`,
      html: emailHtml,
      text: textVersion,
      from,
      replyTo,
      cc,
      bcc
    });
  }
}

export default AppointmentEmailService;