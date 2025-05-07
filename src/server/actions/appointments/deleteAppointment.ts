/**
 * server/actions/appointments/deleteAppointment.ts
 * Acción del servidor para eliminar una cita.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export async function deleteAppointment(appointmentId: string, registerActivity: boolean = true) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const { tenant_id } = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Verificar que la cita existe y pertenece al tenant actual
        const { data: existingAppointment, error: checkError } = await supabase
            .from('appointments')
            .select('id, lead_id, agent_id, appointment_date, appointment_time')
            .eq('id', appointmentId)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (checkError || !existingAppointment) {
            console.error('Error al verificar cita:', checkError)
            throw new Error('La cita no existe o no tienes permiso para eliminarla')
        }
        
        // Si se solicita registrar la actividad, hacerlo antes de eliminar la cita
        if (registerActivity) {
            const { error: activityError } = await supabase
                .from('lead_activities')
                .insert({
                    lead_id: existingAppointment.lead_id,
                    agent_id: existingAppointment.agent_id,
                    activity_type: 'appointment_deleted',
                    description: `Cita eliminada: ${existingAppointment.appointment_date} a las ${existingAppointment.appointment_time}`,
                    tenant_id,
                    metadata: {
                        appointment_id: appointmentId,
                        appointment_date: existingAppointment.appointment_date,
                        appointment_time: existingAppointment.appointment_time
                    }
                })
            
            if (activityError) {
                console.error('Error al registrar actividad de eliminación de cita:', activityError)
                // Continuamos aunque haya error en el registro de actividad
            }
        }
        
        // Eliminar la cita
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointmentId)
            .eq('tenant_id', tenant_id)
        
        if (error) {
            console.error('Error al eliminar cita:', error)
            throw new Error(`Error al eliminar la cita: ${error.message}`)
        }
        
        return { 
            success: true,
            lead_id: existingAppointment.lead_id
        }
    } catch (error) {
        console.error('Error en deleteAppointment:', error)
        throw error
    }
}

export default deleteAppointment
