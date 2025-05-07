// Types for business hours API

/**
 * Represents a single business hour entry for a specific day
 */
export interface BusinessHour {
  id: string;
  tenant_id: string;
  day_of_week: number; // 0 (domingo) a 6 (sábado)
  open_time: string; // Format: HH:MM
  close_time: string; // Format: HH:MM
  is_closed: boolean;
  location_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request body for creating/updating business hours
 */
export interface BusinessHourRequest {
  day_of_week: number; // 0 (domingo) a 6 (sábado)
  open_time: string; // Format: HH:MM
  close_time: string; // Format: HH:MM
  is_closed: boolean;
  location_id?: string;
}

/**
 * Represents a business hour exception (holidays, special days, etc.)
 */
export interface BusinessHourException {
  id: string;
  tenant_id: string;
  exception_date: string; // Format: YYYY-MM-DD
  open_time?: string; // Format: HH:MM
  close_time?: string; // Format: HH:MM
  is_closed: boolean;
  reason?: string;
  location_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request body for creating/updating business hour exceptions
 */
export interface BusinessHourExceptionRequest {
  exception_date: string; // Format: YYYY-MM-DD
  open_time?: string; // Format: HH:MM
  close_time?: string; // Format: HH:MM
  is_closed: boolean;
  reason?: string;
  location_id?: string;
}

/**
 * Response structure for business hours API
 */
export interface BusinessHoursResponse {
  regular_hours: BusinessHour[];
  exceptions?: BusinessHourException[];
}