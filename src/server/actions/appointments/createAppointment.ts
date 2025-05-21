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
import { filterValidUUIDs } from '@/utils/uuid'

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
        
        console.log('createAppointment - tenant_id obtenido de la sesión:', tenant_id)
        
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
        
        // Normalizar property_ids - convertir objetos a sus IDs y validar UUIDs
        let property_ids: string[] = []
        if (appointmentData.property_ids && Array.isArray(appointmentData.property_ids)) {
            property_ids = filterValidUUIDs(appointmentData.property_ids)
            
            // Log para debug
            console.log('Property IDs antes de validación:', appointmentData.property_ids)
            console.log('Property IDs después de validación (solo UUIDs válidos):', property_ids)
        }
        
        // Log para debug
        console.log('Buscando lead con id:', lead_id, 'y tenant_id:', tenant_id)
        
        // Verificar que el lead existe y pertenece al tenant actual
        const { data: existingLead, error: leadError } = await supabase
            .from('leads')
            .select('id, agent_id, tenant_id')
            .eq('id', lead_id)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (leadError || !existingLead) {
            console.error('Error al verificar lead:', leadError)
            console.error('Detalles del error:', {
                leadError,
                existingLead,
                lead_id,
                tenant_id
            })
            
            // Intentar buscar el lead sin el filtro de tenant para debug
            const { data: leadWithoutTenant, error: leadWithoutTenantError } = await supabase
                .from('leads')
                .select('id, tenant_id')
                .eq('id', lead_id)
                .single()
            
            if (leadWithoutTenant) {
                console.error('El lead existe pero con un tenant diferente:', {
                    lead_tenant_id: leadWithoutTenant.tenant_id,
                    expected_tenant_id: tenant_id
                })
                throw new Error(`El lead existe pero pertenece a un tenant diferente. Lead tenant: ${leadWithoutTenant.tenant_id}, esperado: ${tenant_id}`)
            } else {
                console.error('El lead no existe en la base de datos')
                throw new Error('El lead no existe en la base de datos')
            }
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