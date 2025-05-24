import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Endpoint optimizado para sincronización instantánea de nombres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id') || 'afa60b0a-3046-4607-9c48-266af6e1d322'
    
    // Usar cliente público para máxima velocidad
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Query super optimizada - solo los campos necesarios
    const { data, error } = await supabase
      .from('leads')
      .select('id, full_name, stage')
      .eq('tenant_id', tenantId)
      .not('status', 'eq', 'closed')
      .order('updated_at', { ascending: false })
      .limit(100) // Limitar para velocidad
    
    if (error) {
      console.error('[InstantSync API] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Respuesta sin caché para frescura de datos
    return new NextResponse(JSON.stringify({ leads: data || [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('[InstantSync API] Error general:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
