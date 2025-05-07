/**
 * server/actions/leads/getLeads.ts
 * Acción del servidor para obtener leads con opciones de filtrado.
 * 
 * @version 1.1.0
 * @updated 2025-04-14
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export interface LeadData {
    id: string
    full_name: string
    email?: string
    phone?: string
    status: string
    stage: string
    source?: string
    interest_level?: string
    budget_min?: number
    budget_max?: number
    property_type?: string
    preferred_zones?: string[]
    preferred_location?: string
    bedrooms_needed?: number
    bathrooms_needed?: number
    features_needed?: string[]
    notes?: string
    agent_id?: string
    property_ids?: string[] // Lista de IDs de propiedades de interés
    last_contact_date?: string
    next_contact_date?: string
    contact_count: number
    created_at: string
    updated_at: string
    tenant_id: string
    metadata?: Record<string, any>
    
    // Relaciones opcionales
    agent?: {
        id: string
        name: string
        email?: string
        phone?: string
    }
    lead_activities?: Array<{
        id: string
        lead_id: string
        type: string
        description?: string
        metadata?: Record<string, any>
        created_at: string
        updated_at: string
    }>
    appointments?: Array<any> // Citas relacionadas con el lead
}

export interface LeadFilters {
    stage?: string
    status?: string
    agent_id?: string | object
    property_type?: string
    interest_level?: string
    source?: string
    search?: string
    fromDate?: string
    toDate?: string
}

export async function getLeads(filters: LeadFilters = {}) {
    try {
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        // getTenantFromSession() devuelve directamente el tenant_id como string
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Normalizar los filtros para evitar problemas con tipos incorrectos
        // Esto corrige el problema de "invalid input syntax for type uuid: "[object Object]"
        const normalizedFilters = { ...filters }
        
        // Verificar si agent_id es un objeto y extraer su ID si es necesario
        if (normalizedFilters.agent_id && typeof normalizedFilters.agent_id === 'object') {
            if ('id' in normalizedFilters.agent_id && typeof normalizedFilters.agent_id.id === 'string') {
                normalizedFilters.agent_id = normalizedFilters.agent_id.id
            } else {
                // Si no podemos extraer un ID válido, eliminamos el filtro
                delete normalizedFilters.agent_id
            }
        }
        
        // Construir la consulta base
        let query = supabase
            .from('leads')
            .select(`
                *,
                agent:agents(id, name)
            `)
            .eq('tenant_id', tenant_id)
        
        // Aplicar filtros normalizados
        if (normalizedFilters.stage) {
            query = query.eq('stage', normalizedFilters.stage)
        }
        
        if (normalizedFilters.status) {
            query = query.eq('status', normalizedFilters.status)
        }
        
        if (normalizedFilters.agent_id && typeof normalizedFilters.agent_id === 'string') {
            query = query.eq('agent_id', normalizedFilters.agent_id)
        }
        
        if (normalizedFilters.property_type) {
            query = query.eq('property_type', normalizedFilters.property_type)
        }
        
        if (normalizedFilters.interest_level) {
            query = query.eq('interest_level', normalizedFilters.interest_level)
        }
        
        if (normalizedFilters.source) {
            query = query.eq('source', normalizedFilters.source)
        }
        
        if (normalizedFilters.search) {
            query = query.or(`full_name.ilike.%${normalizedFilters.search}%,email.ilike.%${normalizedFilters.search}%,phone.ilike.%${normalizedFilters.search}%`)
        }
        
        if (normalizedFilters.fromDate) {
            query = query.gte('created_at', normalizedFilters.fromDate)
        }
        
        if (normalizedFilters.toDate) {
            query = query.lte('created_at', normalizedFilters.toDate)
        }
        
        // Ordenar por fecha de actualización descendente
        query = query.order('updated_at', { ascending: false })
        
        // Ejecutar la consulta
        const { data, error } = await query
        
        if (error) {
            console.error('Error al obtener leads:', error)
            throw new Error('Error al obtener los leads')
        }
        
        return data as LeadData[]
    } catch (error) {
        console.error('Error en getLeads:', error)
        throw error
    }
}

export default getLeads