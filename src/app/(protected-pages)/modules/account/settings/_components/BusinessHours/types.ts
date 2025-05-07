// Types for business hours settings components

/**
 * Represents a day of the week with its business hours
 */
export interface DaySchedule {
  day_of_week: number; // 0-6 (Sunday to Saturday)
  day_name: string; // Sunday, Monday, etc.
  id?: string;
  is_closed: boolean;
  open_time: string; // HH:MM
  close_time: string; // HH:MM
}

/**
 * Represents a business hour exception for a specific date
 */
export interface DateException {
  id?: string;
  exception_date: string; // YYYY-MM-DD
  is_closed: boolean;
  open_time?: string; // HH:MM
  close_time?: string; // HH:MM
  reason?: string;
  location_id?: string;
}

/**
 * Appointment settings configuration
 */
export interface AppointmentSettingsConfig {
  id?: string;
  appointment_duration: number;
  buffer_time: number;
  max_daily_appointments: number | null;
  min_notice_minutes: number;
  max_future_days: number;
  require_approval: boolean;
  confirmation_email_template?: string;
  reminder_email_template?: string;
  reminder_time_hours: number;
  notification_email?: string;
}

/**
 * Available time slot
 */
export interface TimeSlot {
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  start_datetime: string; // ISO format
  end_datetime: string; // ISO format
}

/**
 * Appointment type configuration
 */
export interface AppointmentTypeConfig {
  id?: string;
  name: string;
  description?: string;
  duration: number;
  color?: string;
  buffer_time: number;
  is_active: boolean;
  booking_url_suffix?: string;
  max_daily_appointments?: number | null;
  requires_payment: boolean;
  payment_amount?: number | null;
}