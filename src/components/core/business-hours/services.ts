// Business hours API services

import {
  DaySchedule, 
  BusinessHourRequest,
  DateException, 
  BusinessHourExceptionRequest,
  AppointmentSettingsConfig, 
  AppointmentTypeConfig, 
  BusinessLocation,
  BusinessHoursResponse,
  TimeSlot
} from './types';

/**
 * Fetches business hours for the current tenant
 */
export async function fetchBusinessHours(): Promise<DaySchedule[]> {
  const response = await fetch('/api/business/hours');
  
  if (!response.ok) {
    throw new Error('Error fetching business hours');
  }
  
  const data: BusinessHoursResponse = await response.json();
  return data.regular_hours || [];
}

/**
 * Saves business hours for the current tenant
 */
export async function saveBusinessHours(hours: BusinessHourRequest[]): Promise<void> {
  const response = await fetch('/api/business/hours', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hours),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error saving business hours');
  }
}

/**
 * Updates business hours partially
 */
export async function updateBusinessHours(hours: BusinessHourRequest[]): Promise<void> {
  const response = await fetch('/api/business/hours', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hours),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error updating business hours');
  }
}

/**
 * Fetches business hours exceptions for the current tenant
 */
export async function fetchExceptions(): Promise<DateException[]> {
  console.log('Iniciando fetchExceptions...');
  
  try {
    const response = await fetch('/api/business/hours/exceptions');
    
    console.log('Respuesta de la API:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.error('Error en la respuesta HTTP:', response.status, response.statusText);
      throw new Error(`Error fetching exceptions: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    if (!Array.isArray(data)) {
      console.warn('Los datos recibidos no son un array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error en fetchExceptions:', error);
    throw error;
  }
}

/**
 * Fetches exceptions for a specific date range
 */
export async function fetchExceptionsForDateRange(startDate: string, endDate: string): Promise<DateException[]> {
  const response = await fetch(`/api/business/hours/exceptions?start_date=${startDate}&end_date=${endDate}`);
  
  if (!response.ok) {
    throw new Error('Error fetching exceptions');
  }
  
  const data = await response.json();
  return data || [];
}

/**
 * Saves a new business hours exception
 */
export async function saveException(exception: BusinessHourExceptionRequest): Promise<DateException> {
  const response = await fetch('/api/business/hours/exceptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exception),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error saving exception');
  }
  
  return await response.json();
}

/**
 * Deletes a business hours exception
 */
export async function deleteException(id: string): Promise<void> {
  const response = await fetch(`/api/business/hours/exceptions?id=${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error deleting exception');
  }
}

/**
 * Fetches appointment settings for the current tenant
 */
export async function fetchAppointmentSettings(): Promise<AppointmentSettingsConfig> {
  const response = await fetch('/api/appointments/settings');
  
  if (!response.ok) {
    throw new Error('Error fetching appointment settings');
  }
  
  return await response.json();
}

/**
 * Saves appointment settings for the current tenant
 */
export async function saveAppointmentSettings(settings: AppointmentSettingsConfig): Promise<AppointmentSettingsConfig> {
  const response = await fetch('/api/appointments/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error saving appointment settings');
  }
  
  return await response.json();
}

/**
 * Fetches appointment types for the current tenant
 */
export async function fetchAppointmentTypes(): Promise<AppointmentTypeConfig[]> {
  const response = await fetch('/api/appointments/types');
  
  if (!response.ok) {
    throw new Error('Error fetching appointment types');
  }
  
  return await response.json();
}

/**
 * Saves a new appointment type
 */
export async function saveAppointmentType(type: AppointmentTypeConfig): Promise<AppointmentTypeConfig> {
  const isNew = !type.id;
  const url = isNew 
    ? '/api/appointments/types' 
    : `/api/appointments/types/${type.id}`;
  
  const response = await fetch(url, {
    method: isNew ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(type),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error saving appointment type');
  }
  
  return await response.json();
}

/**
 * Deletes an appointment type
 */
export async function deleteAppointmentType(id: string): Promise<void> {
  const response = await fetch(`/api/appointments/types/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error deleting appointment type');
  }
}

/**
 * Fetches business locations for the current tenant
 */
export async function fetchBusinessLocations(): Promise<BusinessLocation[]> {
  const response = await fetch('/api/business/locations');
  
  if (!response.ok) {
    throw new Error('Error fetching business locations');
  }
  
  return await response.json();
}

/**
 * Saves a new business location
 */
export async function saveBusinessLocation(location: BusinessLocation): Promise<BusinessLocation> {
  const isNew = !location.id;
  const url = isNew 
    ? '/api/business/locations' 
    : `/api/business/locations/${location.id}`;
  
  const response = await fetch(url, {
    method: isNew ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(location),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error saving business location');
  }
  
  return await response.json();
}

/**
 * Deletes a business location
 */
export async function deleteBusinessLocation(id: string): Promise<void> {
  const response = await fetch(`/api/business/locations/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error deleting business location');
  }
}

/**
 * Checks availability for a specific date
 */
export async function checkAvailability(date: string, appointmentTypeId?: string): Promise<TimeSlot[]> {
  let url = `/api/appointments/availability/${date}`;
  
  if (appointmentTypeId) {
    url += `?type=${appointmentTypeId}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error checking availability');
  }
  
  return await response.json();
}
