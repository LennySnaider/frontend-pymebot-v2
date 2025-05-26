/**
 * Servicio para gestión de agentes
 */

import ApiService from './ApiService'
import type { AgentAvailabilityUpdate } from '@/server/actions/agents/updateAgentAvailability'

export async function updateAgentAvailability(agentId: string, availability: AgentAvailabilityUpdate) {
    const response = await ApiService.fetchData({
        url: `/agents/${agentId}/availability`,
        method: 'PUT',
        data: { availability }
    })
    
    return response.data
}

export async function getAgentAvailability(agentId: string) {
    const response = await ApiService.fetchData({
        url: `/agents/${agentId}/availability`,
        method: 'GET'
    })
    
    return response.data
}