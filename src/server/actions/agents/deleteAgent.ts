/**
 * server/actions/agents/deleteAgent.ts
 * Acción del servidor para eliminar un agente inmobiliario.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export async function deleteAgent(agentId: string) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const { tenant_id } = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Verificar que el agente existe y pertenece al tenant actual
        const { data: existingAgent, error: checkError } = await supabase
            .from('agents')
            .select('id')
            .eq('id', agentId)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (checkError || !existingAgent) {
            console.error('Error al verificar agente:', checkError)
            throw new Error('El agente no existe o no tienes permiso para eliminarlo')
        }
        
        // Eliminar el agente
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', agentId)
            .eq('tenant_id', tenant_id)
        
        if (error) {
            console.error('Error al eliminar agente:', error)
            throw new Error(`Error al eliminar el agente: ${error.message}`)
        }
        
        return { success: true }
    } catch (error) {
        console.error('Error en deleteAgent:', error)
        throw error
    }
}

export default deleteAgent
