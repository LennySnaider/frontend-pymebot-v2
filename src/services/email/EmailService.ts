'use client';

import { Resend } from 'resend';

/**
 * Configuración del servicio de email
 */
interface EmailServiceConfig {
  apiKey: string;
  defaultFrom: string;
}

/**
 * Opciones para enviar un email
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

/**
 * Servicio para enviar emails usando Resend
 */
export class EmailService {
  private resend: Resend;
  private defaultFrom: string;
  private static instance: EmailService;

  /**
   * Constructor del servicio
   * @param config - Configuración del servicio
   */
  private constructor(config: EmailServiceConfig) {
    this.resend = new Resend(config.apiKey);
    this.defaultFrom = config.defaultFrom;
  }

  /**
   * Inicializa y retorna la instancia del servicio
   * @param config - Configuración del servicio
   */
  public static initialize(config: EmailServiceConfig): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService(config);
    }
    return EmailService.instance;
  }

  /**
   * Obtiene la instancia del servicio
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      throw new Error('EmailService no ha sido inicializado');
    }
    return EmailService.instance;
  }

  /**
   * Envía un email
   * @param options - Opciones para el email
   */
  public async sendEmail(options: SendEmailOptions): Promise<{ id: string; message: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        reply_to: options.replyTo,
      });

      if (error) {
        console.error('Error al enviar email:', error);
        throw new Error(`Error al enviar email: ${error.message}`);
      }

      return {
        id: data?.id || '',
        message: 'Email enviado correctamente',
      };
    } catch (error: any) {
      console.error('Error al enviar email:', error);
      throw new Error(`Error al enviar email: ${error.message}`);
    }
  }
}

export default EmailService;