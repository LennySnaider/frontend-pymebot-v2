/**
 * server/actions/agents/updateAgent.ts
 * Acción del servidor para actualizar un agente inmobiliario existente.
 * 
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import type { AgentData } from './getAgents'

export interface UpdateAgentData {
    name?: string
    email?: string
    phone?: string
    profile_image?: string
    bio?: string
    specializations?: string[]
    years_experience?: number
    languages?: string[]
    license_number?: string
    rating?: number
    is_active?: boolean
    commission_rate?: number
    availability?: Record<string, any>
}

export async function updateAgent(agentId: string, updateData: UpdateAgentData) {
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
            throw new Error('El agente no existe o no tienes permiso para actualizarlo')
        }
        
        // Actualizar el agente
        const { data, error } = await supabase
            .from('agents')
            .update(updateData)
            .eq('id', agentId)
            .eq('tenant_id', tenant_id)
            .select()
            .single()
        
        if (error) {
            console.error('Error al actualizar agente:', error)
            throw new Error(`Error al actualizar el agente: ${error.message}`)
        }
        
        return data as AgentData
    } catch (error) {
        console.error('Error en updateAgent:', error)
        throw error
    }
}

export default updateAgent
