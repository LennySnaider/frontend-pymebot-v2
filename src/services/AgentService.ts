/**
 * Servicio para gestión de agentes
 */

import ApiService from './ApiService'
import supabase from '@/services/supabase/SupabaseClient'
import type { AgentAvailabilityUpdate } from '@/server/actions/agents/updateAgentAvailability'

export interface Agent {
    id: string
    full_name: string
    email: string
    phone?: string
    avatar_url?: string
    role: string
    tenant_id: string
    created_at: string
    updated_at: string
}


/**
 * Obtiene todos los agentes disponibles para el tenant actual
 */
export async function getAgents(): Promise<Agent[]> {
    try {
        console.log('🔍 Iniciando getAgents...')
        
        // Primero verificar si la tabla users existe con una consulta simple
        console.log('🔍 Probando conexión básica a tabla users...')
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('id, email')
            .limit(1)

        if (testError) {
            console.error('❌ Error al conectar con tabla users:', testError)
            console.error('❌ Detalles del error:', JSON.stringify(testError, null, 2))
            return []
        }

        console.log('✅ Conexión a tabla users exitosa')
        
        // Descubrir la estructura real de la tabla users
        console.log('🔍 Descubriendo estructura de tabla users...')
        const { data: sampleData, error: sampleError } = await supabase
            .from('users')
            .select('*')
            .limit(1)
            
        if (sampleData && sampleData[0]) {
            console.log('📋 Estructura de tabla users:', Object.keys(sampleData[0]))
        }
        
        // Intentar obtener usuarios con rol 'agent' primero
        console.log('🔍 Buscando usuarios con rol "agent"...')
        const { data: agentData, error: agentError } = await supabase
            .from('users')
            .select('id, full_name, email, phone, avatar_url, role, tenant_id, created_at, updated_at')
            .eq('role', 'agent')
            .eq('active', true)
            .order('full_name', { ascending: true })

        if (agentError) {
            console.error('❌ Error al buscar agentes:', agentError)
        } else if (agentData && agentData.length > 0) {
            console.log(`✅ Agentes encontrados: ${agentData.length}`)
            return agentData
        } else {
            console.log('⚠️ No se encontraron usuarios con rol "agent"')
        }

        // Si no hay agentes específicos, buscar usuarios que puedan actuar como agentes
        console.log('🔍 Buscando usuarios activos...')
        const { data: allUsers, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email, phone, avatar_url, role, tenant_id, created_at, updated_at')
            .eq('active', true)
            .order('full_name', { ascending: true })
            .limit(20)

        if (usersError) {
            console.error('❌ Error al obtener usuarios:', usersError)
            console.error('❌ Detalles del error:', JSON.stringify(usersError, null, 2))
            return []
        }

        console.log(`✅ Usuarios activos encontrados: ${allUsers?.length || 0}`)
        if (allUsers && allUsers.length > 0) {
            console.log('📋 Primeros usuarios:', allUsers.slice(0, 3))
        }
        
        return allUsers || []
    } catch (error) {
        console.error('❌ Error en getAgents:', error)
        console.error('❌ Stack trace:', error)
        return []
    }
}

/**
 * Obtiene un agente específico por ID
 */
// Función helper para validar UUID
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

export async function getAgentById(agentId: string): Promise<Agent | null> {
    try {
        console.log('🔍 Obteniendo agente por ID:', agentId)
        
        if (!agentId) {
            console.log('⚠️ AgentId está vacío')
            return null
        }
        
        // Validar que el agentId sea un UUID válido
        if (!isValidUUID(agentId)) {
            console.log('⚠️ AgentId no es un UUID válido:', agentId)
            return null
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone, avatar_url, role, tenant_id, created_at, updated_at')
            .eq('id', agentId)
            .eq('active', true)
            .single()

        if (error) {
            console.error('❌ Error al obtener agente:', error)
            console.error('❌ Detalles del error:', JSON.stringify(error, null, 2))
            console.error('❌ AgentId buscado:', agentId)
            return null
        }

        if (!data) {
            console.log('⚠️ No se encontró agente con ID:', agentId)
            return null
        }

        console.log('✅ Agente encontrado:', { id: data.id, full_name: data.full_name, role: data.role })
        return data
    } catch (error) {
        console.error('❌ Error en getAgentById:', error)
        console.error('❌ Stack trace:', error)
        return null
    }
}

export async function updateAgentAvailability(agentId: string, availability: AgentAvailabilityUpdate) {
    const response = await ApiService.fetchDataWithAxios({
        url: `/agents/${agentId}/availability`,
        method: 'PUT',
        data: { availability }
    })
    
    return response
}

export async function getAgentAvailability(agentId: string) {
    const response = await ApiService.fetchDataWithAxios({
        url: `/agents/${agentId}/availability`,
        method: 'GET'
    })
    
    return response
}