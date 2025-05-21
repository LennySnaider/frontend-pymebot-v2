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
        throw new Error(`Error al obtener lead con ID ${params.id}`)
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

// Función getMockLead eliminada - no usar datos mock

export default getLead