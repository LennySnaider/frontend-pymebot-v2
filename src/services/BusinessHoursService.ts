/**
 * frontend/src/services/BusinessHoursService.ts
 * Servicio centralizado para gestionar los horarios de negocio
 * y su integración con el sistema de citas y chatbot.
 * 
 * @version 1.1.1
 * @updated 2025-07-05
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

/**
 * Servicio para gestionar los horarios de negocio y citas
 */
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
      // Intentar usar la API primero
      try {
        console.log('Intentando obtener horarios a través de API...');
        const params: Record<string, string> = {};
        if (locationId) params.location_id = locationId;
        
        const response = await ApiService.fetchDataWithAxios<{ regular_hours: BusinessHour[] }>({
          url: '/business/hours',
          method: 'get',
          params
        });
        
        console.log('Horarios obtenidos exitosamente desde API');
        return response?.regular_hours || [];
      } catch (apiError: any) {
        console.error('Error en API getBusinessHours, usando fallback Supabase:', 
          apiError?.message || 'Error desconocido',
          apiError?.response?.status || 'Sin código de estado',
          apiError?.response?.data || 'Sin datos de respuesta'
        );
        
        // Fallback a Supabase directo
        console.log('Intentando fallback a Supabase directo...');
        let query = supabase
          .from('tenant_business_hours')
          .select('*')
          .eq('tenant_id', tenantId);
        
        if (locationId) {
          query = query.eq('location_id', locationId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error en fallback Supabase:', error);
          throw error;
        }
        
        console.log(`Fallback exitoso, ${data?.length || 0} registros obtenidos`);
        return data as BusinessHour[];
      }
    } catch (error) {
      console.error('Error al obtener horarios de negocio:', error);
      console.log('Devolviendo horarios predeterminados para evitar errores de UI');
      // Devolver un array vacío en caso de error, pero también horarios por defecto
      // para evitar fallos en la interfaz
      return [
        { id: 'default-1', tenant_id: tenantId, day_of_week: 1, open_time: '09:00', close_time: '18:00', is_closed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'default-2', tenant_id: tenantId, day_of_week: 2, open_time: '09:00', close_time: '18:00', is_closed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'default-3', tenant_id: tenantId, day_of_week: 3, open_time: '09:00', close_time: '18:00', is_closed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'default-4', tenant_id: tenantId, day_of_week: 4, open_time: '09:00', close_time: '18:00', is_closed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'default-5', tenant_id: tenantId, day_of_week: 5, open_time: '09:00', close_time: '18:00', is_closed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'default-6', tenant_id: tenantId, day_of_week: 6, open_time: '10:00', close_time: '15:00', is_closed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'default-0', tenant_id: tenantId, day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ] as BusinessHour[];
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
      // Intentar usar la API primero
      try {
        console.log('Intentando obtener excepciones a través de API...');
        const params: Record<string, string> = {
          include_exceptions: 'true'
        };
        
        if (locationId) params.location_id = locationId;
        
        const response = await ApiService.fetchDataWithAxios<{ exceptions: BusinessHourException[] }>({
          url: '/business/hours',
          method: 'get',
          params
        });
        
        // Filtrar por fechas si es necesario
        let exceptions = response?.exceptions || [];
        
        if (startDate) {
          exceptions = exceptions.filter(exc => exc.exception_date >= startDate);
        }
        
        if (endDate) {
          exceptions = exceptions.filter(exc => exc.exception_date <= endDate);
        }
        
        console.log(`Excepciones obtenidas exitosamente desde API: ${exceptions.length}`);
        return exceptions;
      } catch (apiError: any) {
        console.error('Error en API getBusinessHourExceptions, usando fallback Supabase:', 
          apiError?.message || 'Error desconocido',
          apiError?.response?.status || 'Sin código de estado',
          apiError?.response?.data || 'Sin datos de respuesta'
        );
        
        // Fallback a Supabase directo
        console.log('Intentando fallback a Supabase directo para excepciones...');
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
        
        if (error) {
          console.error('Error en fallback Supabase para excepciones:', error);
          throw error;
        }
        
        console.log(`Fallback de excepciones exitoso, ${data?.length || 0} registros obtenidos`);
        return data as BusinessHourException[];
      }
    } catch (error) {
      console.error('Error al obtener excepciones de horario:', error);
      console.log('Devolviendo arreglo vacío para excepciones de horario');
      return [];
    }
  }
  
  /**
   * Obtiene la configuración de citas para un tenant
   */
  async getAppointmentSettings(tenantId: string) {
    try {
      // Intentar usar la API primero
      try {
        console.log('Intentando obtener configuración de citas a través de API...');
        const response = await ApiService.fetchDataWithAxios({
          url: '/appointments/settings',
          method: 'get'
        });
        
        console.log('Configuración de citas obtenida exitosamente desde API');
        return response;
      } catch (apiError: any) {
        console.error('Error en API getAppointmentSettings, usando fallback Supabase:', 
          apiError?.message || 'Error desconocido',
          apiError?.response?.status || 'Sin código de estado',
          apiError?.response?.data || 'Sin datos de respuesta'
        );
        
        // Fallback a Supabase directo
        console.log('Intentando fallback a Supabase directo para configuración de citas...');
        const { data, error } = await supabase
          .from('tenant_appointment_settings')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error en fallback Supabase para configuración de citas:', error);
          throw error;
        }
        
        // Si no hay datos, retornar valores por defecto
        if (!data) {
          console.log('No se encontraron datos de configuración, usando valores predeterminados');
          return {
            tenant_id: tenantId,
            appointment_duration: 30,
            buffer_time: 0,
            max_daily_appointments: null,
            min_notice_minutes: 60,
            max_future_days: 30,
            require_approval: false,
            reminder_time_hours: 24,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        console.log('Configuración de citas obtenida desde Supabase');
        return data;
      }
    } catch (error) {
      console.error('Error al obtener configuración de citas:', error);
      console.log('Usando valores predeterminados para configuración de citas');
      // Retornar valores por defecto en caso de error
      return {
        tenant_id: tenantId,
        appointment_duration: 30,
        buffer_time: 0,
        max_daily_appointments: null,
        min_notice_minutes: 60,
        max_future_days: 30,
        require_approval: false,
        reminder_time_hours: 24,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }
  
  /**
   * Obtiene los tipos de cita para un tenant
   */
  async getAppointmentTypes(tenantId: string) {
    try {
      // Intentar usar la API primero
      try {
        console.log('Intentando obtener tipos de cita a través de API...');
        const response = await ApiService.fetchDataWithAxios({
          url: '/appointments/types',
          method: 'get'
        });
        
        console.log(`Tipos de cita obtenidos exitosamente desde API: ${Array.isArray(response) ? response.length : 0}`);
        return response || [];
      } catch (apiError: any) {
        console.error('Error en API getAppointmentTypes, usando fallback Supabase:', 
          apiError?.message || 'Error desconocido',
          apiError?.response?.status || 'Sin código de estado',
          apiError?.response?.data || 'Sin datos de respuesta'
        );
        
        // Fallback a Supabase directo
        console.log('Intentando fallback a Supabase directo para tipos de cita...');
        const { data, error } = await supabase
          .from('tenant_appointment_types')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        
        if (error) {
          console.error('Error en fallback Supabase para tipos de cita:', error);
          throw error;
        }
        
        console.log(`Fallback de tipos de cita exitoso, ${data?.length || 0} tipos obtenidos`);
        return data || [];
      }
    } catch (error) {
      console.error('Error al obtener tipos de cita:', error);
      console.log('Usando tipo de cita predeterminado para evitar errores de UI');
      // Retornar al menos un tipo por defecto para evitar errores en UI
      return [{
        id: 'default',
        tenant_id: tenantId,
        name: 'Cita Estándar',
        duration_minutes: 30,
        color: '#4a90e2',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
    }
  }
}

// Crear una instancia del servicio
const businessHoursService = new BusinessHoursService();

// Exportar la instancia como default
export default businessHoursService;