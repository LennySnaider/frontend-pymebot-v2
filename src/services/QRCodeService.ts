/**
 * frontend/src/services/QRCodeService.ts
 * Servicio para generación y verificación de códigos QR para citas
 * 
 * @version 1.0.0
 * @updated 2025-06-11
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
   */
  async sendQRByEmail(
    tenantId: string,
    appointmentId: string,
    email: string
  ): Promise<boolean> {
    try {
      const response = await ApiService.fetchDataWithAxios<{
        success: boolean;
        error?: string;
      }>({
        url: `/appointments/${appointmentId}/send-qr`,
        method: 'post',
        data: {
          tenant_id: tenantId,
          email
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
}

export default new QRCodeService();