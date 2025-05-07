/**
 * server/actions/appointments/updateAppointmentStatus.ts
 * Acción del servidor para actualizar específicamente el estado de una cita.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { AppointmentData } from './getAppointments'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'

export interface UpdateAppointmentStatusResult {
    success: boolean
    appointment: AppointmentData | null
    error?: string
    statusChanged: boolean
    previousStatus?: string
}

export async function updateAppointmentStatus(
    appointmentId: string, 
    newStatus: AppointmentStatus, 
    notes?: string,
    follow_up_date?: string | Date,
    follow_up_notes?: string
) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const { tenant_id } = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Obtener la cita actual para saber si ha cambiado el estado
        const { data: currentAppointment, error: checkError } = await supabase
            .from('appointments')
            .select('status, lead_id, agent_id')
            .eq('id', appointmentId)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (checkError || !currentAppointment) {
            console.error('Error al verificar cita:', checkError)
            return {
                success: false,
                appointment: null,
                error: 'La cita no existe o no tienes permiso para actualizarla',
                statusChanged: false
            }
        }
        
        // Si el estado es el mismo, no hacer nada
        if (currentAppointment.status === newStatus) {
            return {
                success: true,
                appointment: currentAppointment as AppointmentData,
                statusChanged: false
            }
        }
        
        const previousStatus = currentAppointment.status
        
        // Preparar los datos para actualizar
        const updateData: any = {
            status: newStatus
        }
        
        // Si se proporcionan notas, actualizar también las notas
        if (notes) {
            updateData.notes = notes
        }
        
        // Si se cancela la cita o completa, registrar fecha de seguimiento si se proporciona
        if ((newStatus === 'cancelled' || newStatus === 'completed') && follow_up_date) {
            updateData.follow_up_date = follow_up_date instanceof Date 
                ? follow_up_date.toISOString().split('T')[0] 
                : follow_up_date
            
            if (follow_up_notes) {
                updateData.follow_up_notes = follow_up_notes
            }
        }
        
        // Actualizar el estado de la cita
        const { data, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', appointmentId)
            .eq('tenant_id', tenant_id)
            .select()
            .single()
        
        if (error) {
            console.error('Error al actualizar estado de la cita:', error)
            return {
                success: false,
                appointment: null,
                error: `Error al actualizar el estado: ${error.message}`,
                statusChanged: false
            }
        }
        
        // La función log_appointment_status_change ya registra automáticamente el cambio de estado,
        // no necesitamos insertar manualmente en lead_activities
        
        // Si hay notas adicionales, registrarlas como actividad separada
        if (notes) {
            const { error: notesError } = await supabase
                .from('lead_activities')
                .insert({
                    lead_id: currentAppointment.lead_id,
                    agent_id: currentAppointment.agent_id,
                    activity_type: 'appointment_status_note',
                    description: notes,
                    tenant_id,
                    metadata: {
                        appointment_id: appointmentId,
                        from_status: previousStatus,
                        to_status: newStatus
                    }
                })
            
            if (notesError) {
                console.error('Error al registrar notas de cambio de estado:', notesError)
                // Continuamos aunque haya error en el registro de notas
            }
        }
        
        return {
            success: true,
            appointment: data as AppointmentData,
            statusChanged: true,
            previousStatus
        }
    } catch (error) {
        console.error('Error en updateAppointmentStatus:', error)
        return {
            success: false,
            appointment: null,
            error: 'Error inesperado al actualizar el estado',
            statusChanged: false
        }
    }
}

export default updateAppointmentStatus
