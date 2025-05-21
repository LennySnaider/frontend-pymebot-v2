import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

export async function GET(
    _: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const id = (await params).id

    console.log('contact id:', id)

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
                phone,
                title,
                address,
                city,
                postcode,
                country,
                birthday,
                facebook,
                twitter,
                pinterest,
                linkedin
            `)
            .eq('id', id)
            .single()

        // Aplicar filtro de tenant según el rol del usuario
        if (userRole === 'super_admin' && tenantId) {
            queryBuilder = queryBuilder.eq('tenant_id', tenantId)
        } else if (userRole !== 'super_admin') {
            queryBuilder = queryBuilder
                .eq('tenant_id', effectiveTenantId)
                .neq('role', 'super_admin')
        }

        // Ejecutar la consulta
        const { data: user, error } = await queryBuilder

        if (error || !user) {
            console.error('Error fetching contact:', error)
            return NextResponse.json({ error: error?.message || 'User not found' }, { status: 404 })
        }

        // Transformar los datos al formato esperado
        const userDetails = {
            id: user.id,
            name: user.full_name || user.email,
            email: user.email,
            img: user.avatar_url,
            title: user.title,
            role: user.role || 'user',
            status: user.status || 'active',
            lastOnline: user.last_activity ? new Date(user.last_activity).getTime() : undefined,
            personalInfo: {
                address: user.address,
                postcode: user.postcode,
                city: user.city,
                country: user.country,
                birthday: user.birthday,
                phoneNumber: user.phone,
                facebook: user.facebook,
                twitter: user.twitter,
                pinterest: user.pinterest,
                linkedIn: user.linkedin,
            }
        }

        return NextResponse.json(userDetails)
    } catch (error) {
        console.error('Error in contact API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
