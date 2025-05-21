import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

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
    orderHistory?: Array<{
        id: string
        item: string
        status: string
        amount: number
        date: number
    }>
    paymentMethod?: Array<{
        cardHolderName: string
        cardType: string
        expMonth: string
        expYear: string
        last4Number: string
        primary?: boolean
    }>
    subscription?: Array<{
        plan: string
        status: string
        billing: string
        nextPaymentdate: number
        amount: number
    }>
    totalSpending?: number
}

const getCustomer = async (_queryParams: {
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
        const { id } = queryParams

        if (!id) {
            return {}
        }

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
            console.error('Error fetching customer:', error)
            return {}
        }

        // Parsear el nombre completo en firstName y lastName
        const nameParts = (user.full_name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Transformar los datos al formato esperado
        const customer: Customer = {
            id: user.id,
            name: user.full_name || user.email,
            firstName,
            lastName,
            email: user.email,
            img: user.avatar_url,
            role: user.role || 'user',
            status: user.status || 'active',
            title: user.title,
            personalInfo: {
                location: user.city ? `${user.city}, ${user.country}` : undefined,
                address: user.address,
                postcode: user.postcode,
                city: user.city,
                country: user.country,
                dialCode: user.country ? '+1' : undefined, // Esto podría ser mejorado con una tabla de códigos de país
                birthday: user.birthday,
                phoneNumber: user.phone,
                facebook: user.facebook,
                twitter: user.twitter,
                pinterest: user.pinterest,
                linkedIn: user.linkedin,
            },
            lastOnline: user.last_activity ? new Date(user.last_activity).getTime() : undefined,
            // Los siguientes campos no están en la base de datos actual pero los incluimos
            // para mantener compatibilidad con el formato esperado
            totalSpending: 0,
            orderHistory: [],
            paymentMethod: [],
            subscription: []
        }

        return customer
    } catch (error) {
        console.error('Error in getCustomer:', error)
        return {}
    }
}

export default getCustomer