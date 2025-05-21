import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

export async function GET() {
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
            `)

        // Aplicar filtro de tenant según el rol del usuario
        if (userRole === 'super_admin' && tenantId) {
            queryBuilder = queryBuilder.eq('tenant_id', tenantId)
        } else if (userRole !== 'super_admin') {
            queryBuilder = queryBuilder
                .eq('tenant_id', effectiveTenantId)
                .neq('role', 'super_admin')
        }

        // Ejecutar la consulta
        const { data: users, error } = await queryBuilder

        if (error) {
            console.error('Error fetching contacts:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Transformar los datos al formato esperado
        const contacts = (users || []).map(user => ({
            id: user.id,
            name: user.full_name || user.email,
            email: user.email,
            img: user.avatar_url
        }))

        return NextResponse.json(contacts)
    } catch (error) {
        console.error('Error in contacts API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
