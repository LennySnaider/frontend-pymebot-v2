/**
 * Debug action to check lead and tenant info
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export async function debugUpdateLead(leadId: string) {
    const supabase = SupabaseClient.getInstance()
    
    const tenant_id = await getTenantFromSession()
    
    console.log('DEBUG: Attempting to update lead', {
        leadId,
        tenant_id,
    })
    
    // Check if lead exists
    const { data: leadExists, error: checkError } = await supabase
        .from('leads')
        .select('id, tenant_id, stage, agent_id')
        .eq('id', leadId)
        .single()
    
    console.log('DEBUG: Lead check result', {
        leadExists,
        checkError,
    })
    
    // Check with tenant_id
    const { data: leadWithTenant, error: tenantError } = await supabase
        .from('leads')
        .select('id, tenant_id, stage, agent_id')
        .eq('id', leadId)
        .eq('tenant_id', tenant_id)
        .single()
    
    console.log('DEBUG: Lead with tenant check', {
        leadWithTenant,
        tenantError,
    })
    
    return {
        tenant_id,
        leadExists,
        leadWithTenant,
        checkError: checkError?.message,
        tenantError: tenantError?.message,
    }
}