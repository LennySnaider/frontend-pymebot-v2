/**
 * server/actions/getCalendar.ts
 * Acción del servidor para obtener citas en formato compatible con el calendario.
 * Ahora extrae datos directamente de la tabla appointments.
 * 
 * @version 2.1.0
 * @updated 2025-07-05
 */

'use server'

import getAppointments from '@/server/actions/appointments/getAppointments'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from './tenant/getTenantFromSession'
import type { AppointmentData } from './appointments/getAppointments'

/**
 * Obtiene las citas y las formatea para el calendario
 */
const getCalendar = async () => {
    try {
        console.log('getCalendar: Obteniendo citas para el calendario...')
        
        // Utilizar la misma función getAppointments que usa la vista de lista
        const appointments = await getAppointments()
        
        console.log(`getCalendar: Se obtuvieron ${appointments.length} citas de la base de datos`)
        
        // Mapear los datos de appointments a formato de calendario
        const calendarEvents = appointments.map((appointment: AppointmentData) => {
            try {
                // Formatear la fecha y hora para el calendario
                const dateStr = appointment.appointment_date
                const timeStr = appointment.appointment_time || '12:00' // Proporcionar valor por defecto si no hay hora
                
                // Validar y asegurar formato correcto de la hora (acepta HH:mm y HH:mm:ss)
                let formattedTimeStr;
                if (!timeStr) {
                    formattedTimeStr = '12:00';
                    console.warn(`Hora no especificada para cita ${appointment.id}, usando 12:00 por defecto`);
                } else {
                    // Obtener horas y minutos, ignorando segundos si existen
                    const parts = timeStr.split(':');
                    const hh = parts[0].padStart(2, '0');
                    const mm = (parts[1] ?? '00').padStart(2, '0');
                    formattedTimeStr = `${hh}:${mm}`;
                }
                // Validar que la hora tenga formato correcto HH:MM
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                if (!timeRegex.test(formattedTimeStr)) {
                    console.warn(`Formato de hora inválido: ${formattedTimeStr}, usando 12:00 por defecto`);
                    formattedTimeStr = '12:00';
                }
                
                // Crear fecha con hora formateada
                const startDateTime = `${dateStr}T${formattedTimeStr}`;
                
                // Calcular fecha de fin (agregando 1 hora por defecto)
                try {
                    const endDate = new Date(startDateTime);
                    if (!isNaN(endDate.getTime())) { // Verificar que la fecha sea válida
                        endDate.setHours(endDate.getHours() + 1);
                        var endDateTime = endDate.toISOString();
                    } else {
                        // Si la fecha no es válida, usar un valor por defecto (mismo día, una hora después)
                        console.warn(`Fecha/hora inválida detectada: ${startDateTime}, usando valor por defecto`);
                        const defaultDate = new Date(`${dateStr}T12:00:00`);
                        const defaultEndDate = new Date(`${dateStr}T13:00:00`);
                        var startDateTime = defaultDate.toISOString();
                        var endDateTime = defaultEndDate.toISOString();
                    }
                } catch (timeError) {
                    console.error(`Error procesando hora: ${timeError}`);
                    // Usar valores por defecto en caso de error
                    const defaultDate = new Date(`${dateStr}T12:00:00`);
                    const defaultEndDate = new Date(`${dateStr}T13:00:00`);
                    var startDateTime = defaultDate.toISOString();
                    var endDateTime = defaultEndDate.toISOString();
                }
                
                // Datos para mostrar en el tooltip (necesarios para que FullCalendar funcione)
                const extendedProps = {
                    lead_name: appointment.lead?.full_name || 'Cliente sin nombre',
                    lead_email: appointment.lead?.email,
                    location: appointment.location,
                    status: appointment.status,
                    agent_name: appointment.agent?.name || 'Sin agente asignado',
                    property_type: appointment.property_type || 'No especificado',
                    eventColor: getEventColorByStatus(appointment.status)
                };
                
                // Crear un objeto de evento de calendario
                return {
                    id: appointment.id,
                    title: `${appointment.lead?.full_name || 'Cliente'} - ${appointment.location}`,
                    start: startDateTime,
                    end: endDateTime,
                    // Asignar color según el estado de la cita
                    eventColor: getEventColorByStatus(appointment.status),
                    // Añadir propiedades extendidas al objeto principal para asegurar compatibilidad
                    ...extendedProps
                }
            } catch (itemError) {
                console.error('Error procesando cita individual:', itemError, 'Appointment:', appointment);
                return null;
            }
        }).filter(Boolean); // Eliminar cualquier evento nulo que haya fallado al procesar
        
        console.log(`getCalendar: Se procesaron ${calendarEvents.length} citas para el calendario`);
        if (calendarEvents.length > 0) {
            console.log('getCalendar: Ejemplo de evento procesado:', calendarEvents[0]);
        }
        
        return calendarEvents;
    } catch (error) {
        console.error('Error al obtener datos para el calendario:', error)
        // En caso de error, devolver array vacío
        console.log('getCalendar: Error al cargar datos del calendario')
        return []
    }
}

/**
 * Obtiene un color para el evento según el estado de la cita
 */
function getEventColorByStatus(status: string): string {
    switch (status) {
        case 'scheduled':
            return 'blue'
        case 'confirmed':
            return 'green'
        case 'completed':
            return 'purple'
        case 'cancelled':
            return 'red'
        case 'rescheduled':
            return 'orange'
        default:
            return 'blue'
    }
}


export default getCalendar