// Types for appointment settings API

/**
 * Represents appointment settings for a tenant
 */
export interface AppointmentSettings {
  id: string;
  tenant_id: string;
  appointment_duration: number; // Duration in minutes
  buffer_time: number; // Buffer time in minutes
  max_daily_appointments: number | null; // Null for unlimited
  min_notice_minutes: number;
  max_future_days: number;
  require_approval: boolean;
  confirmation_email_template?: string;
  reminder_email_template?: string;
  reminder_time_hours: number;
  notification_email?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request body for creating/updating appointment settings
 */
export interface AppointmentSettingsRequest {
  appointment_duration: number;
  buffer_time: number;
  max_daily_appointments?: number | null;
  min_notice_minutes: number;
  max_future_days: number;
  require_approval: boolean;
  confirmation_email_template?: string;
  reminder_email_template?: string;
  reminder_time_hours: number;
  notification_email?: string;
}

/**
 * Represents an appointment type
 */
export interface AppointmentType {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  duration: number; // Duration in minutes
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
 * Request body for creating/updating appointment types
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

/**
 * Represents a business location
 */
export interface BusinessLocation {
  id: string;
  tenant_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Request body for creating/updating business locations
 */
export interface BusinessLocationRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  is_active?: boolean;
}