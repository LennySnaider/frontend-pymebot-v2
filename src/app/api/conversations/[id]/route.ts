/**
 * api/conversations/[id]/route.ts
 * API para obtener una conversación específica por ID
 *
 * @version 2.0.0
 * @updated 2025-04-16
 */

import { NextResponse, NextRequest } from 'next/server'
import { conversationList } from '@/mock/data/chatData'

export async function GET(
    _: NextRequest,
    { params }: { params: { id: string } },
) {
    // Await params to support async dynamic APIs per Next.js requirements
    const { id } = await params

    try {
        // En una implementación real, verificaríamos permisos y obtendríamos
        // la conversación de la base de datos, filtrando por tenant_id y user_id
        
        // Por ahora, buscamos la conversación en nuestros datos de prueba
        const conversation = conversationList.find(conv => conv.id === id)
        
        if (!conversation) {
            // Si no se encuentra la conversación, devolvemos una estructura vacía con el ID
            return NextResponse.json({
                id,
                conversation: []
            }, { status: 200 })
        }
        
        return NextResponse.json(conversation, { status: 200 })
    } catch (error) {
        console.error('Error al obtener conversación:', error)
        return NextResponse.json(
            { error: 'Error al obtener conversación' },
            { status: 500 }
        )
    }
}