/**
 * Tipos para el módulo de agentes
 */

export interface Agent {
    id: string
    email: string
    full_name: string
    phone?: string
    role: 'agent' | 'tenant_admin' | 'super_admin'
    status: 'active' | 'inactive' | 'suspended'
    avatar_url?: string
    created_at: string
    updated_at: string
    last_activity?: string
    tenant_id: string
    // Campos adicionales específicos de agentes
    specialization?: string
    commission_rate?: number
    total_sales?: number
    active_leads?: number
    // Metadata que contiene información adicional del agente
    metadata?: {
        bio?: string
        specializations?: string[]
        languages?: string[]
        profile_image?: string
        license_number?: string
        years_experience?: number
        commission_rate?: number
        availability?: Record<string, any>
        rating?: number
    }
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