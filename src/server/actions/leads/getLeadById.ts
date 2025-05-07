/**
 * server/actions/leads/getLeadById.ts
 * Acción del servidor para obtener un lead específico por su ID.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { LeadData } from './getLeads'

export async function getLeadById(leadId: string) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        // getTenantFromSession() devuelve directamente el tenant_id como string
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Obtener el lead con sus actividades y detalles completos
        const { data, error } = await supabase
            .from('leads')
            .select(`
                *,
                lead_activities(*),
                agent:agents(id, name, email, phone)
            `)
            .eq('id', leadId)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (error) {
            console.error('Error al obtener lead por ID:', error)
            if (error.code === 'PGRST116') {
                // No se encontró ningún registro
                return null
            }
            throw new Error('Error al obtener el lead')
        }
        
        // Obtener las citas asociadas al lead
        const { data: appointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('lead_id', leadId)
            .eq('tenant_id', tenant_id)
            .order('appointment_date', { ascending: false })
        
        if (appointmentsError) {
            console.error('Error al obtener citas del lead:', appointmentsError)
            // Continuamos aunque haya error en las citas
        }
        
        // Procesamos los datos para extraer los property_ids de las actividades del lead
        // Esto es útil para saber qué propiedades ha visto o mostrado interés el lead
        const propertyIds: string[] = []
        
        // Si ya existe un campo property_ids, lo usamos
        if (data.property_ids && Array.isArray(data.property_ids)) {
            propertyIds.push(...data.property_ids)
        }
        
        // Añadimos propiedades de las actividades que no estén ya en el array
        if (data.lead_activities && data.lead_activities.length > 0) {
            data.lead_activities.forEach(activity => {
                if (activity.type === 'property_viewed' && 
                    activity.metadata?.property_id && 
                    !propertyIds.includes(activity.metadata.property_id)) {
                    propertyIds.push(activity.metadata.property_id)
                }
            })
        }
        
        // Añadimos propiedades de las citas que no estén ya en el array
        if (appointments && appointments.length > 0) {
            appointments.forEach(appointment => {
                if (appointment.property_ids && Array.isArray(appointment.property_ids)) {
                    appointment.property_ids.forEach(propId => {
                        if (!propertyIds.includes(propId)) {
                            propertyIds.push(propId)
                        }
                    })
                }
            })
        }
        
        return {
            ...data,
            appointments: appointments || [],
            property_ids: propertyIds.length > 0 ? propertyIds : data.property_ids || []
        } as LeadData & { 
            appointments: any[], 
            lead_activities: any[],
            agent?: { id: string, name: string, email?: string, phone?: string } 
        }
    } catch (error) {
        console.error('Error en getLeadById:', error)
        throw error
    }
}

export default getLeadById
