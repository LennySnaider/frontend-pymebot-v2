/**
 * frontend/src/app/api/debug/leads/route.ts
 * Endpoint de diagnóstico para ver los leads actuales
 * @version 1.0.0
 * @updated 2025-09-05
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Obtener la sesión actual
    const session = await auth()
    const tenantId = session?.user?.tenantId
    
    // Si no hay tenant ID, no podemos continuar
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró ID de tenant en la sesión',
        session: session
      }, { status: 401 })
    }
    
    // Obtener el cliente Supabase
    const supabase = SupabaseClient.getInstance()
    
    if (!supabase) {
      return NextResponse.json({
        success: false, 
        error: 'No se pudo inicializar el cliente Supabase'
      }, { status: 500 })
    }
    
    // Obtener todos los leads para este tenant
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id, 
        full_name, 
        email, 
        phone, 
        stage, 
        status,
        created_at,
        tenant_id
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (leadsError) {
      return NextResponse.json({
        success: false, 
        error: 'Error al obtener leads',
        details: leadsError 
      }, { status: 500 })
    }
    
    // Información sobre configuración
    const { data: configData, error: configError } = await supabase
      .from('tenant_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()
    
    return NextResponse.json({
      success: true,
      leads: leadsData || [],
      leadCount: leadsData?.length || 0,
      tenantId: tenantId,
      tenantConfig: configData || null,
      sessionInfo: {
        user: session?.user,
        expires: session?.expires
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido'
    }, { status: 500 })
  }
}