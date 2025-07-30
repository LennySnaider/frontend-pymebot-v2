/**
 * frontend/src/app/api/conversations/[id]/route.ts
 * API para obtener y gestionar conversaciones para un lead específico
 * @version 2.1.0
 * @updated 2025-05-11
 */

import { NextRequest, NextResponse } from 'next/server'
import getConversationForLead from '@/server/actions/getConversationForLead'

/**
 * GET - Obtener conversación para un chatId específico
 * Solo soporta IDs de lead reales (lead_XXX)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to support async dynamic APIs per Next.js requirements
    const resolvedParams = await params
    const { id } = resolvedParams

    console.log(`Obteniendo conversación para ID: ${id}`)

    // Si es un ID de lead, extraer el ID del lead y obtener la conversación real
    if (id.startsWith('lead_')) {
      const leadId = id.replace('lead_', '')
      
      try {
        // Obtener datos reales
        const conversation = await getConversationForLead(leadId)
        
        return NextResponse.json({
          success: true,
          ...conversation
        })
      } catch (error) {
        console.log('Error obteniendo conversación, retornando datos de demostración');
        
        // Si hay error, retornar una conversación vacía para evitar 404
        return NextResponse.json({
          success: true,
          id: `lead_${leadId}`,
          conversation: []
        })
      }
    } 
    
    // Si no es un ID de lead, devolver error
    return NextResponse.json(
      { 
        success: false,
        error: 'ID de conversación inválido. Solo se soportan IDs de lead reales.' 
      },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('Error al obtener conversación:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}