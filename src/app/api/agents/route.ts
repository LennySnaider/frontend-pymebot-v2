/**
 * Endpoint API para obtener agentes (usuarios con rol agent)
 * @version 1.0.0
 * @updated 2025-05-19
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

    // Obtener el cliente Supabase
    const supabase = SupabaseClient.getInstance()
    
    // Consultar usuarios con rol 'agent' para este tenant
    const { data: agents, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        tenant_id,
        metadata
      `)
      .eq('role', 'agent')
      .eq('tenant_id', tenant_id)
      
    if (error) {
      console.error('Error al obtener agentes:', error)
      
      // Intentar consulta alternativa si la primera falla (puede ser diferente estructura)
      console.log('Intentando consulta alternativa...')
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenant_id)
      
      if (usersError) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Error al consultar usuarios: ' + usersError.message,
            details: usersError
          },
          { status: 500 }
        )
      }
      
      // Filtrar usuarios que pueden ser agentes (basados en rol o metadata)
      const possibleAgents = allUsers.filter(user => 
        user.role === 'agent' || 
        user.role === 'tenant_admin' || 
        (user.metadata && (user.metadata.isAgent || user.metadata.role === 'agent'))
      )
      
      return NextResponse.json({
        success: true,
        agents: possibleAgents
      })
    }
    
    // Formatear respuesta para el cliente
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.full_name || agent.email?.split('@')[0] || 'Sin nombre',
      email: agent.email || '',
      img: agent.avatar_url || '',
      tenant_id: agent.tenant_id,
      // Incluir metadata relevante
      metadata: agent.metadata || {}
    }))
    
    return NextResponse.json(formattedAgents)
    
  } catch (err: any) {
    console.error('Error inesperado al obtener agentes:', err)
    return NextResponse.json(
      { 
        success: false,
        error: err.message || 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}