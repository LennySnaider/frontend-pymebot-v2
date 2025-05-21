import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import getTenantFromSession from '@/server/actions/tenant/getTenantFromSession'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        // Obtener tenant_id
        const tenantId = await getTenantFromSession()
        
        const results: any = {
            user: {
                id: session.user.id,
                role: session.user.role,
                tenant_id: session.user.tenant_id
            },
            tenant_from_session: tenantId,
            tests: []
        }
        
        // Test 1: Service role - todos los leads
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
        
        // Sin filtro - primeros 5 leads
        const { data: allLeads, error: allError } = await serviceSupabase
            .from('leads')
            .select('id, tenant_id, stage, status, full_name')
            .limit(5)
            
        results.tests.push({
            test: 'Todos los leads (sin filtro) - primeros 5',
            data: allLeads,
            error: allError
        })
        
        // Con filtro de tenant
        const { data: tenantLeads, error: tenantError } = await serviceSupabase
            .from('leads')
            .select('id, tenant_id, stage, status, full_name')
            .eq('tenant_id', tenantId)
            .limit(10)
            
        results.tests.push({
            test: `Leads del tenant ${tenantId}`,
            data: tenantLeads,
            error: tenantError,
            count: tenantLeads?.length || 0
        })
        
        // Verificar valores únicos de stage
        const { data: stages, error: stagesError } = await serviceSupabase
            .from('leads')
            .select('stage')
            .eq('tenant_id', tenantId)
            
        const uniqueStages = [...new Set(stages?.map(l => l.stage) || [])]
        
        results.tests.push({
            test: 'Valores únicos de stage',
            stages: uniqueStages,
            error: stagesError
        })
        
        // Verificar estructura específica de getSupabaseClient
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: anonLeads, error: anonError } = await supabase
            .from('leads')
            .select('id, tenant_id')
            .eq('tenant_id', tenantId)
            .limit(3)
            
        results.tests.push({
            test: 'Con anon key (mismo que usa la app)',
            data: anonLeads,
            error: anonError,
            count: anonLeads?.length || 0
        })
        
        return NextResponse.json(results, { status: 200 })
        
    } catch (error: any) {
        console.error('Error in test endpoint:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno' },
            { status: 500 }
        )
    }
}