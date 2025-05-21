/**
 * api/conversations/route.ts
 * API para obtener lista de conversaciones
 *
 * @version 2.0.0
 * @updated 2025-04-16
 */

import { NextResponse } from 'next/server'
import getChatListFromLeads from '@/server/actions/getChatListFromLeads'

export async function GET() {
    try {
        // Obtener conversaciones reales desde leads
        const chatList = await getChatListFromLeads()
        
        return NextResponse.json(chatList, { status: 200 })
    } catch (error) {
        console.error('Error al obtener conversaciones:', error)
        return NextResponse.json(
            { error: 'Error al obtener conversaciones' },
            { status: 500 }
        )
    }
}