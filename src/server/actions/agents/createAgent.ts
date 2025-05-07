/**
 * server/actions/agents/createAgent.ts
 * Acción del servidor para crear un nuevo agente inmobiliario.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { AgentData } from './getAgents'

export interface CreateAgentData {
    name: string
    email: string
    phone?: string
    profile_image?: string
    bio?: string
    specializations?: string[]
    years_experience?: number
    languages?: string[]
    license_number?: string
    commission_rate?: number
    availability?: Record<string, any>
    user_id?: string  // Opcional, para vincular con un usuario existente
}

export async function createAgent(agentData: CreateAgentData) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const { tenant_id } = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Crear el nuevo agente
        const { data, error } = await supabase
            .from('agents')
            .insert({
                ...agentData,
                is_active: true,
                tenant_id
            })
            .select()
            .single()
        
        if (error) {
            console.error('Error al crear agente:', error)
            throw new Error(`Error al crear el agente: ${error.message}`)
        }
        
        return data as AgentData
    } catch (error) {
        console.error('Error en createAgent:', error)
        throw error
    }
}

export default createAgent
