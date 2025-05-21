import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

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
        
        // Verificar que el usuario esté actualizando su propio perfil
        if (session.user.id !== String(params?.id || '')) {
            return NextResponse.json(
                { error: 'No autorizado para actualizar este perfil' },
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
        
        // Verificar que el usuario es un agente
        const { data: userRole } = await serviceSupabase
            .from('users')
            .select('role')
            .eq('id', String(params?.id || ''))
            .single()
        
        if (!userRole || userRole.role !== 'agent') {
            return NextResponse.json(
                { error: 'Solo los agentes pueden actualizar su perfil' },
                { status: 403 }
            )
        }
        
        // Actualizar datos del usuario
        const { error: userError } = await serviceSupabase
            .from('users')
            .update({
                full_name: body.fullName,
                phone: body.phone,
                updated_at: new Date().toISOString()
            })
            .eq('id', String(params?.id || ''))
        
        if (userError) {
            return NextResponse.json(
                { error: userError.message },
                { status: 400 }
            )
        }
        
        // Actualizar datos del agente
        const { error: agentError } = await serviceSupabase
            .from('agents')
            .update({
                name: body.fullName,
                phone: body.phone,
                bio: body.bio,
                specializations: body.specializations,
                languages: body.languages,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', String(params?.id || ''))
        
        if (agentError) {
            return NextResponse.json(
                { error: agentError.message },
                { status: 400 }
            )
        }
        
        return NextResponse.json({
            success: true
        })
        
    } catch (error: any) {
        console.error('Error updating agent profile:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}