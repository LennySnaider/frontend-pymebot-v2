import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        // Service role para verificar políticas
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
        
        // Verificar si RLS está habilitado
        const { data: rlsStatus } = await serviceSupabase
            .from('information_schema.tables')
            .select('table_name, is_insertable_into')
            .eq('table_schema', 'public')
            .eq('table_name', 'leads')
            .single()
            
        // Obtener políticas RLS para leads
        const { data: policies } = await serviceSupabase
            .rpc('get_policies_for_table', { table_name: 'leads' })
            .select('*')
            
        return NextResponse.json({
            rls_enabled: rlsStatus,
            policies: policies || 'No se pudieron obtener políticas',
            fix_suggestion: 'Las políticas RLS están bloqueando el acceso. Necesitas una política que permita SELECT para usuarios autenticados.'
        })
        
    } catch (error: any) {
        // Si falla, intentar otra consulta
        try {
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
            
            // Consulta alternativa
            const { data: authSettings } = await serviceSupabase
                .from('auth.users')
                .select('id')
                .eq('id', session.user.id)
                .single()
                
            return NextResponse.json({
                message: 'RLS parece estar bloqueando acceso a leads',
                user_can_auth: !!authSettings,
                suggestion: 'Crear política RLS para permitir SELECT en leads',
                error_detail: error.message
            })
        } catch (altError: any) {
            return NextResponse.json({
                error: error.message || 'Error verificando RLS',
                alt_error: altError.message
            }, { status: 500 })
        }
    }
}