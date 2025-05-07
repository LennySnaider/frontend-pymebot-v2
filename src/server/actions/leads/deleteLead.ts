/**
 * server/actions/leads/deleteLead.ts
 * Acción del servidor para eliminar un lead existente.
 * 
 * @version 1.0.0
 * @updated 2025-06-14
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export async function deleteLead(leadId: string) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Primero eliminar posibles registros relacionados en lead_members
        const { error: membersError } = await supabase
            .from('lead_members')
            .delete()
            .eq('lead_id', leadId)
            .eq('tenant_id', tenant_id)
        
        if (membersError) {
            console.warn('Error al eliminar registros relacionados en lead_members:', membersError)
            // Continuamos aunque haya error en la eliminación de relaciones
        }
        
        // Registrar la actividad de eliminación antes de eliminar el lead
        const { error: activityError } = await supabase
            .from('lead_activities')
            .insert({
                lead_id: leadId,
                activity_type: 'lead_deleted',
                description: 'Lead eliminado del sistema',
                tenant_id,
                metadata: {
                    deleted_at: new Date().toISOString()
                }
            })
        
        if (activityError) {
            console.warn('Error al registrar actividad de eliminación:', activityError)
            // Continuamos aunque haya error en el registro de actividad
        }
        
        // Eliminar el lead
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId)
            .eq('tenant_id', tenant_id)
        
        if (error) {
            console.error('Error al eliminar lead:', error)
            throw new Error(`Error al eliminar el lead: ${error.message}`)
        }
        
        return { success: true, message: 'Lead eliminado correctamente' }
    } catch (error) {
        console.error('Error en deleteLead:', error)
        throw error
    }
}

export default deleteLead
