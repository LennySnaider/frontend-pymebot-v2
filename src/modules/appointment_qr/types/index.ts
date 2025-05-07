/**
 * Tipos para el módulo de códigos QR para citas
 */

export interface AppointmentQRCode {
  id: string;
  tenant_id: string;
  appointment_id: string;
  token: string;
  qr_code_url: string;
  is_valid: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  used_at?: string;
  scan_count?: number;
  last_scan_at?: string;
  scan_location?: string;
}

export interface QRCodeResponse {
  success: boolean;
  qrCodeUrl?: string;
  token?: string;
  expires_at?: string;
  error?: string;
}

export interface VerificationRequest {
  token: string;
  location?: string;
  agent_id?: string;
}

export interface VerificationResponse {
  valid: boolean;
  appointmentId?: string;
  appointmentDetails?: any;
  message: string;
  checkedIn?: boolean;
  checkedInAt?: string;
}

export interface QRCodeDistribution {
  id: string;
  tenant_id: string;
  appointment_id: string;
  qr_code_id: string;
  email_sent: boolean;
  email_sent_at?: string;
  whatsapp_sent: boolean;
  whatsapp_sent_at?: string;
  calendar_invite_sent: boolean;
  calendar_invite_sent_at?: string;
  wallet_added: boolean;
  wallet_added_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QRCodeSettings {
  size: number;
  backgroundColor: string;
  foregroundColor: string;
  margin: number;
  includeLogoInQR: boolean;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}