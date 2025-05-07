/**
 * server/actions/leads/logLeadActivity.ts
 * Acción del servidor para registrar una actividad personalizada para un lead.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export interface LeadActivity {
    id: string
    lead_id: string
    agent_id?: string
    activity_type: string
    description: string
    created_at: string
    updated_at: string
    tenant_id: string
    metadata?: Record<string, any>
}

export async function logLeadActivity(
    leadId: string,
    activityType: string,
    description: string,
    agentId?: string,
    metadata?: Record<string, any>
) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const { tenant_id } = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Verificar que el lead existe y pertenece al tenant actual
        const { data: existingLead, error: checkError } = await supabase
            .from('leads')
            .select('id, agent_id, contact_count')
            .eq('id', leadId)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (checkError || !existingLead) {
            console.error('Error al verificar lead:', checkError)
            throw new Error('El lead no existe o no tienes permiso para registrar actividad')
        }
        
        // Si no se proporciona agentId, usar el agente actual del lead si existe
        const finalAgentId = agentId || existingLead.agent_id
        
        // Crear la nueva actividad
        const { data, error } = await supabase
            .from('lead_activities')
            .insert({
                lead_id: leadId,
                agent_id: finalAgentId,
                activity_type: activityType,
                description: description,
                tenant_id,
                metadata: metadata || {}
            })
            .select()
            .single()
        
        if (error) {
            console.error('Error al registrar actividad:', error)
            throw new Error(`Error al registrar la actividad: ${error.message}`)
        }
        
        // Si la actividad es de tipo contacto, incrementar el contador de contactos
        if (activityType === 'contact' || activityType === 'call' || activityType === 'email' || activityType === 'meeting') {
            const { error: updateError } = await supabase
                .from('leads')
                .update({
                    contact_count: (existingLead.contact_count || 0) + 1,
                    last_contact_date: new Date().toISOString()
                })
                .eq('id', leadId)
                .eq('tenant_id', tenant_id)
            
            if (updateError) {
                console.error('Error al actualizar contador de contactos:', updateError)
                // Continuamos aunque haya error en la actualización del contador
            }
        }
        
        return data as LeadActivity
    } catch (error) {
        console.error('Error en logLeadActivity:', error)
        throw error
    }
}

export default logLeadActivity
