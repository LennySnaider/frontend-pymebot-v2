/**
 * server/actions/appointments/updateAppointment.ts
 * Acción del servidor para actualizar una cita existente.
 * 
 * @version 1.1.0
 * @updated 2025-04-14
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { AppointmentData } from './getAppointments'
import { format } from 'date-fns'

export interface UpdateAppointmentData {
    agent_id?: string | object
    appointment_date?: string | Date
    appointment_time?: string
    location?: string
    property_type?: string
    status?: string
    notes?: string
    property_ids?: Array<string | object>
    follow_up_date?: string | Date | null
    follow_up_notes?: string
}

export async function updateAppointment(appointmentId: string, updateData: UpdateAppointmentData) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Verificar que la cita existe y pertenece al tenant actual
        const { data: existingAppointment, error: checkError } = await supabase
            .from('appointments')
            .select('id, lead_id, status')
            .eq('id', appointmentId)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (checkError || !existingAppointment) {
            console.error('Error al verificar cita:', checkError)
            throw new Error('La cita no existe o no tienes permiso para actualizarla')
        }
        
        // Preparar los datos para actualizar - normalizando los valores para evitar errores de tipo
        const appointmentUpdateData: Record<string, any> = {}
        
        // Normalizar agent_id si está presente
        if (updateData.agent_id !== undefined) {
            if (typeof updateData.agent_id === 'object' && updateData.agent_id !== null) {
                if ('id' in updateData.agent_id && typeof updateData.agent_id.id === 'string') {
                    appointmentUpdateData.agent_id = updateData.agent_id.id
                } else {
                    // Si no podemos extraer un ID válido, mantenemos el valor actual
                    console.warn('ID de agente inválido, se mantiene el valor actual')
                }
            } else if (typeof updateData.agent_id === 'string') {
                appointmentUpdateData.agent_id = updateData.agent_id
            }
        }
        
        // Normalizar property_ids si está presente
        if (updateData.property_ids !== undefined) {
            if (Array.isArray(updateData.property_ids)) {
                const normalizedPropertyIds: string[] = []
                updateData.property_ids.forEach(item => {
                    if (typeof item === 'string') {
                        normalizedPropertyIds.push(item)
                    } else if (typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string') {
                        normalizedPropertyIds.push(item.id)
                    }
                })
                appointmentUpdateData.property_ids = normalizedPropertyIds
            } else {
                // Si no es un array, lo establecemos como array vacío
                appointmentUpdateData.property_ids = []
            }
        }
        
        // Transferir otros campos simples
        if (updateData.appointment_time !== undefined) appointmentUpdateData.appointment_time = updateData.appointment_time
        if (updateData.location !== undefined) appointmentUpdateData.location = updateData.location
        if (updateData.property_type !== undefined) appointmentUpdateData.property_type = updateData.property_type
        if (updateData.status !== undefined) appointmentUpdateData.status = updateData.status
        if (updateData.notes !== undefined) appointmentUpdateData.notes = updateData.notes
        if (updateData.follow_up_notes !== undefined) appointmentUpdateData.follow_up_notes = updateData.follow_up_notes
        
        // Formatear fechas si son objetos Date
        if (updateData.appointment_date !== undefined) {
            if (updateData.appointment_date instanceof Date) {
                appointmentUpdateData.appointment_date = format(updateData.appointment_date, 'yyyy-MM-dd')
            } else {
                appointmentUpdateData.appointment_date = updateData.appointment_date
            }
        }
        
        if (updateData.follow_up_date !== undefined) {
            if (updateData.follow_up_date instanceof Date) {
                appointmentUpdateData.follow_up_date = format(updateData.follow_up_date, 'yyyy-MM-dd')
            } else if (updateData.follow_up_date === null) {
                appointmentUpdateData.follow_up_date = null
            } else {
                appointmentUpdateData.follow_up_date = updateData.follow_up_date
            }
        }
        
        // Registrar información para depuración
        console.log('Actualizando cita con datos normalizados:', {
            appointmentId,
            update: appointmentUpdateData
        })
        
        // Actualizar la cita
        const { data, error } = await supabase
            .from('appointments')
            .update(appointmentUpdateData)
            .eq('id', appointmentId)
            .eq('tenant_id', tenant_id)
            .select()
            .single()
        
        if (error) {
            console.error('Error al actualizar cita:', error)
            throw new Error(`Error al actualizar la cita: ${error.message}`)
        }
        
        // Si se cambió el estado a "completed", opcionalmente actualizar el lead
        if (updateData.status === 'completed' && existingAppointment.status !== 'completed') {
            // Crear una actividad de cita completada
            try {
                await supabase
                    .from('lead_activities')
                    .insert({
                        lead_id: existingAppointment.lead_id,
                        type: 'appointment_completed',
                        description: 'Cita completada',
                        tenant_id,
                        metadata: {
                            appointment_id: appointmentId,
                            appointment_date: data.appointment_date,
                            appointment_time: data.appointment_time
                        }
                    })
                
                console.log('Actividad de cita completada registrada para lead:', existingAppointment.lead_id)
            } catch (activityError) {
                console.error('Error al registrar actividad de cita completada:', activityError)
                // Continuamos aunque haya error en el registro de actividad
            }
            
            // Si hay notas de seguimiento, registrarlas
            if (updateData.follow_up_notes) {
                try {
                    await supabase
                        .from('lead_activities')
                        .insert({
                            lead_id: existingAppointment.lead_id,
                            type: 'appointment_follow_up',
                            description: updateData.follow_up_notes,
                            tenant_id,
                            metadata: {
                                appointment_id: appointmentId,
                                follow_up_date: data.follow_up_date
                            }
                        })
                    
                    console.log('Notas de seguimiento registradas para lead:', existingAppointment.lead_id)
                } catch (followUpError) {
                    console.error('Error al registrar notas de seguimiento:', followUpError)
                    // Continuamos aunque haya error en el registro de actividad
                }
            }
        }
        
        return data as AppointmentData
    } catch (error) {
        console.error('Error en updateAppointment:', error)
        throw error
    }
}

export default updateAppointment