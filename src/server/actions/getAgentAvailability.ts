/**
 * server/actions/getAgentAvailability.ts
 * Acción del servidor para obtener la disponibilidad de un agente para una fecha específica.
 *
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from './tenant/getTenantFromSession'
import {
    format,
    parse,
    addDays,
    addHours,
    isWithinInterval,
    parseISO,
} from 'date-fns'
import type { TimeSlot } from '@/app/(protected-pages)/modules/appointments/_components/types'

export async function getAgentAvailability(agentId: string, startDate: string) {
    try {
        const supabase = SupabaseClient.getInstance()

        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()

        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }

        // Calcular el rango de fechas (7 días a partir de startDate)
        const start = parseISO(startDate)
        const end = addDays(start, 6)
        const endDate = format(end, 'yyyy-MM-dd')

        // Obtener el agente y su configuración de disponibilidad
        let agent
        const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('availability')
            .eq('id', agentId)
            // Comentar temporalmente la restricción de tenant_id para diagnóstico
            // .eq('tenant_id', tenant_id)
            .single()

        agent = agentData

        if (agentError) {
            console.error(
                'Error al obtener disponibilidad del agente:',
                agentError,
            )
            console.warn(
                'Usando configuración de disponibilidad predeterminada',
            )
            // En lugar de fallar, usamos una configuración predeterminada
            agent = { availability: {} }
        }

        // Obtener citas existentes en el rango de fechas
        let existingAppointments
        const { data: appointmentsData, error: appointmentsError } =
            await supabase
                .from('appointments')
                .select('appointment_date, appointment_time')
                .eq('agent_id', agentId)
                // Comentar temporalmente la restricción de tenant_id para diagnóstico
                // .eq('tenant_id', tenant_id)
                .gte('appointment_date', startDate)
                .lte('appointment_date', endDate)
                .neq('status', 'cancelled')

        existingAppointments = appointmentsData || []

        if (appointmentsError) {
            console.error(
                'Error al obtener citas existentes:',
                appointmentsError,
            )
            console.warn('Usando lista de citas vacía')
            // En lugar de fallar, usamos una lista vacía
            existingAppointments = []
        }

        // Convertir citas existentes a un mapa para facilitar la búsqueda
        const bookedSlots = new Map()

        existingAppointments?.forEach((appointment) => {
            const date = appointment.appointment_date
            if (!bookedSlots.has(date)) {
                bookedSlots.set(date, [])
            }

            // Crear un objeto TimeSlot para la cita
            bookedSlots.get(date).push({
                date: date,
                time: appointment.appointment_time,
                available: false,
            })
        })

        // Configuración de disponibilidad del agente
        const availability = agent?.availability || {}

        // Generar slots disponibles para cada día
        const result: Record<string, TimeSlot[]> = {}

        for (let i = 0; i <= 6; i++) {
            const currentDate = addDays(start, i)
            const dateStr = format(currentDate, 'yyyy-MM-dd')
            const dayOfWeek = format(currentDate, 'EEEE').toLowerCase()

            // Obtener configuración para este día de la semana
            const dayConfig = availability[dayOfWeek]

            // Comprobar excepciones para esta fecha específica
            const exceptions = availability.exceptions || {}
            const dateException = exceptions[dateStr]

            // Si hay una excepción para esta fecha y no está disponible, saltarla
            if (dateException && dateException.available === false) {
                result[dateStr] = []
                continue
            }

            // Si el día está deshabilitado en la configuración semanal y no hay excepción, saltarlo
            if (dayConfig && dayConfig.enabled === false && !dateException) {
                result[dateStr] = []
                continue
            }

            // Determinar slots a usar (excepciones tienen prioridad sobre la configuración semanal)
            const slots =
                dateException?.slots ||
                dayConfig?.slots ||
                getDefaultTimeSlots()

            // Si no hay reservas para este día, todos los slots están disponibles
            if (!bookedSlots.has(dateStr)) {
                result[dateStr] = slots.map((slot) => ({
                    ...slot,
                    date: dateStr,
                    available: true,
                }))
                continue
            }

            // Marcar slots como no disponibles si coinciden con citas existentes
            const bookedTimesForDay = bookedSlots.get(dateStr) || []

            result[dateStr] = slots.map((slot) => {
                // Comprobar si este slot coincide con alguna cita existente
                const isBooked = bookedTimesForDay.some((bookedSlot) => {
                    // Convertir el tiempo del slot a un objeto Date para comparación
                    const slotTime = parse(slot.time, 'HH:mm', new Date())

                    // Crear un objeto Date para el tiempo de la cita
                    const appointmentTime = parse(
                        bookedSlot.time,
                        'HH:mm',
                        new Date(),
                    )

                    // Considerar que una cita dura 1 hora
                    const appointmentEndTime = addHours(appointmentTime, 1)

                    // Comprobar si el slot está dentro del rango de la cita
                    return isWithinInterval(slotTime, {
                        start: appointmentTime,
                        end: appointmentEndTime,
                    })
                })

                return {
                    ...slot,
                    date: dateStr,
                    available: !isBooked,
                }
            })
        }

        return result
    } catch (error) {
        console.error('Error en getAgentAvailability:', error)
        throw error
    }
}

// Función auxiliar para generar slots de tiempo predeterminados de 9:00 a 18:00
function getDefaultTimeSlots() {
    const slots = []
    const startHour = 9
    const endHour = 18

    for (let hour = startHour; hour < endHour; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`

        slots.push({
            time,
            available: true,
        })
    }

    return slots
}

export default getAgentAvailability
