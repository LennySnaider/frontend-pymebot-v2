/**
 * frontend/src/services/QRCodeService.ts
 * Servicio para generación y verificación de códigos QR para citas
 *
 * @version 1.2.0
 * @updated 2025-09-05
 */

import { supabase } from '@/services/supabase/SupabaseClient';
import ApiService from './ApiService';

export interface QRCodeResponse {
  success: boolean;
  qrUrl?: string;
  token?: string;
  error?: string;
}

export interface QRVerificationResponse {
  valid: boolean;
  appointmentId?: string;
  message: string;
  appointmentDetails?: any;
}

export interface SendQROptions {
  isReschedule?: boolean;
  sendWhatsApp?: boolean;
  customerPhone?: string;
  customerName?: string;
  appointmentDetails?: any; // Detalles adicionales para personalizar el mensaje
}

class QRCodeService {
  /**
   * Genera un código QR para una cita
   */
  async generateAppointmentQR(
    tenantId: string,
    appointmentId: string
  ): Promise<QRCodeResponse> {
    try {
      // Primero verificar si ya existe un QR para esta cita
      const { data: existingQR, error: checkError } = await supabase
        .from('tenant_appointment_qrcodes')
        .select('token, qr_code_url, is_valid')
        .eq('appointment_id', appointmentId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      // Si ya existe un QR válido, retornarlo
      if (existingQR && existingQR.is_valid) {
        return {
          success: true,
          qrUrl: existingQR.qr_code_url,
          token: existingQR.token
        };
      }
      
      // Si no existe un QR o el existente no es válido, generar uno nuevo
      const response = await ApiService.fetchDataWithAxios<{
        success: boolean;
        qr_code_url: string;
        token: string;
        error?: string;
      }>({
        url: `/appointments/${appointmentId}/generate-qr`,
        method: 'post',
        data: { tenant_id: tenantId }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Error al generar código QR');
      }
      
      return {
        success: true,
        qrUrl: response.qr_code_url,
        token: response.token
      };
    } catch (error) {
      console.error('Error al generar QR para cita:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al generar QR'
      };
    }
  }
  
  /**
   * Verifica un código QR de cita
   */
  async verifyAppointmentQR(
    token: string
  ): Promise<QRVerificationResponse> {
    try {
      const response = await ApiService.fetchDataWithAxios<QRVerificationResponse>({
        url: `/appointments/verify-qr`,
        method: 'post',
        data: { token }
      });
      
      return response;
    } catch (error) {
      console.error('Error al verificar QR de cita:', error);
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Error al verificar código QR'
      };
    }
  }
  
  /**
   * Regenera un código QR para una cita existente
   */
  async regenerateAppointmentQR(
    tenantId: string,
    appointmentId: string
  ): Promise<QRCodeResponse> {
    try {
      // Invalidar QR existente
      const { error: invalidateError } = await supabase
        .from('tenant_appointment_qrcodes')
        .update({
          is_valid: false,
          updated_at: new Date().toISOString()
        })
        .eq('appointment_id', appointmentId)
        .eq('tenant_id', tenantId);
      
      if (invalidateError) throw invalidateError;
      
      // Generar nuevo QR
      return this.generateAppointmentQR(tenantId, appointmentId);
    } catch (error) {
      console.error('Error al regenerar QR:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al regenerar QR'
      };
    }
  }
  
  /**
   * Envía el código QR por email
   * @param tenantId ID del tenant
   * @param appointmentId ID de la cita
   * @param email Email del destinatario
   * @param options Opciones adicionales de envío
   */
  async sendQRByEmail(
    tenantId: string,
    appointmentId: string,
    email: string,
    options: SendQROptions = {}
  ): Promise<boolean> {
    try {
      const { isReschedule = false } = options;

      const response = await ApiService.fetchDataWithAxios<{
        success: boolean;
        error?: string;
      }>({
        url: `/appointments/${appointmentId}/send-qr`,
        method: 'post',
        data: {
          tenant_id: tenantId,
          email,
          isReschedule
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al enviar QR por email');
      }

      return true;
    } catch (error) {
      console.error('Error al enviar QR por email:', error);
      return false;
    }
  }

  /**
   * Envía el código QR por WhatsApp
   * @param tenantId ID del tenant
   * @param appointmentId ID de la cita
   * @param phoneNumber Número de teléfono del destinatario (con formato internacional)
   * @param options Opciones adicionales de envío
   */
  async sendQRByWhatsApp(
    tenantId: string,
    appointmentId: string,
    phoneNumber: string,
    options: SendQROptions = {}
  ): Promise<boolean> {
    try {
      const {
        isReschedule = false,
        customerName = '',
        appointmentDetails = null
      } = options;

      const response = await ApiService.fetchDataWithAxios<{
        success: boolean;
        error?: string;
      }>({
        url: `/appointments/${appointmentId}/send-qr-whatsapp`,
        method: 'post',
        data: {
          tenant_id: tenantId,
          phone_number: phoneNumber,
          customer_name: customerName,
          is_reschedule: isReschedule,
          appointment_details: appointmentDetails
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al enviar QR por WhatsApp');
      }

      return true;
    } catch (error) {
      console.error('Error al enviar QR por WhatsApp:', error);
      return false;
    }
  }
  
  /**
   * Verifica si un usuario ha alcanzado el límite de reprogramaciones para una cita
   */
  async checkRescheduleLimit(
    tenantId: string,
    appointmentId: string,
    maxAttempts: number
  ): Promise<{
    limitReached: boolean;
    currentCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('tenant_appointment_changes')
        .select('count')
        .eq('tenant_id', tenantId)
        .eq('appointment_id', appointmentId)
        .eq('change_type', 'reschedule')
        .single();
      
      if (error && error.code !== 'PGRST116') { // Error diferente a "no se encontraron registros"
        throw error;
      }
      
      const currentCount = data?.count || 0;
      
      return {
        limitReached: currentCount >= maxAttempts,
        currentCount
      };
    } catch (error) {
      console.error('Error al verificar límite de reprogramaciones:', error);
      // En caso de error, asumimos que no ha alcanzado el límite
      return {
        limitReached: false,
        currentCount: 0
      };
    }
  }
  
  /**
   * Registra una reprogramación para llevar el conteo
   */
  async recordReschedule(
    tenantId: string,
    appointmentId: string
  ): Promise<boolean> {
    try {
      // Primero verificamos si ya existe un registro para esta cita
      const { data, error: checkError } = await supabase
        .from('tenant_appointment_changes')
        .select('id, count')
        .eq('tenant_id', tenantId)
        .eq('appointment_id', appointmentId)
        .eq('change_type', 'reschedule')
        .maybeSingle();

      if (checkError) throw checkError;

      if (data) {
        // Si existe, incrementamos el contador
        const { error: updateError } = await supabase
          .from('tenant_appointment_changes')
          .update({
            count: data.count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (updateError) throw updateError;
      } else {
        // Si no existe, creamos un nuevo registro
        const { error: insertError } = await supabase
          .from('tenant_appointment_changes')
          .insert({
            tenant_id: tenantId,
            appointment_id: appointmentId,
            change_type: 'reschedule',
            count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error al registrar reprogramación:', error);
      return false;
    }
  }

  /**
   * Envía el código QR por todos los medios disponibles (email y/o WhatsApp)
   * @param tenantId ID del tenant
   * @param appointmentId ID de la cita
   * @param appointmentData Datos de la cita y del cliente
   * @param options Opciones adicionales de envío
   */
  async sendQRByAllMethods(
    tenantId: string,
    appointmentId: string,
    appointmentData: {
      email?: string;
      phoneNumber?: string;
      customerName?: string;
    },
    options: SendQROptions = {}
  ): Promise<{
    emailSent: boolean;
    whatsappSent: boolean;
  }> {
    const results = {
      emailSent: false,
      whatsappSent: false
    };

    // Enviar por email si hay un email
    if (appointmentData.email) {
      results.emailSent = await this.sendQRByEmail(
        tenantId,
        appointmentId,
        appointmentData.email,
        options
      );
    }

    // Enviar por WhatsApp si hay un número de teléfono
    if (appointmentData.phoneNumber) {
      results.whatsappSent = await this.sendQRByWhatsApp(
        tenantId,
        appointmentId,
        appointmentData.phoneNumber,
        {
          ...options,
          customerName: appointmentData.customerName || ''
        }
      );
    }

    return results;
  }
}

export default new QRCodeService();