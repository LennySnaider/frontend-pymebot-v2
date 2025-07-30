import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const supabase = SupabaseClient.getInstance()
        const tenant_id = await getTenantFromSession()
        
        // Get lead without tenant filter
        const { data: leadWithoutFilter, error: error1 } = await supabase
            .from('leads')
            .select('id, tenant_id, full_name, stage')
            .eq('id', String(resolvedParams?.id || ''))
            .single()
        
        // Get lead with tenant filter
        const { data: leadWithFilter, error: error2 } = await supabase
            .from('leads')
            .select('id, tenant_id, full_name, stage')
            .eq('id', String(resolvedParams?.id || ''))
            .eq('tenant_id', tenant_id)
            .single()
        
        return NextResponse.json({
            leadId: String(resolvedParams?.id || ''),
            session_tenant_id: tenant_id,
            leadWithoutFilter,
            leadWithFilter,
            error1: error1?.message,
            error2: error2?.message,
        })
    } catch (error) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 })
    }
}