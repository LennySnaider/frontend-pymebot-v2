import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/services/supabase/server'
import { createClient as createPublicClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const includeClosedStatus = searchParams.get('includeClosedStatus') === 'true'
    const includeRemovedFromFunnel = searchParams.get('includeRemovedFromFunnel') === 'true'
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const stages = searchParams.get('stages')?.split(',').filter(Boolean)

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id es requerido' }, { status: 400 })
    }

    // Intentar primero con el cliente autenticado
    let supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Si no hay usuario, usar cliente público para sincronización del chat
    if (!user) {
      console.log('API /api/leads: No hay usuario autenticado, usando cliente público')
      supabase = createPublicClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }

    // Query base
    let query = supabase
      .from('leads')
      .select(`
        id,
        full_name,
        email,
        phone,
        stage,
        status,
        metadata,
        created_at,
        updated_at,
        tenant_id,
        agent_id,
        property_type,
        bedrooms_needed,
        bathrooms_needed,
        budget_min,
        budget_max,
        preferred_zones,
        notes,
        description,
        source,
        interest_level,
        contact_count,
        next_contact_date,
        last_contact_date,
        cover,
        selected_property_id,
        property_ids
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (!includeClosedStatus) {
      query = query.not('status', 'eq', 'closed')
    }

    const { data: leadsData, error } = await query

    if (error) {
      console.error('Error al obtener leads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aplicar filtros post-query
    let filteredLeads = leadsData || []

    // Mapeo de etapas
    const UNIFIED_STAGE_MAPPING: Record<string, string> = {
      'nuevos': 'new',
      'prospectando': 'prospecting',
      'calificacion': 'qualification',
      'calificación': 'qualification',
      'oportunidad': 'opportunity',
      'confirmado': 'confirmed',
      'cerrado': 'closed',
      'first_contact': 'new',
      'new': 'new',
      'prospecting': 'prospecting',
      'qualification': 'qualification',
      'opportunity': 'opportunity',
      'confirmed': 'confirmed',
      'closed': 'closed'
    }

    const DISPLAY_STAGES = ['new', 'prospecting', 'qualification', 'opportunity']

    // Filtrar por stage
    filteredLeads = filteredLeads.filter(lead => {
      if (!lead.stage) return false
      
      const normalizedStage = UNIFIED_STAGE_MAPPING[lead.stage.toLowerCase()] || lead.stage.toLowerCase()
      
      if (stages && stages.length > 0) {
        return stages.includes(normalizedStage)
      }
      
      return DISPLAY_STAGES.includes(normalizedStage)
    })

    // Filtrar leads removidos del funnel
    if (!includeRemovedFromFunnel) {
      filteredLeads = filteredLeads.filter(lead => !lead.metadata?.removed_from_funnel)
    }

    // Filtrar leads eliminados
    if (!includeDeleted) {
      filteredLeads = filteredLeads.filter(lead => !lead.metadata?.is_deleted)
    }

    return NextResponse.json(filteredLeads)

  } catch (error) {
    console.error('Error en endpoint de leads:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
