import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

interface Role {
    id: string
    name: string
    description: string | null
    tenant_id: string | null
    created_at: string
    updated_at: string
}

interface RoleWithUsers extends Role {
    users: Array<{
        id: string
        email: string
        full_name: string | null
        avatar_url: string | null
        role: string | null
    }>
}


const getRolesPermissionsRoles = async (): Promise<RoleWithUsers[]> => {
    try {
        // Obtener sesión del servidor
        const session = await auth()
        const userRole = session?.user?.role
        const tenantId = session?.user?.tenantId
        
        console.log('getRolesPermissionsRoles - session userRole:', userRole)
        console.log('getRolesPermissionsRoles - session tenantId:', tenantId)
        
        // Usar el tenant específico o un valor por defecto si es superadmin
        const effectiveTenantId = tenantId || 'afa60b0a-3046-4607-9c48-266af6e1d322'
        
        // Crear cliente de Supabase para el servidor
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Obtener roles reales de la base de datos
        let rolesQuery = supabase
            .from('roles')
            .select('*')
            .order('name', { ascending: true })

        // Si NO es super_admin, excluir el rol super_admin
        console.log('getRolesPermissionsRoles - Filtering logic - userRole:', userRole)
        console.log('getRolesPermissionsRoles - Should exclude super_admin?', userRole !== 'super_admin')
        
        if (userRole !== 'super_admin') {
            rolesQuery = rolesQuery.neq('name', 'super_admin')
        }

        const { data: roles, error: rolesError } = await rolesQuery

        if (rolesError) {
            console.error('Error fetching roles:', rolesError)
            return []
        }
        
        console.log('getRolesPermissionsRoles - Found roles:', roles?.map(r => ({ id: r.id, name: r.name })))

        // Obtener usuarios reales de la tabla users
        let usersQuery = supabase
            .from('users')
            .select('id, email, full_name, avatar_url, role')

        // Si es superadmin y tiene tenant_id, mostrar usuarios de ese tenant
        if (userRole === 'super_admin' && tenantId) {
            usersQuery = usersQuery.eq('tenant_id', tenantId)
        } else if (userRole !== 'super_admin') {
            // Para otros roles, mostrar solo usuarios del tenant y excluir super_admin
            usersQuery = usersQuery
                .eq('tenant_id', effectiveTenantId)
                .neq('role', 'super_admin')
        }

        const { data: users, error: usersError } = await usersQuery

        if (usersError) {
            console.error('Error fetching users - details:', JSON.stringify(usersError, null, 2))
            // Continuar con array vacío si hay error
            const rolesWithUsers: RoleWithUsers[] = (roles || []).map(role => ({
                ...role,
                users: []
            }))
            return rolesWithUsers
        }

        console.log('Roles found:', roles?.length || 0)
        console.log('Users found:', (users || []).length)

        // Mapear roles con sus usuarios correspondientes
        const rolesWithUsers: RoleWithUsers[] = (roles || []).map(role => ({
            ...role,
            users: (users || []).filter(user => user.role === role.name)
        }))

        return rolesWithUsers
    } catch (error) {
        console.error('Error in getRolesPermissionsRoles - full error:', error)
        return []
    }
}

export default getRolesPermissionsRoles