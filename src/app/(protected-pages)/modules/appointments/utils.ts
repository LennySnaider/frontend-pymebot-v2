/**
 * frontend/src/app/(protected-pages)/modules/appointments/utils.ts
 * Utilidades para el módulo de citas inmobiliarias.
 * 
 * @version 1.0.0
 * @updated 2025-05-16
 */

import type { Appointment, AppointmentMeta } from './types'
import type { CalendarEvent } from './calendar-view/types'
import { parseISO, format } from 'date-fns'

/**
 * Convierte una cita inmobiliaria en un evento de calendario
 */
export const appointmentToCalendarEvent = (appointment: Appointment): CalendarEvent => {
    // Construir fecha y hora de inicio
    const startDate = parseISO(`${appointment.date}T${appointment.time}`)
    
    // Asumimos que las citas duran 1 hora por defecto
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    
    // Determinar color según el estado de la cita
    let eventColor = getStatusColor(appointment.status)
    
    // Crear evento de calendario con metadatos específicos
    return {
        id: appointment.id,
        title: `Cita: ${appointment.propertyType}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        eventColor,
        // Metadatos para identificar que es una cita inmobiliaria
        meta: {
            type: 'real-estate-appointment',
            leadId: appointment.leadId,
            agentId: appointment.agentId,
            propertyIds: appointment.propertyIds || [],
            propertyType: appointment.propertyType,
            appointmentStatus: appointment.status
        } as AppointmentMeta
    } as any
}

/**
 * Convierte un evento de calendario en una cita inmobiliaria
 */
export const calendarEventToAppointment = (event: CalendarEvent): Appointment | null => {
    // Verificar que sea un evento de tipo cita inmobiliaria
    if (!(event as any).meta || ((event as any).meta as AppointmentMeta).type !== 'real-estate-appointment') {
        return null
    }
    
    const meta = (event as any).meta as AppointmentMeta
    
    // Extraer fecha y hora del evento
    const startDate = new Date(event.start)
    const formattedDate = format(startDate, 'yyyy-MM-dd')
    const formattedTime = format(startDate, 'HH:mm')
    
    return {
        id: event.id,
        leadId: meta.leadId,
        date: formattedDate,
        time: formattedTime,
        location: (event as any).location || '',
        propertyType: meta.propertyType,
        agentId: meta.agentId,
        propertyIds: meta.propertyIds,
        status: meta.appointmentStatus,
        notes: (event as any).description,
        createdAt: (event as any).createdAt || new Date().toISOString(),
        updatedAt: (event as any).updatedAt || new Date().toISOString()
    }
}

/**
 * Formatea el estado de una cita para mostrar
 */
export const formatAppointmentStatus = (status: string): string => {
    switch (status) {
        case 'scheduled': return 'Programada'
        case 'confirmed': return 'Confirmada'
        case 'completed': return 'Completada'
        case 'cancelled': return 'Cancelada'
        case 'rescheduled': return 'Reprogramada'
        default: return status
    }
}

/**
 * Obtiene el color asociado al estado de una cita
 */
export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'scheduled': return 'blue'
        case 'confirmed': return 'green'
        case 'completed': return 'indigo'
        case 'cancelled': return 'red'
        case 'rescheduled': return 'amber'
        default: return 'blue'
    }
}