import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        
        // Verificar autenticación usando NextAuth
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        const user = session.user
        
        // Crear cliente de Supabase para operaciones normales
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
        
        // Verificar permisos de admin
        const { data: currentUser } = await supabase
            .from('users')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()
        
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
            return NextResponse.json(
                { error: 'Sin permisos de administrador' },
                { status: 403 }
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
        
        // Crear usuario
        const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
            user_metadata: {
                full_name: body.fullName,
                role: 'agent',
                tenant_id: currentUser.tenant_id
            }
        })
        
        if (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            )
        }
        
        // Crear registro en public.users
        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: body.email,
                full_name: body.fullName,
                role: 'agent',
                tenant_id: currentUser.tenant_id,
                phone: body.phone,
                active: true
            })
        
        if (userError) {
            // Si falla, intentar eliminar el usuario de auth
            await serviceSupabase.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json(
                { error: userError.message },
                { status: 400 }
            )
        }
        
        // Crear registro en agents
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .insert({
                user_id: authData.user.id,
                tenant_id: currentUser.tenant_id,
                name: body.fullName,
                email: body.email,
                phone: body.phone,
                bio: body.bio,
                specializations: body.specializations,
                languages: body.languages,
                is_active: true
            })
            .select()
            .single()
        
        if (agentError) {
            // Si falla, intentar limpieza
            await supabase.from('users').delete().eq('id', authData.user.id)
            await serviceSupabase.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json(
                { error: agentError.message },
                { status: 400 }
            )
        }
        
        return NextResponse.json({
            success: true,
            data: {
                userId: authData.user.id,
                agentId: agent.id
            }
        })
        
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}