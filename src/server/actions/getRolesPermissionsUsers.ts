import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

interface User {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
    status: string | null
    created_at: string
    last_activity: string | null
}

interface QueryParams {
    pageIndex?: string | string[]
    pageSize?: string | string[]
    sortKey?: string | string[]
    order?: string | string[]
    query?: string | string[]
    role?: string | string[]
    status?: string | string[]
}

const getRolesPermissionsUsers = async (queryParams: QueryParams) => {
    try {
        // Obtener sesión del servidor
        const session = await auth()
        const userRole = session?.user?.role
        const tenantId = session?.user?.tenantId
        
        console.log('getRolesPermissionsUsers - session userRole:', userRole)
        console.log('getRolesPermissionsUsers - session tenantId:', tenantId)
        
        // Usar el tenant específico o un valor por defecto si es superadmin
        const effectiveTenantId = tenantId || 'afa60b0a-3046-4607-9c48-266af6e1d322'

        // Crear cliente de Supabase para el servidor
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const {
            pageIndex = '1',
            pageSize = '10',
            sortKey = 'created_at',
            order = 'desc',
            query,
            role,
            status
        } = queryParams

        const currentPageIndex = parseInt(typeof pageIndex === 'string' ? pageIndex : pageIndex[0])
        const currentPageSize = parseInt(typeof pageSize === 'string' ? pageSize : pageSize[0])
        const offset = (currentPageIndex - 1) * currentPageSize

        // Construir la consulta base
        let queryBuilder = supabase
            .from('users')
            .select('*', { count: 'exact' })

        // Si es superadmin y tiene tenant_id, mostrar usuarios de ese tenant
        // Si no es superadmin, mostrar solo usuarios del tenant y excluir super_admin
        if (userRole === 'super_admin' && tenantId) {
            queryBuilder = queryBuilder.eq('tenant_id', tenantId)
        } else if (userRole !== 'super_admin') {
            queryBuilder = queryBuilder
                .eq('tenant_id', effectiveTenantId)
                .neq('role', 'super_admin')
        }
        // Si es superadmin sin tenant_id, mostrar todos los usuarios

        // Aplicar filtros si existen
        if (role && typeof role === 'string') {
            queryBuilder = queryBuilder.eq('role', role)
        }

        if (status && typeof status === 'string') {
            queryBuilder = queryBuilder.eq('status', status)
        }

        if (query && typeof query === 'string') {
            // Buscar en email y full_name
            queryBuilder = queryBuilder.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        }

        // Aplicar ordenamiento
        if (sortKey && typeof sortKey === 'string') {
            const isDescending = order === 'desc'
            queryBuilder = queryBuilder.order(sortKey, { ascending: !isDescending })
        }

        // Aplicar paginación
        queryBuilder = queryBuilder.range(offset, offset + currentPageSize - 1)

        // Ejecutar la consulta
        const { data: users, error, count } = await queryBuilder

        if (error) {
            console.error('Error fetching users - details:', JSON.stringify(error, null, 2))
            return {
                list: [],
                total: 0
            }
        }

        console.log('Users found:', (users || []).length)
        console.log('Total count:', count)

        return {
            list: users || [],
            total: count || 0
        }
    } catch (error) {
        console.error('Error in getRolesPermissionsUsers - full error:', error)
        return {
            list: [],
            total: 0
        }
    }
}

export default getRolesPermissionsUsers