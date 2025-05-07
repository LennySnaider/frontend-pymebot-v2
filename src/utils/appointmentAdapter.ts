/**
 * frontend/src/utils/AppointmentAdapter.ts
 * Adaptador para convertir citas inmobiliarias en eventos del calendario y viceversa.
 * 
 * @version 1.0.0
 * @updated 2025-05-16
 */

import type { Appointment } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'
import type { CalendarEvent } from '@/app/(protected-pages)/calendar/types'
import { parseISO, format } from 'date-fns'

/**
 * Convierte una cita inmobiliaria en un evento de calendario
 */
export const appointmentToCalendarEvent = (appointment: Appointment): CalendarEvent => {
    // Construir fecha y hora de inicio
    const startDate = parseISO(`${appointment.date}T${appointment.time}`)
    
    // Asumimos que las citas duran 1 hora por defecto
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    
    // Construir el título basado en la información de la cita
    const title = `Cita Inmobiliaria: ${appointment.propertyType}`
    
    // Determinar color según el estado de la cita
    let eventColor = ''
    switch (appointment.status) {
        case 'scheduled':
            eventColor = 'blue'
            break
        case 'confirmed':
            eventColor = 'green'
            break
        case 'completed':
            eventColor = 'indigo'
            break
        case 'cancelled':
            eventColor = 'red'
            break
        case 'rescheduled':
            eventColor = 'amber'
            break
        default:
            eventColor = 'blue'
    }
    
    return {
        id: appointment.id,
        title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        eventColor,
        description: appointment.notes || '',
        location: appointment.location,
        // Metadatos específicos de citas inmobiliarias
        meta: {
            type: 'real-estate-appointment',
            leadId: appointment.leadId,
            agentId: appointment.agentId,
            propertyIds: appointment.propertyIds || [],
            propertyType: appointment.propertyType,
            appointmentStatus: appointment.status
        }
    }
}

/**
 * Convierte un evento de calendario en una cita inmobiliaria
 */
export const calendarEventToAppointment = (event: CalendarEvent): Appointment | null => {
    // Verificar que sea un evento de tipo cita inmobiliaria
    if (!event.meta || event.meta.type !== 'real-estate-appointment') {
        return null
    }
    
    // Extraer fecha y hora del evento
    const startDate = new Date(event.start)
    const formattedDate = format(startDate, 'yyyy-MM-dd')
    const formattedTime = format(startDate, 'HH:mm')
    
    return {
        id: event.id,
        leadId: event.meta.leadId,
        date: formattedDate,
        time: formattedTime,
        location: event.location || '',
        propertyType: event.meta.propertyType,
        agentId: event.meta.agentId,
        propertyIds: event.meta.propertyIds,
        status: event.meta.appointmentStatus || 'scheduled',
        notes: event.description,
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: event.updatedAt || new Date().toISOString()
    }
}

/**
 * Filtra eventos de calendario para mostrar solo citas inmobiliarias
 */
export const filterRealEstateAppointments = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.filter(event => 
        event.meta && event.meta.type === 'real-estate-appointment'
    )
}