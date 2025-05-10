/**
 * frontend/src/app/api/conversations/[id]/route.ts
 * API para obtener y gestionar conversaciones para un lead específico
 * @version 2.1.0
 * @updated 2025-05-11
 */

import { NextRequest, NextResponse } from 'next/server'
import getConversationForLead from '@/server/actions/getConversationForLead'
import { getMockConversation } from '@/services/ChatService/mockChatData'
import { conversationList } from '@/mock/data/chatData'

/**
 * GET - Obtener conversación para un chatId específico
 * Soporta tanto IDs de lead reales (lead_XXX) como chats mock (chat_X)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to support async dynamic APIs per Next.js requirements
    const { id } = await params

    console.log(`Obteniendo conversación para ID: ${id}`)

    // Si es un ID de lead, extraer el ID del lead y obtener la conversación real
    if (id.startsWith('lead_')) {
      const leadId = id.replace('lead_', '')
      
      // Obtener datos reales
      const conversation = await getConversationForLead(leadId)
      
      return NextResponse.json({
        success: true,
        ...conversation
      })
    } 
    
    // Si es un ID de chat de prueba, buscar en los datos de prueba
    const existingConversation = conversationList.find(conv => conv.id === id)
    if (existingConversation) {
      return NextResponse.json(existingConversation, { status: 200 })
    }
    
    // Si no está en conversationList, intentar obtener de mockData
    const mockConversation = getMockConversation(id)
    
    return NextResponse.json({
      success: true,
      ...mockConversation
    })
    
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