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
        
        // Query base para agentes usando JOIN con usuarios
        let query = supabase
            .from('agents')
            .select(`
                *,
                users!inner(
                    id,
                    email,
                    full_name,
                    phone,
                    role,
                    status,
                    avatar_url,
                    last_activity,
                    metadata
                )
            `, { count: 'exact' })
            .eq('tenant_id', tenant_id)
        
        // Aplicar filtros
        if (status) {
            query = query.eq('users.status', status)
        }
        
        if (search) {
            query = query.or(`users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`)
        }
        
        if (specialization) {
            query = query.eq('specialization', specialization)
        }
        
        // Ordenamiento
        if (sortBy.includes('users.')) {
            query = query.order(sortBy as string, { ascending: order !== 'desc' })
        } else {
            query = query.order(sortBy as string, { ascending: order !== 'desc' })
        }
        
        // Ejecutar query
        const { data, error, count } = await query
        
        if (error) {
            console.error('Error al obtener agentes:', error)
            throw new Error(error.message)
        }
        
        // Obtener el conteo de leads para cada agente
        const leadsCount: Record<string, number> = {}
        if (data && data.length > 0) {
            const agentUserIds = data.map(agent => agent.user_id)
            
            // Obtener conteo de leads directamente por user_id
            const { data: leadCounts } = await supabase
                .from('leads')
                .select('agent_id, id')
                .in('agent_id', agentUserIds)
                .eq('tenant_id', tenant_id)
            
            if (leadCounts) {
                // Contar leads por agent_id (que es user_id)
                leadCounts.forEach(lead => {
                    if (lead.agent_id) {
                        leadsCount[lead.agent_id] = (leadsCount[lead.agent_id] || 0) + 1
                    }
                })
            }
        }
        
        // Procesar datos
        const agents: Agent[] = (data || []).map(agent => {
            const user = (agent as any).users
            return {
                id: agent.id,
                user_id: agent.user_id,
                tenant_id: agent.tenant_id,
                specialization: agent.specialization,
                commission_rate: agent.commission_rate,
                total_sales: agent.total_sales,
                active_leads: leadsCount[agent.user_id] || 0,
                availability: agent.availability,
                created_at: agent.created_at,
                updated_at: agent.updated_at,
                // Campos del usuario
                email: user.email,
                full_name: user.full_name || user.email.split('@')[0],
                phone: user.phone,
                role: user.role,
                status: user.status || 'active',
                avatar_url: user.avatar_url,
                last_activity: user.last_activity,
                metadata: user.metadata
            }
        })
        
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