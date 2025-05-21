/**
 * getRolesPermissionsUsersReal.ts
 * Versión actualizada que consulta usuarios reales de la base de datos
 * en lugar de usar datos mock
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from './tenant/getTenantFromSession'
import paginate from '@/utils/paginate'
import wildCardSearch from '@/utils/wildCardSearch'
import sortBy from '@/utils/sortBy'

export async function getRolesPermissionsUsersReal(queryParams: {
    [key: string]: string | string[] | undefined
}) {
    try {
        const supabase = SupabaseClient.getInstance()
        const tenant_id = await getTenantFromSession()
        
        const {
            pageIndex = '1',
            pageSize = '10',
            sortKey = '',
            order,
            query,
            role,
            status
        } = queryParams

        console.log('Obteniendo usuarios reales para tenant:', tenant_id)

        // Query base para obtener usuarios del tenant actual
        let queryBuilder = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenant_id)

        // Aplicar filtro por rol si existe
        if (role && typeof role === 'string') {
            queryBuilder = queryBuilder.eq('role', role)
        }

        // Aplicar filtro por status si existe
        if (status && typeof status === 'string') {
            queryBuilder = queryBuilder.eq('status', status)
        }

        // Aplicar ordenamiento
        if (sortKey) {
            queryBuilder = queryBuilder.order(sortKey as string, { 
                ascending: order !== 'desc' 
            })
        } else {
            // Ordenamiento por defecto (más recientes primero)
            queryBuilder = queryBuilder.order('created_at', { ascending: false })
        }

        // Ejecutar query
        const { data: users, error, count } = await queryBuilder

        if (error) {
            console.error('Error al obtener usuarios:', error)
            throw new Error(`Error al obtener usuarios: ${error.message}`)
        }

        let processedData = users || []
        let total = count || 0

        // Aplicar búsqueda local si es necesario
        if (query && typeof query === 'string') {
            processedData = wildCardSearch(processedData, query)
            total = processedData.length
        }

        // Aplicar paginación
        const paginatedData = paginate(
            processedData,
            parseInt(pageSize as string),
            parseInt(pageIndex as string),
        )

        // Formatear datos para compatibilidad con el frontend
        const formattedData = paginatedData.map(user => ({
            id: user.id,
            name: user.full_name || user.email.split('@')[0], // Usar email si no hay nombre
            email: user.email,
            img: user.avatar_url || user.profile_image || '', // Avatar del usuario
            role: user.role,
            lastOnline: user.last_activity ? new Date(user.last_activity).getTime() : Date.now(),
            status: user.status || 'active'
        }))

        return {
            list: formattedData,
            total: total,
        }
    } catch (error) {
        console.error('Error en getRolesPermissionsUsersReal:', error)
        throw error
    }
}

export default getRolesPermissionsUsersReal