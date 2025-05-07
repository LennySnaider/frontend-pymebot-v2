/**
 * server/actions/appointments/createAppointment.ts
 * Acción del servidor para crear una nueva cita inmobiliaria.
 * 
 * @version 1.1.0
 * @updated 2025-04-14
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { AppointmentData } from './getAppointments'
import { format } from 'date-fns'

export interface CreateAppointmentData {
    lead_id: string | object
    agent_id?: string | object
    appointment_date: string | Date
    appointment_time: string
    location: string
    property_type?: string
    status?: string
    notes?: string
    property_ids?: Array<string | object>
    follow_up_date?: string | Date
    follow_up_notes?: string
}

export async function createAppointment(appointmentData: CreateAppointmentData) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Normalizar IDs para manejar tanto strings como objetos
        // Extraer lead_id si es un objeto
        let lead_id: string
        if (typeof appointmentData.lead_id === 'object' && appointmentData.lead_id !== null) {
            if ('id' in appointmentData.lead_id && typeof appointmentData.lead_id.id === 'string') {
                lead_id = appointmentData.lead_id.id
            } else {
                throw new Error('ID de prospecto inválido')
            }
        } else if (typeof appointmentData.lead_id === 'string') {
            lead_id = appointmentData.lead_id
        } else {
            throw new Error('ID de prospecto requerido')
        }
        
        // Normalizar agent_id
        let agent_id: string | null = null
        if (appointmentData.agent_id) {
            if (typeof appointmentData.agent_id === 'object' && appointmentData.agent_id !== null) {
                if ('id' in appointmentData.agent_id && typeof appointmentData.agent_id.id === 'string') {
                    agent_id = appointmentData.agent_id.id
                }
            } else if (typeof appointmentData.agent_id === 'string') {
                agent_id = appointmentData.agent_id
            }
        }
        
        // Normalizar property_ids - convertir objetos a sus IDs
        const property_ids: string[] = []
        if (appointmentData.property_ids && Array.isArray(appointmentData.property_ids)) {
            appointmentData.property_ids.forEach(item => {
                if (typeof item === 'string') {
                    property_ids.push(item)
                } else if (typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string') {
                    property_ids.push(item.id)
                }
            })
        }
        
        // Verificar que el lead existe y pertenece al tenant actual
        const { data: existingLead, error: leadError } = await supabase
            .from('leads')
            .select('id, agent_id')
            .eq('id', lead_id)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (leadError || !existingLead) {
            console.error('Error al verificar lead:', leadError)
            throw new Error('El lead no existe o no tienes permiso para crear una cita')
        }
        
        // Si no se proporciona agente, usar el agente del lead si existe
        const finalAgentId = agent_id || existingLead.agent_id || null
        
        // Formatear fechas si son objetos Date
        const appointment_date = appointmentData.appointment_date instanceof Date
            ? format(appointmentData.appointment_date, 'yyyy-MM-dd')
            : appointmentData.appointment_date
        
        const follow_up_date = appointmentData.follow_up_date instanceof Date
            ? format(appointmentData.follow_up_date, 'yyyy-MM-dd')
            : appointmentData.follow_up_date
        
        // Registrar información para depuración
        console.log('Creando cita con datos normalizados:', {
            lead_id,
            agent_id: finalAgentId,
            property_ids,
            appointment_date,
            appointment_time: appointmentData.appointment_time,
            tenant_id
        })
        
        // Crear la nueva cita
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                lead_id,
                agent_id: finalAgentId,
                appointment_date,
                appointment_time: appointmentData.appointment_time,
                location: appointmentData.location || 'Sin definir',
                property_type: appointmentData.property_type || null,
                status: appointmentData.status || 'scheduled',
                notes: appointmentData.notes || null,
                property_ids,
                follow_up_date: follow_up_date || null,
                follow_up_notes: appointmentData.follow_up_notes || null,
                tenant_id
            })
            .select()
            .single()
        
        if (error) {
            console.error('Error al crear cita:', error)
            throw new Error(`Error al crear la cita: ${error.message}`)
        }
        
        // Opcional: Registrar actividad en el lead
        try {
            await supabase
                .from('lead_activities')
                .insert({
                    lead_id,
                    type: 'appointment_created',
                    description: `Cita agendada para el ${appointment_date} a las ${appointmentData.appointment_time}`,
                    tenant_id,
                    metadata: {
                        appointment_id: data.id,
                        appointment_date,
                        appointment_time: appointmentData.appointment_time
                    }
                })
        } catch (activityError) {
            console.error('Error al registrar actividad del lead:', activityError)
            // Continuamos aunque haya error en el registro de actividad
        }
        
        return data as AppointmentData
    } catch (error) {
        console.error('Error en createAppointment:', error)
        throw error
    }
}

export default createAppointment