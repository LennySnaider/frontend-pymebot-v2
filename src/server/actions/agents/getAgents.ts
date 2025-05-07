/**
 * server/actions/agents/getAgents.ts
 * Acción del servidor para obtener todos los agentes inmobiliarios disponibles.
 * 
 * @version 1.1.0
 * @updated 2025-04-14
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export interface AgentData {
    id: string
    name: string
    email: string
    phone?: string
    profile_image?: string
    specializations?: string[]
    rating?: number
    is_active: boolean
    availability?: Record<string, any>
    tenant_id: string
    created_at?: string
    updated_at?: string
}

export interface AgentFilters {
    id?: string | object
    is_active?: boolean | string
    specialization?: string
    rating_min?: number
}

export async function getAgents(filterOrActive: boolean | AgentFilters = true) {
    try {
        console.log('getAgents llamado con:', filterOrActive)
        
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            throw new Error('No se pudo obtener el tenant_id')
        }
        
        // Inicializar filtros
        let filters: AgentFilters = {}
        
        // Determinar si recibimos un booleano simple o un objeto de filtros
        if (typeof filterOrActive === 'boolean') {
            filters = { is_active: filterOrActive }
        } else if (typeof filterOrActive === 'object' && filterOrActive !== null) {
            filters = filterOrActive
        }
        
        // Normalizar filtros potencialmente problemáticos
        if (filters.id && typeof filters.id === 'object') {
            if ('id' in filters.id && typeof filters.id.id === 'string') {
                filters.id = filters.id.id
            } else {
                delete filters.id
            }
        }
        
        // Convertir is_active a booleano si viene como string
        if (filters.is_active !== undefined && typeof filters.is_active === 'string') {
            filters.is_active = filters.is_active.toLowerCase() === 'true'
        }
        
        // Construir la consulta base
        let query = supabase
            .from('agents')
            .select('*')
            .eq('tenant_id', tenant_id)
        
        // Aplicar filtros normalizados
        if (filters.id && typeof filters.id === 'string') {
            query = query.eq('id', filters.id)
        }
        
        if (filters.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active)
        }
        
        if (filters.specialization) {
            // Esto puede necesitar ajustes dependiendo de cómo estén almacenadas las especializaciones (array o string)
            query = query.contains('specializations', [filters.specialization])
        }
        
        if (filters.rating_min !== undefined) {
            query = query.gte('rating', filters.rating_min)
        }
        
        // Registrar información para depuración
        console.log('Ejecutando consulta de agentes con filtros:', filters)
        
        // Ejecutar la consulta
        const { data, error } = await query
        
        if (error) {
            console.error('Error al obtener agentes:', error)
            throw new Error('Error al obtener los agentes')
        }
        
        console.log(`Se obtuvieron ${data?.length || 0} agentes`)
        return data as AgentData[]
    } catch (error) {
        console.error('Error en getAgents:', error)
        throw error
    }
}

export default getAgents