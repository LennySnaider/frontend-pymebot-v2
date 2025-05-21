import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        
        console.log('Received body:', JSON.stringify(body, null, 2))
        
        // Verificar autenticación usando NextAuth
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        const user = session.user
        console.log('Current user:', JSON.stringify(user, null, 2))
        
        // Crear cliente de Supabase para operaciones normales
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Verificar permisos de admin
        const { data: currentUser, error: userFetchError } = await supabase
            .from('users')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()
        
        console.log('Current user data:', JSON.stringify(currentUser, null, 2))
        console.log('User fetch error:', userFetchError)
        
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Sin permisos de administrador' },
                { status: 403 }
            )
        }
        
        // Verificar que el usuario tenga un tenant_id válido
        if (!currentUser.tenant_id) {
            return NextResponse.json(
                { error: 'No se puede crear agente sin tenant_id' },
                { status: 400 }
            )
        }
        
        // Crear usuario en auth.users usando el service role client
        const serviceSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
        
        // Primero verificar si el usuario ya existe en auth.users
        const { data: existingAuthUser } = await serviceSupabase.auth.admin.listUsers()
        const authUserExists = existingAuthUser?.users?.some(u => u.email === body.email)
        
        if (authUserExists) {
            return NextResponse.json(
                { error: 'El usuario con este email ya existe en auth.users' },
                { status: 400 }
            )
        }
        
        // También verificar en public.users
        const { data: existingUser } = await serviceSupabase
            .from('users')
            .select('id, email')
            .eq('email', body.email)
            .single()
        
        if (existingUser) {
            return NextResponse.json(
                { error: 'El usuario con este email ya existe' },
                { status: 400 }
            )
        }
        
        // Crear usuario en auth con metadata completa incluyendo tenant_id
        const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
            user_metadata: {
                full_name: body.fullName,
                role: 'agent',
                tenant_id: currentUser.tenant_id,
                phone: body.phone,
                active: true
            }
        })
        
        console.log('Auth creation result:', JSON.stringify(authData, null, 2))
        console.log('Auth creation error:', authError)
        
        if (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            )
        }
        
        // Actualizar el registro en public.users que se creó automáticamente
        // En lugar de insertar, vamos a hacer un update
        const userData = {
            full_name: body.fullName,
            role: 'agent',
            tenant_id: currentUser.tenant_id,
            phone: body.phone,
            active: true
        }
        
        console.log('Attempting to update user data:', JSON.stringify(userData, null, 2))
        
        const { error: userError } = await serviceSupabase
            .from('users')
            .update(userData)
            .eq('id', authData.user.id)
        
        if (userError) {
            console.error('Error updating user in public.users:', userError)
            console.error('Full error:', JSON.stringify(userError, null, 2))
            
            // Si falla, intentar eliminar el usuario de auth
            await serviceSupabase.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json(
                { error: userError.message },
                { status: 400 }
            )
        }
        
        // Actualizar metadata del usuario con información adicional del agente
        const agentMetadata = {
            bio: body.bio,
            specializations: body.specializations || ['general'],
            languages: body.languages || ['Español'],
            profile_image: body.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(body.fullName)}&size=200&background=random`,
            commission_rate: body.commissionRate || 5,
            license_number: body.licenseNumber,
            years_experience: body.yearsExperience || 0,
            is_active: true
        }
        
        const { error: metadataError } = await serviceSupabase
            .from('users')
            .update({
                metadata: agentMetadata,
                avatar_url: body.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(body.fullName)}&size=200&background=random`
            })
            .eq('id', authData.user.id)
        
        if (metadataError) {
            // Si falla, intentar limpieza
            await serviceSupabase.from('users').delete().eq('id', authData.user.id)
            await serviceSupabase.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json(
                { error: metadataError.message },
                { status: 400 }
            )
        }
        
        return NextResponse.json({
            success: true,
            data: {
                userId: authData.user.id,
                agentId: authData.user.id // Ahora el agentId es el mismo que el userId
            }
        })
        
    } catch (error: any) {
        console.error('Error creating agent:', error)
        console.error('Full error object:', JSON.stringify(error, null, 2))
        
        // Verificar si es un error de constraint de clave duplicada
        if (error.message?.includes('duplicate key') || error.code === '23505') {
            return NextResponse.json(
                { error: 'Ya existe un usuario con este email. Por favor, utilice otro email.' },
                { status: 400 }
            )
        }
        
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}