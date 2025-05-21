import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

export async function POST(request: NextRequest) {
    try {
        const { email, phone, name } = await request.json()
        const supabase = SupabaseClient.getInstance()
        const tenant_id = await getTenantFromSession()
        
        // Build query
        let query = supabase
            .from('leads')
            .select('id, full_name, email, phone, tenant_id, created_at')
            .eq('tenant_id', tenant_id)
        
        // Add filters based on available data
        if (email) {
            query = query.eq('email', email)
        }
        if (phone) {
            query = query.eq('phone', phone)
        }
        if (name) {
            query = query.eq('full_name', name)
        }
        
        const { data, error } = await query
        
        return NextResponse.json({
            search_params: { email, phone, name },
            tenant_id,
            results: data,
            error: error?.message,
            count: data?.length || 0
        })
    } catch (error) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 })
    }
}