// Just a comment to force rebuild
import { supabase } from '@/services/supabase/SupabaseClient';
import { BusinessHour, BusinessHourException } from '../../business/hours/types';
import { AppointmentSettings, AppointmentType } from '../settings/types';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface AvailabilityParams {
  tenant_id: string;
  date: string; // Format: YYYY-MM-DD
  appointment_type_id?: string; // Optional filter by appointment type
  location_id?: string; // Optional filter by location
  agent_id?: string; // Optional filter by agent
}

interface GenerateAvailabilityResponse {
  available_slots: {
    start_time: string; // Format: HH:MM
    end_time: string; // Format: HH:MM
    start_datetime: string; // ISO format
    end_datetime: string; // ISO format
  }[];
  business_hours: {
    open_time: string; // Format: HH:MM
    close_time: string; // Format: HH:MM
    is_closed: boolean;
  };
  date: string; // Format: YYYY-MM-DD
  is_exception_day: boolean;
}

/**
 * Genera los slots de disponibilidad para una fecha específica
 */
export async function generateAvailability({
  tenant_id,
  date,
  appointment_type_id,
  location_id,
  agent_id
}: AvailabilityParams): Promise<GenerateAvailabilityResponse> {
  // Parsear la fecha
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay(); // 0 (domingo) a 6 (sábado)
  
  // Consultar horarios de negocio para el día de la semana
  const { data: businessHoursData, error: businessHoursError } = await supabase
    .from('tenant_business_hours')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('day_of_week', dayOfWeek)
    .is('location_id', location_id ? location_id : null)
    .single();
  
  if (businessHoursError && businessHoursError.code !== 'PGRST116') {
    console.error('Error al obtener horarios de negocio:', businessHoursError);
    throw new Error('Error al obtener horarios de negocio');
  }
  
  // Si no hay horarios para este día, o está marcado como cerrado
  if (!businessHoursData || businessHoursData.is_closed) {
    return {
      available_slots: [],
      business_hours: {
        open_time: businessHoursData?.open_time || '00:00',
        close_time: businessHoursData?.close_time || '00:00',
        is_closed: true
      },
      date,
      is_exception_day: false
    };
  }
  
  // Verificar si hay una excepción para esta fecha
  const { data: exceptionData, error: exceptionError } = await supabase
    .from('tenant_business_hours_exceptions')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('exception_date', date)
    .is('location_id', location_id ? location_id : null)
    .maybeSingle();
  
  if (exceptionError) {
    console.error('Error al obtener excepciones de horarios:', exceptionError);
    throw new Error('Error al obtener excepciones de horarios');
  }
  
  // Si hay una excepción y está marcada como cerrado
  if (exceptionData && exceptionData.is_closed) {
    return {
      available_slots: [],
      business_hours: {
        open_time: exceptionData.open_time || '00:00',
        close_time: exceptionData.close_time || '00:00',
        is_closed: true
      },
      date,
      is_exception_day: true
    };
  }
  
  // Obtener configuración de citas
  const { data: settingsData, error: settingsError } = await supabase
    .from('tenant_appointment_settings')
    .select('*')
    .eq('tenant_id', tenant_id)
    .single();
  
  if (settingsError && settingsError.code !== 'PGRST116') {
    console.error('Error al obtener configuración de citas:', settingsError);
    throw new Error('Error al obtener configuración de citas');
  }
  
  // Si no hay configuración, usar valores predeterminados
  const settings: AppointmentSettings = settingsData || {
    id: '',
    tenant_id,
    appointment_duration: 30,
    buffer_time: 0,
    max_daily_appointments: null,
    min_notice_minutes: 60,
    max_future_days: 30,
    require_approval: false,
    reminder_time_hours: 24,
    created_at: '',
    updated_at: ''
  };
  
  let appointmentType: AppointmentType | null = null;
  
  // Si se especifica un tipo de cita, obtenerlo
  if (appointment_type_id) {
    const { data: typeData, error: typeError } = await supabase
      .from('tenant_appointment_types')
      .select('*')
      .eq('id', appointment_type_id)
      .eq('tenant_id', tenant_id)
      .single();
    
    if (typeError) {
      console.error('Error al obtener tipo de cita:', typeError);
      throw new Error('Error al obtener tipo de cita');
    }
    
    appointmentType = typeData;
  }
  
  // Determinar duración y tiempo de buffer
  const duration = appointmentType ? appointmentType.duration : settings.appointment_duration;
  const bufferTime = appointmentType ? appointmentType.buffer_time : settings.buffer_time;
  
  // Usar horarios de la excepción si existen, o los horarios regulares
  const openTime = exceptionData ? exceptionData.open_time : businessHoursData.open_time;
  const closeTime = exceptionData ? exceptionData.close_time : businessHoursData.close_time;
  
  // Convertir horarios a objetos Date
  const businessDate = new Date(date);
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  const openDateTime = new Date(businessDate);
  openDateTime.setHours(openHour, openMinute, 0, 0);
  
  const closeDateTime = new Date(businessDate);
  closeDateTime.setHours(closeHour, closeMinute, 0, 0);
  
  // Obtener citas existentes para este día
  let appointmentsQuery = supabase
    .from('tenant_appointments')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('date', date);
  
  // Filtrar por ubicación si se especifica
  if (location_id) {
    appointmentsQuery = appointmentsQuery.eq('location_id', location_id);
  }
  
  // Filtrar por agente si se especifica
  if (agent_id) {
    appointmentsQuery = appointmentsQuery.eq('agent_id', agent_id);
  }
  
  const { data: existingAppointments, error: appointmentsError } = await appointmentsQuery;
  
  if (appointmentsError) {
    console.error('Error al obtener citas existentes:', appointmentsError);
    throw new Error('Error al obtener citas existentes');
  }

  // Obtener disponibilidad del agente específico si se especifica
  let agentAvailability: any = null;
  if (agent_id) {
    const { data: agentData, error: agentError } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', agent_id)
      .eq('tenant_id', tenant_id)
      .eq('role', 'agent')
      .single();
    
    if (agentError) {
      console.error('Error al obtener datos del agente:', agentError);
      throw new Error('Error al obtener datos del agente');
    }
    
    agentAvailability = agentData?.metadata?.availability;
  }
  
  // Función para verificar si el agente está disponible en un slot específico
  const isAgentAvailableForSlot = (slotStart: Date, slotEnd: Date): boolean => {
    if (!agentAvailability) return true; // Si no hay restricciones de agente, está disponible
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeekName = dayNames[slotStart.getDay()];
    
    // Verificar disponibilidad del día de la semana
    const dayAvailability = agentAvailability[dayOfWeekName];
    
    if (!dayAvailability || !dayAvailability.enabled) {
      return false; // El agente no trabaja este día
    }
    
    // Verificar si el slot está dentro de alguno de los rangos horarios del agente
    const slotStartTime = slotStart.toTimeString().slice(0, 5); // HH:MM
    const slotEndTime = slotEnd.toTimeString().slice(0, 5); // HH:MM
    
    if (!dayAvailability.slots || dayAvailability.slots.length === 0) {
      return false; // No hay slots definidos para este día
    }
    
    // Verificar si el slot se solapa con algún rango horario del agente
    for (const agentSlot of dayAvailability.slots) {
      const agentStart = agentSlot.start;
      const agentEnd = agentSlot.end;
      
      // Verificar si el slot de la cita está completamente dentro del rango del agente
      if (slotStartTime >= agentStart && slotEndTime <= agentEnd) {
        return true;
      }
    }
    
    return false; // El slot no está dentro de ningún rango horario del agente
  };

  // Generar slots de tiempo desde la apertura hasta el cierre
  const totalMinutes = (closeDateTime.getTime() - openDateTime.getTime()) / (1000 * 60);
  const slots: TimeSlot[] = [];
  
  // Duración total de cada slot (duración de la cita + buffer)
  const totalSlotDuration = duration + bufferTime;
  
  // Comprobar si estamos planificando para hoy
  const now = new Date();
  const isToday = now.toDateString() === businessDate.toDateString();
  
  // Crear slots hasta llenar todo el horario comercial
  for (let minute = 0; minute <= totalMinutes - duration; minute += totalSlotDuration) {
    const slotStart = new Date(openDateTime.getTime() + minute * 60 * 1000);
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
    
    // Si es hoy, no mostrar slots que ya han pasado o que no cumplen con el tiempo mínimo de antelación
    if (isToday) {
      const minNoticeDate = new Date(now.getTime() + settings.min_notice_minutes * 60 * 1000);
      if (slotStart < minNoticeDate) {
        continue;
      }
    }
    
    // Por defecto el slot está disponible
    let available = true;
    
    // Verificar si el agente está disponible en este slot
    if (!isAgentAvailableForSlot(slotStart, slotEnd)) {
      available = false;
    }
    
    // Verificar si el slot se solapa con alguna cita existente (solo si aún está disponible)
    if (available) {
      for (const appointment of existingAppointments || []) {
        const appointmentStart = new Date(`${date}T${appointment.start_time}`);
        const appointmentEnd = new Date(`${date}T${appointment.end_time}`);
        
        // Si hay solapamiento, marcar como no disponible
        if (
          (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
        ) {
          available = false;
          break;
        }
      }
    }
    
    slots.push({
      start: slotStart,
      end: slotEnd,
      available
    });
  }
  
  // Filtrar solo los slots disponibles
  const availableSlots = slots.filter(slot => slot.available);
  
  // Verificar límite diario de citas (del tenant o del tipo de cita)
  const maxDailyAppointments = appointmentType?.max_daily_appointments || settings.max_daily_appointments;
  
  if (maxDailyAppointments !== null) {
    const existingCount = existingAppointments?.length || 0;
    const slotsAvailable = Math.max(0, maxDailyAppointments - existingCount);
    
    // Limitar la cantidad de slots si es necesario
    if (availableSlots.length > slotsAvailable) {
      availableSlots.splice(slotsAvailable);
    }
  }
  
  // Formatear los slots para la respuesta
  const formattedSlots = availableSlots.map(slot => {
    // Formato HH:MM
    const formatTime = (date: Date) => {
      return date.toTimeString().slice(0, 5);
    };
    
    return {
      start_time: formatTime(slot.start),
      end_time: formatTime(slot.end),
      start_datetime: slot.start.toISOString(),
      end_datetime: slot.end.toISOString()
    };
  });
  
  return {
    available_slots: formattedSlots,
    business_hours: {
      open_time: openTime,
      close_time: closeTime,
      is_closed: false
    },
    date,
    is_exception_day: !!exceptionData
  };
}