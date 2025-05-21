/**
 * Endpoint API para obtener datos de un agente específico por ID
 * Permite recuperar información básica de un agente para mostrar en las tarjetas de leads.
 * 
 * @version 1.0.0
 * @created 2025-04-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Fix para NextJS 15: Primero esperar los parámetros
    const resolvedParams = await params;
    // Luego extraer el ID de manera segura
    const agentId = resolvedParams?.id ? String(resolvedParams.id) : ''
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'ID de agente requerido' },
        { status: 400 }
      )
    }
    
    // Obtener el cliente Supabase
    const supabase = SupabaseClient.getInstance()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Error al conectar con la base de datos' },
        { status: 500 }
      )
    }
    
    // Intentar obtener datos del agente desde la tabla users
    // Nota: En esta app, los agentes son users con role = 'agent'
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name, 
        email,
        avatar_url,
        tenant_id,
        metadata
      `)
      .eq('id', agentId)
      .eq('role', 'agent')
      .maybeSingle()
    
    if (error) {
      console.error('Error al obtener agente:', error)
      
      // Si no se encuentra, devolvemos datos básicos para evitar errores en el frontend
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          agent: {
            id: agentId,
            full_name: 'Agente',
            email: '',
            avatar_url: '',
            tenant_id: null
          }
        })
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    if (!data) {
      // Si no hay datos pero no hubo error, también devolvemos una respuesta básica
      return NextResponse.json({
        agent: {
          id: agentId,
          full_name: 'Agente',
          email: '',
          avatar_url: '',
          tenant_id: null
        }
      })
    }
    
    // Devolver datos del agente encontrado
    return NextResponse.json({
      agent: data
    })
    
  } catch (err: any) {
    console.error('Error inesperado al obtener agente:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}