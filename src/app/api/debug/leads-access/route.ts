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
        
        const results: any = {
            user: {
                id: session.user.id,
                role: session.user.role,
                tenant_id: session.user.tenant_id
            },
            tests: []
        }
        
        // 1. Test con anon key
        const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: anonLeads, error: anonError } = await anonSupabase
            .from('leads')
            .select('id, tenant_id')
            .limit(3)
            
        results.tests.push({
            test: 'Anon key - sin filtro',
            data: anonLeads,
            error: anonError
        })
        
        // 2. Test con service role
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
        
        const { data: serviceLeads, error: serviceError } = await serviceSupabase
            .from('leads')
            .select('id, tenant_id, full_name')
            .eq('tenant_id', session.user.tenant_id)
            .limit(5)
            
        results.tests.push({
            test: 'Service role - con filtro tenant',
            data: serviceLeads,
            error: serviceError,
            count: serviceLeads?.length || 0
        })
        
        // 3. Test de count
        const { count, error: countError } = await serviceSupabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', session.user.tenant_id)
            
        results.tests.push({
            test: 'Count de leads por tenant',
            count: count,
            error: countError
        })
        
        // 4. Verificar estructura de la tabla
        const { data: tableInfo, error: tableError } = await serviceSupabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'leads')
            .eq('table_schema', 'public')
            
        results.tests.push({
            test: 'Estructura de tabla leads',
            columns: tableInfo?.map(col => col.column_name),
            error: tableError
        })
        
        return NextResponse.json(results)
        
    } catch (error: any) {
        console.error('Error in debug endpoint:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno' },
            { status: 500 }
        )
    }
}