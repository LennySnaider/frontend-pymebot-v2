/**
 * Server action para obtener lista de agentes
 * Consulta usuarios con rol de agente del tenant actual
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'
import paginate from '@/utils/paginate'
import type { Agent, AgentListResponse } from '@/app/(protected-pages)/modules/account/agents/types'

export async function getAgents(queryParams: {
    [key: string]: string | string[] | undefined
}): Promise<AgentListResponse> {
    try {
        const supabase = SupabaseClient.getInstance()
        const tenant_id = await getTenantFromSession()
        
        const {
            pageIndex = '1',
            pageSize = '10',
            search = '',
            status = '',
            specialization = '',
            sortBy = 'created_at',
            order = 'desc'
        } = queryParams
        
        console.log('Obteniendo agentes para tenant:', tenant_id)
        
        // Query base para agentes - dos queries separadas
        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenant_id)
            .eq('role', 'agent')
        
        // Aplicar filtros
        if (status) {
            query = query.eq('status', status)
        }
        
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        }
        
        // Ordenamiento
        query = query.order(sortBy as string, { ascending: order !== 'desc' })
        
        // Ejecutar query
        const { data, error, count } = await query
        
        if (error) {
            console.error('Error al obtener agentes:', error)
            throw new Error(error.message)
        }
        
        // Obtener el conteo de leads para cada agente
        const leadsCount: Record<string, number> = {}
        if (data && data.length > 0) {
            const agentUserIds = data.map(user => user.id)
            
            // Obtener conteo de leads directamente por user_id
            const { data: leadCounts } = await supabase
                .from('leads')
                .select('agent_id, id')
                .in('agent_id', agentUserIds)
                .eq('tenant_id', tenant_id)
            
            if (leadCounts) {
                // Contar leads por agent_id (que ahora es user_id)
                leadCounts.forEach(lead => {
                    if (lead.agent_id) {
                        leadsCount[lead.agent_id] = (leadsCount[lead.agent_id] || 0) + 1
                    }
                })
            }
        }
        
        // Procesar datos
        const agents: Agent[] = (data || []).map(user => ({
            id: user.id,
            email: user.email,
            full_name: user.full_name || user.email.split('@')[0],
            phone: user.phone,
            role: user.role,
            status: user.status || 'active',
            avatar_url: user.avatar_url || user.metadata?.profile_image,
            created_at: user.created_at,
            updated_at: user.updated_at,
            last_activity: user.last_activity,
            tenant_id: user.tenant_id,
            specialization: user.metadata?.specializations?.[0] || user.specialization || 'general',
            commission_rate: user.metadata?.commission_rate || user.commission_rate || 5,
            total_sales: user.total_sales || 0,
            active_leads: leadsCount[user.id] || 0,
            metadata: user.metadata
        }))
        
        // Aplicar paginación
        const paginatedAgents = paginate(
            agents,
            parseInt(pageSize as string),
            parseInt(pageIndex as string)
        )
        
        return {
            list: paginatedAgents,
            total: count || 0
        }
    } catch (error) {
        console.error('Error en getAgents:', error)
        throw error
    }
}

export default getAgents