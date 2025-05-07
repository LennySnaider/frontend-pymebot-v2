/**
 * api/conversations/route.ts
 * API para obtener lista de conversaciones
 *
 * @version 2.0.0
 * @updated 2025-04-16
 */

import { NextResponse } from 'next/server'
import { chatList } from '@/mock/data/chatData'

export async function GET() {
    try {
        // En una implementación real, obtendríamos las conversaciones filtradas 
        // por tenant_id y user_id desde la base de datos
        
        // Por ahora, devolvemos nuestros datos de prueba directamente
        return NextResponse.json(chatList, { status: 200 })
    } catch (error) {
        console.error('Error al obtener conversaciones:', error)
        return NextResponse.json(
            { error: 'Error al obtener conversaciones' },
            { status: 500 }
        )
    }
}