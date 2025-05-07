/**
 * server/actions/agents/getAgentById.ts
 * Acción del servidor para obtener un agente inmobiliario específico por su ID.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { AgentData } from './getAgents'

export async function getAgentById(agentId: string) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const { tenant_id } = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Obtener el agente por ID y asegurar que pertenece al tenant actual
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .eq('tenant_id', tenant_id)
            .single()
        
        if (error) {
            console.error('Error al obtener agente por ID:', error)
            if (error.code === 'PGRST116') {
                // No se encontró ningún registro
                return null
            }
            throw new Error('Error al obtener el agente')
        }
        
        return data as AgentData
    } catch (error) {
        console.error('Error en getAgentById:', error)
        throw error
    }
}

export default getAgentById
