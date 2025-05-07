/**
 * Tipos para el módulo de horarios de negocio
 */

export interface BusinessHour {
  id: string;
  tenant_id: string;
  day_of_week: number; // 0-6 (domingo a sábado)
  is_closed: boolean;
  open_time: string; // Formato "HH:MM"
  close_time: string; // Formato "HH:MM"
  location_id?: string;
  break_start?: string; // Formato "HH:MM"
  break_end?: string; // Formato "HH:MM"
  created_at: string;
  updated_at: string;
}

export interface BusinessHourException {
  id: string;
  tenant_id: string;
  exception_date: string; // Formato "YYYY-MM-DD"
  is_closed: boolean;
  open_time?: string; // Formato "HH:MM"
  close_time?: string; // Formato "HH:MM"
  location_id?: string;
  description?: string; // Ej: "Feriado nacional", "Horario especial"
  created_at: string;
  updated_at: string;
}

export interface AppointmentSettings {
  id: string;
  tenant_id: string;
  default_duration: number; // minutos
  buffer_time: number; // minutos entre citas
  max_daily_appointments: number;
  min_advance_time: number; // horas
  max_advance_time: number; // días
  allow_weekends: boolean;
  require_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentType {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  duration: number; // minutos
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailableTimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  appointment_type_id?: string;
  location_id?: string;
  agent_id?: string;
}

export interface AvailabilityRequest {
  tenant_id: string;
  date: string;
  appointment_type_id?: string;
  location_id?: string;
  agent_id?: string;
}

export interface AvailabilityResponse {
  date: string;
  available_slots: AvailableTimeSlot[];
}

export interface BusinessLocation {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}