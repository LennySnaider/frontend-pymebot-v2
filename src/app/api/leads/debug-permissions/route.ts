/**
 * API endpoint para depurar problemas de permisos con leads
 * 
 * Este endpoint es solo para desarrollo y diagnóstico
 * @version 1.0.0
 */

// Forzar runtime de Node.js para evitar problemas con Edge Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

export async function GET(
  request: NextRequest
) {
  try {
    const supabase = SupabaseClient.getInstance()
    
    // Obtener leadId de query params
    const leadId = request.nextUrl.searchParams.get('leadId')
    
    // Obtener el tenant actual
    const tenant_id = await getTenantFromSession()
    
    if (!tenant_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo obtener el tenant_id',
        },
        { status: 401 }
      )
    }
    
    // Información de diagnóstico
    const diagnosticInfo = {
      tenant_id,
      leadId,
      tests: {}
    }
    
    // Test 1: Buscar leads por tenant_id
    const { data: tenantLeads, error: tenantLeadsError } = await supabase
      .from('leads')
      .select('id, full_name, email')
      .eq('tenant_id', tenant_id)
      .limit(5)
    
    diagnosticInfo.tests.tenantLeads = {
      count: tenantLeads?.length || 0,
      sample: tenantLeads?.map(l => ({ id: l.id, name: l.full_name })) || [],
      error: tenantLeadsError
    }
    
    // Test 2: Si se proporcionó un leadId, verificar si existe
    if (leadId) {
      // Prueba con single
      const { data: specificLead, error: specificLeadError } = await supabase
        .from('leads')
        .select('id, full_name, tenant_id')
        .eq('id', leadId)
        .maybeSingle()
      
      diagnosticInfo.tests.specificLead = {
        found: !!specificLead,
        data: specificLead,
        error: specificLeadError
      }
      
      // Prueba con eq tenant_id
      const { data: leadWithTenant, error: leadWithTenantError } = await supabase
        .from('leads')
        .select('id, full_name, tenant_id')
        .eq('id', leadId)
        .eq('tenant_id', tenant_id)
        .maybeSingle()
      
      diagnosticInfo.tests.leadWithTenant = {
        found: !!leadWithTenant,
        data: leadWithTenant,
        error: leadWithTenantError
      }
      
      // Prueba sin restricciones
      const { data: anyLead, error: anyLeadError } = await supabase
        .from('leads')
        .select('id, full_name, tenant_id')
        .eq('id', leadId)
        .maybeSingle()
      
      diagnosticInfo.tests.anyLead = {
        found: !!anyLead,
        tenant_matches: anyLead?.tenant_id === tenant_id,
        data: anyLead,
        error: anyLeadError
      }
    }
    
    // Test 3: Obtener cuenta total de leads para este tenant
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
    
    diagnosticInfo.tests.totalCount = {
      count,
      error: countError
    }
    
    // Test 4: Verificar políticas RLS
    const { data: rlsInfo, error: rlsError } = await supabase
      .rpc('debug_rls_policies_for_leads', { tenant_id_param: tenant_id })
      .single()
    
    diagnosticInfo.tests.rlsPolicies = {
      info: rlsInfo,
      error: rlsError
    }
    
    return NextResponse.json(
      {
        success: true,
        diagnosticInfo,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error en diagnóstico de permisos de leads:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error desconocido en diagnóstico de permisos',
      },
      { status: 500 }
    )
  }
}