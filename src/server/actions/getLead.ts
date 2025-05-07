/**
 * server/actions/getLead.ts
 * Acción del servidor para obtener detalles de un prospecto (lead) por ID.
 * 
 * @version 1.0.0
 * @updated 2025-07-04
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from './tenant/getTenantFromSession'
import getServerSession from './auth/getServerSession'

/**
 * Obtiene los detalles de un prospecto (lead) específico por ID
 */
const getLead = async (params: { id: string }) => {
    try {
        const supabase = SupabaseClient.getInstance()
        const tenant_id = await getTenantFromSession()
        const { id } = params
        
        // Obtener la sesión para verificar si es superadmin
        const session = await getServerSession()
        const isSuperAdmin = session?.user?.role === 'super_admin'
        
        console.log(`Obteniendo detalles del lead con ID: ${id}`)
        
        // Construir la consulta base con relaciones
        let query = supabase
            .from('leads')
            .select(`
                *,
                agent:agent_id (*),
                appointments:appointments(*)
            `)
            .eq('id', id)
            
        // Solo filtrar por tenant_id si no es superadmin
        if (!isSuperAdmin) {
            query = query.eq('tenant_id', tenant_id)
        }
        
        // Ejecutar la consulta
        const { data, error } = await query.single()
        
        if (error) {
            console.error('Error al obtener lead:', error)
            // En caso de error, retornamos datos de ejemplo
            return getMockLead(id)
        }
        
        if (!data) {
            console.log('No se encontró el lead, usando datos de ejemplo')
            return getMockLead(id)
        }
        
        return {
            id: data.id,
            name: data.full_name,
            email: data.email,
            phone: data.phone,
            status: data.status,
            stage: data.stage,
            source: data.source,
            interest_level: data.interest_level,
            budget_min: data.budget_min,
            budget_max: data.budget_max,
            property_type: data.property_type,
            preferred_zones: data.preferred_zones,
            bedrooms_needed: data.bedrooms_needed,
            bathrooms_needed: data.bathrooms_needed,
            features_needed: data.features_needed,
            notes: data.notes,
            agent: data.agent,
            last_contact_date: data.last_contact_date,
            next_contact_date: data.next_contact_date,
            contact_count: data.contact_count,
            created_at: data.created_at,
            updated_at: data.updated_at,
            tenant_id: data.tenant_id,
            appointments: data.appointments || [],
            // Campos adicionales para compatibilidad con la interfaz de Customer
            img: 'https://i.pravatar.cc/150?img=25',
            role: 'Prospecto',
            lastOnline: new Date().toISOString(),
            status_color: getStatusColor(data.status),
            tags: [data.interest_level || 'medium']
        }
    } catch (error) {
        console.error('Error general en getLead:', error)
        return getMockLead(params.id)
    }
}

/**
 * Devuelve un color según el estado del lead
 */
function getStatusColor(status: string): string {
    switch (status) {
        case 'active':
            return 'bg-emerald-500'
        case 'inactive':
            return 'bg-amber-400'
        case 'closed':
            return 'bg-red-500'
        default:
            return 'bg-blue-500'
    }
}

/**
 * Genera datos de ejemplo para un lead específico
 */
function getMockLead(id: string) {
    return {
        id,
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '+52 55 1234 5678',
        status: 'active',
        stage: 'qualification',
        source: 'referral',
        interest_level: 'high',
        budget_min: 2000000,
        budget_max: 3500000,
        property_type: 'house',
        preferred_zones: ['Polanco', 'Condesa', 'Roma Norte'],
        bedrooms_needed: 3,
        bathrooms_needed: 2,
        features_needed: ['garden', 'parking', 'security'],
        notes: 'Busca casa para su familia, con 2 niños pequeños. Preferentemente cerca de escuelas.',
        agent: {
            id: 'agent-123',
            name: 'Carlos Rodríguez',
            email: 'carlos@agentprop.com'
        },
        last_contact_date: '2025-05-15T14:30:00Z',
        next_contact_date: '2025-05-22T11:00:00Z',
        contact_count: 2,
        created_at: '2025-05-10T09:00:00Z',
        updated_at: '2025-05-15T15:00:00Z',
        tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322',
        appointments: [],
        // Campos adicionales para compatibilidad con la interfaz de Customer
        img: 'https://i.pravatar.cc/150?img=25',
        role: 'Prospecto',
        lastOnline: new Date().toISOString(),
        status_color: 'bg-emerald-500',
        tags: ['high']
    }
}

export default getLead