import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }
        
        const tenantId = session.user.tenant_id || 'afa60b0a-3046-4607-9c48-266af6e1d322'
        
        const results: any = {
            tenant_id: tenantId,
            tests: []
        }
        
        // Test 1: Usar el mismo método que la app
        const appSupabase = SupabaseClient.getInstance()
        
        if (!appSupabase) {
            results.tests.push({
                test: 'SupabaseClient.getInstance()',
                error: 'No se pudo obtener instancia'
            })
        } else {
            const { data: appLeads, error: appError, count } = await appSupabase
                .from('leads')
                .select('*', { count: 'exact' })
                .eq('tenant_id', tenantId)
                
            results.tests.push({
                test: 'Con SupabaseClient (método de la app)',
                count: count,
                data: appLeads?.slice(0, 3), // Primeros 3 para debug
                error: appError
            })
        }
        
        // Test 2: Service role directo
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
        
        // Count total de leads
        const { count: totalCount } = await serviceSupabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            
        results.tests.push({
            test: 'Count total de leads en DB',
            count: totalCount
        })
        
        // Leads por tenant
        const { data: tenantLeads, error: tenantError, count: tenantCount } = await serviceSupabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            
        results.tests.push({
            test: `Leads del tenant ${tenantId}`,
            count: tenantCount,
            data: tenantLeads?.slice(0, 3),
            error: tenantError
        })
        
        // Distribución por stage
        if (tenantLeads && tenantLeads.length > 0) {
            const stageDistribution: Record<string, number> = {}
            tenantLeads.forEach(lead => {
                const stage = lead.stage || 'sin_stage'
                stageDistribution[stage] = (stageDistribution[stage] || 0) + 1
            })
            
            results.tests.push({
                test: 'Distribución por stage',
                distribution: stageDistribution
            })
        }
        
        // Test 3: RLS policies
        const { data: policies } = await serviceSupabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'leads')
            
        results.tests.push({
            test: 'RLS policies para tabla leads',
            policies: policies?.map(p => ({
                name: p.policyname,
                cmd: p.cmd,
                roles: p.roles
            }))
        })
        
        return NextResponse.json(results, { status: 200 })
        
    } catch (error: any) {
        console.error('Error en check-leads-detailed:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno' },
            { status: 500 }
        )
    }
}