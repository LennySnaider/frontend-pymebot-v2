import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verificar autenticación
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Obtener datos del usuario agente
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', String(params?.id || ''))
            .eq('role', 'agent')
            .single()
        
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Agente no encontrado' },
                { status: 404 }
            )
        }
        
        return NextResponse.json({
            agent: user,
            user: user
        })
        
    } catch (error: any) {
        console.error('Error fetching agent:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        
        // Verificar autenticación
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        const user = session.user
        
        // Crear cliente de Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Verificar permisos
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
        
        // Crear service client
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
        
        // Preparar metadata actualizada
        const updatedMetadata = {
            bio: body.bio,
            specializations: body.specializations || ['general'],
            languages: body.languages || ['Español'],
            profile_image: body.profileImage,
            commission_rate: body.commissionRate,
            license_number: body.licenseNumber,
            years_experience: body.yearsExperience
        }
        
        // Actualizar datos del usuario
        const { error: userError } = await serviceSupabase
            .from('users')
            .update({
                email: body.email,
                full_name: body.fullName,
                phone: body.phone,
                metadata: updatedMetadata,
                avatar_url: body.profileImage,
                updated_at: new Date().toISOString()
            })
            .eq('id', String(params?.id || ''))
        
        if (userError) {
            return NextResponse.json(
                { error: userError.message },
                { status: 400 }
            )
        }
        
        // Actualizar email en auth.users si cambió
        const { data: existingUser } = await serviceSupabase
            .from('users')
            .select('email')
            .eq('id', String(params?.id || ''))
            .single()
        
        if (existingUser && existingUser.email !== body.email) {
            const { error: authError } = await serviceSupabase.auth.admin.updateUserById(
                String(params?.id || ''),
                { email: body.email }
            )
            
            if (authError) {
                return NextResponse.json(
                    { error: authError.message },
                    { status: 400 }
                )
            }
        }
        
        return NextResponse.json({
            success: true
        })
        
    } catch (error: any) {
        console.error('Error updating agent:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verificar autenticación
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        const user = session.user
        
        // Crear cliente de Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Verificar permisos
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
        
        // Crear service client
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
        
        // Eliminar leads asociados al agente (o establecer agent_id = null)
        const { error: leadsError } = await serviceSupabase
            .from('leads')
            .update({ agent_id: null })
            .eq('agent_id', String(params?.id || ''))
        
        if (leadsError) {
            return NextResponse.json(
                { error: leadsError.message },
                { status: 400 }
            )
        }
        
        // Eliminar de la tabla users
        const { error: userError } = await serviceSupabase
            .from('users')
            .delete()
            .eq('id', String(params?.id || ''))
        
        if (userError) {
            return NextResponse.json(
                { error: userError.message },
                { status: 400 }
            )
        }
        
        // Finalmente eliminar de auth.users
        const { error: authError } = await serviceSupabase.auth.admin.deleteUser(String(params?.id || ''))
        
        if (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            )
        }
        
        return NextResponse.json({
            success: true
        })
        
    } catch (error: any) {
        console.error('Error deleting agent:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}