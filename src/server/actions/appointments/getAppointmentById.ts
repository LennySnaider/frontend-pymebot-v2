/**
 * server/actions/appointments/getAppointmentById.ts
 * Acción del servidor para obtener una cita específica por su ID.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { AppointmentData } from './getAppointments'

export async function getAppointmentById(appointmentId: string) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Obtener la cita
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (error) {
            console.error('Error al obtener cita por ID:', error)
            if (error.code === 'PGRST116') {
                // No se encontró ningún registro
                return null
            }
            throw new Error('Error al obtener la cita')
        }
        
        // Obtener información del lead asociado
        const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select('id, full_name, email, phone, status, stage')
            .eq('id', data.lead_id)
            .eq('tenant_id', tenant_id)
            .single()
        
        // Obtener información del agente asignado
        let agentData = null
        if (data.agent_id) {
            const { data: agent, error: agentError } = await supabase
                .from('agents')
                .select('id, name, email, phone, profile_image')
                .eq('id', data.agent_id)
                .eq('tenant_id', tenant_id)
                .single()
            
            if (!agentError) {
                agentData = agent
            }
        }
        
        // Obtener información de las propiedades asociadas si hay IDs
        let propertiesData = []
        if (data.property_ids && data.property_ids.length > 0) {
            const { data: properties, error: propertiesError } = await supabase
                .from('properties')
                .select('id, name, location, price, currency, property_type, status')
                .in('id', data.property_ids)
                .eq('tenant_id', tenant_id)
            
            if (!propertiesError && properties) {
                propertiesData = properties
            }
        }
        
        // Retornar la cita con información adicional
        return {
            ...data,
            lead: leadError ? null : leadData,
            agent: agentData,
            properties: propertiesData
        } as AppointmentData & { 
            lead?: any, 
            agent?: any, 
            properties?: any[] 
        }
    } catch (error) {
        console.error('Error en getAppointmentById:', error)
        throw error
    }
}

export default getAppointmentById
