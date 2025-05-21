import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'
import wildCardSearch from '@/utils/wildCardSearch'
import sortBy, { Primer } from '@/utils/sortBy'
import paginate from '@/utils/paginate'

interface Customer {
    id: string
    name: string
    firstName?: string
    lastName?: string
    email: string
    img?: string | null
    role: string | null
    lastOnline?: number
    status: string | null
    title?: string
    personalInfo?: {
        location?: string
        address?: string
        postcode?: string
        city?: string
        country?: string
        dialCode?: string
        birthday?: string
        phoneNumber?: string
        facebook?: string
        twitter?: string
        pinterest?: string
        linkedIn?: string
    }
    totalSpending?: number
    created_at?: string
    updated_at?: string
}

const getCustomers = async (_queryParams: {
    [key: string]: string | string[] | undefined
}) => {
    try {
        // Obtener sesión del servidor
        const session = await auth()
        const userRole = session?.user?.role
        const tenantId = session?.user?.tenantId
        
        // Usar el tenant específico o un valor por defecto si es superadmin
        const effectiveTenantId = tenantId || 'afa60b0a-3046-4607-9c48-266af6e1d322'

        // Crear cliente de Supabase para el servidor
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const queryParams = _queryParams

        const {
            pageIndex = '1',
            pageSize = '10',
            sortKey = '',
            order,
            query,
        } = queryParams

        // Construir la consulta base
        let queryBuilder = supabase
            .from('users')
            .select(`
                id,
                email,
                full_name,
                avatar_url,
                role,
                status,
                last_activity,
                created_at,
                updated_at,
                tenant_id,
                phone
            `, { count: 'exact' })

        // Aplicar filtro de tenant según el rol del usuario
        if (userRole === 'super_admin' && tenantId) {
            queryBuilder = queryBuilder.eq('tenant_id', tenantId)
        } else if (userRole !== 'super_admin') {
            queryBuilder = queryBuilder
                .eq('tenant_id', effectiveTenantId)
                .neq('role', 'super_admin')
        }

        // Aplicar búsqueda si existe
        if (query && typeof query === 'string') {
            queryBuilder = queryBuilder.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        }

        // Ejecutar la consulta para obtener todos los resultados
        const { data: users, error, count } = await queryBuilder

        if (error) {
            console.error('Error fetching customers:', error)
            return {
                list: [],
                total: 0
            }
        }

        // Transformar los datos al formato esperado
        let customers: Customer[] = (users || []).map(user => {
            // Parsear el nombre completo en firstName y lastName
            const nameParts = (user.full_name || '').split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            return {
                id: user.id,
                name: user.full_name || user.email,
                firstName,
                lastName,
                email: user.email,
                img: user.avatar_url,
                role: user.role || 'user',
                status: user.status || 'active',
                personalInfo: {
                    phoneNumber: user.phone,
                },
                created_at: user.created_at,
                updated_at: user.updated_at,
                // Estos campos no están en la base de datos, pero los incluimos con valores por defecto
                // para mantener compatibilidad con el formato esperado
                totalSpending: 0,
                lastOnline: user.last_activity ? new Date(user.last_activity).getTime() : undefined
            }
        })

        // Aplicar ordenamiento si se especifica
        if (sortKey) {
            if (sortKey === 'totalSpending') {
                customers.sort(
                    sortBy(sortKey as string, order === 'desc', parseInt as Primer),
                )
            } else {
                customers.sort(
                    sortBy((sortKey || '') as string, order === 'desc', (a) =>
                        (a as string).toUpperCase(),
                    ),
                )
            }
        }

        // Si no hay sortKey, mantener el orden por defecto (created_at desc)
        if (!sortKey) {
            customers.sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime()
                const dateB = new Date(b.created_at || 0).getTime()
                return dateB - dateA // desc order
            })
        }

        // Aplicar paginación
        const paginatedData = paginate(
            customers,
            parseInt(pageSize as string),
            parseInt(pageIndex as string),
        )

        return {
            list: paginatedData,
            total: count || 0,
        }
    } catch (error) {
        console.error('Error in getCustomers:', error)
        return {
            list: [],
            total: 0
        }
    }
}

export default getCustomers