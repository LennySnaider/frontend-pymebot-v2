/**
 * server/actions/appointments/getAppointmentsByDateRange.ts
 * Acción del servidor para obtener citas en un rango de fechas específico.
 * Útil para componentes de calendario.
 *
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
// Ya no necesitamos getAppointments como fallback

export async function getAppointmentsByDateRange(
    startDate: string,
    endDate: string,
    agent_id?: string,
) {
    try {
        const supabase = SupabaseClient.getInstance()

        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()

        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }

        // Construir la consulta base
        let query = supabase
            .from('appointments')
            .select(
                `
                *,
                lead:leads(id, full_name, email, phone),
                agent:agents(
                    id, 
                    specialization,
                    users!inner(
                        id,
                        full_name,
                        email,
                        phone,
                        avatar_url
                    )
                )
            `,
            )
            .eq('tenant_id', tenant_id)
            .gte('appointment_date', startDate)
            .lte('appointment_date', endDate)

        // Filtrar por agente si se especifica
        if (agent_id) {
            query = query.eq('agent_id', agent_id)
        }

        // Ordenar por fecha y hora
        query = query
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true })

        // Ejecutar la consulta
        const { data, error } = await query
        if (error) {
            console.error('Error al obtener citas por rango de fechas:', error)
            throw new Error(
                'Error al obtener las citas para el rango de fechas especificado',
            )
        }
        // Si no hay citas en el rango, devolver array vacío (sin datos de ejemplo)
        if (!data || data.length === 0) {
            console.log(
                `getAppointmentsByDateRange: no hay citas para ${startDate} - ${endDate}`,
            )
            return []
        }

        // Transformar los datos para el formato esperado por el calendario
        const formattedAppointments = data.map((appointment) => ({
            ...appointment,
            // Si hay relaciones que deben ser aplanadas, hacerlo aquí
            leadName: appointment.lead?.full_name || 'Sin nombre',
            agentName: appointment.agent?.users?.full_name || 'Sin asignar',
            agentEmail: appointment.agent?.users?.email || '',
            agentPhone: appointment.agent?.users?.phone || '',
            agentAvatar: appointment.agent?.users?.avatar_url || '',
            // Otras transformaciones necesarias
        }))

        return formattedAppointments
    } catch (error) {
        console.error('Error en getAppointmentsByDateRange:', error)
        // En lugar de usar getAppointments como fallback, devolver array vacío
        console.log(
            `getAppointmentsByDateRange: error al obtener citas para ${startDate} - ${endDate}, devolviendo array vacío`,
        )
        return []
    }
}

export default getAppointmentsByDateRange
