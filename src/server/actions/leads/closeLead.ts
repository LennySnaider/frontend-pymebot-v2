/**
 * Acción directa para cerrar un lead
 * No depende de updateLead y maneja directamente la actualización
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export async function closeLead(leadId: string) {
    try {
        const supabase = SupabaseClient.getInstance()
        const tenant_id = await getTenantFromSession()
        
        console.log('closeLead: Cerrando lead', { leadId, tenant_id })
        
        // Actualizar directamente sin usar updateLead
        const { data, error } = await supabase
            .from('leads')
            .update({
                status: 'closed',
                stage: 'closed',
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId)
            .eq('tenant_id', tenant_id)
            .select()
            .single()
        
        if (error) {
            console.error('Error al cerrar lead:', error)
            throw new Error(`Error al cerrar lead: ${error.message}`)
        }
        
        console.log('Lead cerrado exitosamente:', data)
        return data
        
    } catch (error) {
        console.error('Error en closeLead:', error)
        throw error
    }
}