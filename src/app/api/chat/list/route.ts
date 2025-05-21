/**
 * api/chat/list/route.ts
 * API para obtener lista de chats desde leads reales
 *
 * @version 1.0.0
 * @created 2025-05-19
 */

import { NextResponse } from 'next/server'
import getChatListFromLeads from '@/server/actions/getChatListFromLeads'

export async function GET() {
    try {
        // Obtener lista de chats desde leads reales
        const chatList = await getChatListFromLeads()
        
        return NextResponse.json(chatList, { status: 200 })
    } catch (error) {
        console.error('Error al obtener lista de chats:', error)
        return NextResponse.json(
            { error: 'Error al obtener lista de chats' },
            { status: 500 }
        )
    }
}