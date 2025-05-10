/**
 * Tipos para el API de appointment types
 */

/**
 * Representa un tipo de cita
 */
export interface AppointmentType {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  duration: number; // Duración en minutos
  color?: string;
  buffer_time: number;
  is_active: boolean;
  booking_url_suffix?: string;
  max_daily_appointments?: number | null;
  requires_payment: boolean;
  payment_amount?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request body para crear/actualizar un tipo de cita
 */
export interface AppointmentTypeRequest {
  name: string;
  description?: string;
  duration: number;
  color?: string;
  buffer_time?: number;
  is_active?: boolean;
  booking_url_suffix?: string;
  max_daily_appointments?: number | null;
  requires_payment?: boolean;
  payment_amount?: number | null;
}