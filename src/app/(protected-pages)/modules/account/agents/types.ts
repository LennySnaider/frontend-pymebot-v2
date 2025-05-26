/**
 * Tipos para el módulo de agentes
 */

export interface Agent {
    id: string
    user_id: string
    tenant_id: string
    specialization?: string
    commission_rate?: number
    total_sales?: number
    active_leads?: number
    availability?: Record<string, any>
    created_at: string
    updated_at: string
    // Campos del usuario asociado
    email: string
    full_name: string
    phone?: string
    role: 'agent' | 'manager' | 'admin' | 'super_admin'
    status: 'active' | 'inactive' | 'suspended'
    avatar_url?: string
    last_activity?: string
    metadata?: Record<string, any>
}

export interface CreateAgentData {
    email: string
    full_name: string
    phone?: string
    role: 'agent'
    specialization?: string
    commission_rate?: number
}

export interface UpdateAgentData {
    full_name?: string
    phone?: string
    status?: 'active' | 'inactive' | 'suspended'
    specialization?: string
    commission_rate?: number
}

export interface AgentFilters {
    search?: string
    status?: string
    specialization?: string
    sortBy?: string
    order?: 'asc' | 'desc'
}

export interface AgentListResponse {
    list: Agent[]
    total: number
}