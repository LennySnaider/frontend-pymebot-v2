/**
 * frontend/src/services/BusinessHoursService.ts
 * Servicio centralizado para gestionar los horarios de negocio
 * y su integración con el sistema de citas y chatbot.
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import { supabase } from '@/services/supabase/SupabaseClient';
import ApiService from './ApiService';
import type { BusinessHour, BusinessHourException } from '@/app/api/business/hours/types';

export interface AvailabilitySlot {
  start_time: string; // Format: HH:MM
  end_time: string; // Format: HH:MM
  start_datetime: string; // ISO format
  end_datetime: string; // ISO format
}

export interface AvailabilityResponse {
  available_slots: AvailabilitySlot[];
  business_hours: {
    open_time: string; // Format: HH:MM
    close_time: string; // Format: HH:MM
    is_closed: boolean;
  };
  date: string; // Format: YYYY-MM-DD
  is_exception_day: boolean;
}

class BusinessHoursService {
  /**
   * Verifica si una fecha y hora específica está dentro del horario comercial
   */
  async isWithinBusinessHours(
    tenantId: string,
    dateTime: Date,
    locationId?: string
  ): Promise<boolean> {
    try {
      const dayOfWeek = dateTime.getDay(); // 0 (domingo) a 6 (sábado)
      const timeString = dateTime.toTimeString().substring(0, 5); // Formato HH:MM
      const dateString = dateTime.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Verificar si hay una excepción para esta fecha
      const { data: exception, error: exceptionError } = await supabase
        .from('tenant_business_hours_exceptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('exception_date', dateString)
        .is('location_id', locationId || null)
        .maybeSingle();
      
      if (exceptionError) throw exceptionError;
      
      // Si hay una excepción y está cerrado, no está en horario comercial
      if (exception && exception.is_closed) {
        return false;
      }
      
      // Si hay una excepción con horarios específicos, verificar contra esos
      if (exception && !exception.is_closed) {
        return this.isTimeWithinRange(timeString, exception.open_time, exception.close_time);
      }
      
      // Si no hay excepción, verificar contra los horarios regulares
      const { data: businessHour, error: businessHourError } = await supabase
        .from('tenant_business_hours')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .is('location_id', locationId || null)
        .single();
      
      if (businessHourError && businessHourError.code !== 'PGRST116') throw businessHourError;
      
      // Si no hay configuración o está cerrado, no está en horario comercial
      if (!businessHour || businessHour.is_closed) {
        return false;
      }
      
      return this.isTimeWithinRange(timeString, businessHour.open_time, businessHour.close_time);
    } catch (error) {
      console.error('Error al verificar horario comercial:', error);
      return false;
    }
  }
  
  /**
   * Obtiene el próximo horario disponible (para sugerir alternativas)
   */
  async getNextAvailableTime(
    tenantId: string,
    startDateTime: Date,
    durationMinutes: number = 30,
    locationId?: string,
    appointmentTypeId?: string,
    agentId?: string
  ): Promise<Date | null> {
    try {
      // Buscar hasta 7 días en el futuro
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDateTime);
        currentDate.setDate(currentDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Obtener disponibilidad para esta fecha
        const availability = await this.getAvailabilityForDate(
          tenantId,
          dateString,
          appointmentTypeId,
          locationId,
          agentId
        );
        
        if (availability.available_slots.length > 0) {
          // Retornar el primer slot disponible
          const firstSlot = availability.available_slots[0];
          return new Date(firstSlot.start_datetime);
        }
      }
      
      // Si no se encuentra disponibilidad en los próximos 7 días
      return null;
    } catch (error) {
      console.error('Error al obtener próximo horario disponible:', error);
      return null;
    }
  }
  
  /**
   * Obtiene la disponibilidad para una fecha específica
   */
  async getAvailabilityForDate(
    tenantId: string,
    date: string,
    appointmentTypeId?: string,
    locationId?: string,
    agentId?: string
  ): Promise<AvailabilityResponse> {
    try {
      // Construir parámetros para la consulta
      const params: Record<string, string> = {
        date
      };
      
      if (appointmentTypeId) params.appointment_type_id = appointmentTypeId;
      if (locationId) params.location_id = locationId;
      if (agentId) params.agent_id = agentId;
      
      // Llamar al endpoint de disponibilidad
      const response = await ApiService.fetchDataWithAxios<AvailabilityResponse>({
        url: '/appointments/availability',
        method: 'get',
        params
      });
      
      return response;
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
      // Retornar una estructura vacía para evitar errores
      return {
        available_slots: [],
        business_hours: {
          open_time: '00:00',
          close_time: '00:00',
          is_closed: true
        },
        date,
        is_exception_day: false
      };
    }
  }
  
  /**
   * Determina si una hora (HH:MM) está dentro de un rango
   */
  private isTimeWithinRange(
    time: string,
    openTime: string,
    closeTime: string
  ): boolean {
    return time >= openTime && time < closeTime;
  }
  
  /**
   * Obtiene todos los horarios de negocio para un tenant
   */
  async getBusinessHours(
    tenantId: string,
    locationId?: string
  ): Promise<BusinessHour[]> {
    try {
      let query = supabase
        .from('tenant_business_hours')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as BusinessHour[];
    } catch (error) {
      console.error('Error al obtener horarios de negocio:', error);
      return [];
    }
  }
  
  /**
   * Obtiene las excepciones de horario para un tenant
   */
  async getBusinessHourExceptions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    locationId?: string
  ): Promise<BusinessHourException[]> {
    try {
      let query = supabase
        .from('tenant_business_hours_exceptions')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (startDate) {
        query = query.gte('exception_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('exception_date', endDate);
      }
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as BusinessHourException[];
    } catch (error) {
      console.error('Error al obtener excepciones de horario:', error);
      return [];
    }
  }
}

export default new BusinessHoursService();