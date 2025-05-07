/**
 * Endpoint API para obtener datos del agente asignado a un lead por ID de lead
 * Permite recuperar información del agente directamente usando la relación lead-agente.
 * 
 * @version 1.0.0
 * @created 2025-04-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId } = body
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'ID de lead requerido' },
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
    
    // Obtener el agent_id del lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('agent_id, metadata')
      .eq('id', leadId)
      .single()
    
    if (leadError) {
      console.error('Error al obtener lead:', leadError)
      return NextResponse.json(
        { error: leadError.message },
        { status: 500 }
      )
    }
    
    if (!leadData) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }
    
    // Extraer agent_id del lead o de metadata
    const agentId = leadData.agent_id || (leadData.metadata && leadData.metadata.agentId)
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Lead sin agente asignado' },
        { status: 404 }
      )
    }
    
    // Obtener información del agente
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        email,
        profile_image
      `)
      .eq('id', agentId)
      .single()
    
    if (agentError) {
      console.error('Error al obtener agente:', agentError)
      
      // Si el agente no se encuentra, crear un objeto básico
      if (agentError.code === 'PGRST116') {
        const defaultAgent = {
          id: agentId,
          name: 'Agente',
          email: '',
          img: ''
        }
        
        return NextResponse.json({
          success: true,
          agent: defaultAgent,
          leadId
        })
      }
      
      return NextResponse.json(
        { error: agentError.message },
        { status: 500 }
      )
    }
    
    if (!agentData) {
      const defaultAgent = {
        id: agentId,
        name: 'Agente',
        email: '',
        img: ''
      }
      
      return NextResponse.json({
        success: true,
        agent: defaultAgent,
        leadId
      })
    }
    
    // Convertir a formato de miembro para el frontend
    const agent = {
      id: agentData.id,
      name: agentData.name || agentData.email || 'Agente',
      email: agentData.email || '',
      img: agentData.profile_image || ''
    }
    
    return NextResponse.json({
      success: true,
      agent,
      leadId
    })
    
  } catch (err: any) {
    console.error('Error inesperado al obtener agente de lead:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}