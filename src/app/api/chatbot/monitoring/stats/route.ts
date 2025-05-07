/**
 * frontend/src/app/api/chatbot/monitoring/stats/route.ts
 * API para obtener estadísticas generales de conversaciones
 * @version 1.1.0
 * @updated 2025-06-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ConversationBatchOperations } from '../../conversation/batch-operations'
import { auth } from '@/auth'
import getTenantFromSession from '@/server/actions/tenant/getTenantFromSession'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Instancia del servicio de operaciones por lotes
const batchOperations = new ConversationBatchOperations(supabase)

/**
 * GET - Obtiene estadísticas generales de conversaciones
 */
export async function GET(req: NextRequest) {
    try {
        // Verificar la API key o autenticación
        const apiKey = req.headers.get('x-api-key')
        const isValidApiKey = apiKey === process.env.CHATBOT_API_KEY
        
        // Obtener tenant del usuario autenticado si no es API key
        let tenantId = ''
        
        if (!isValidApiKey) {
            const session = await auth()
            if (!session) {
                return NextResponse.json(
                    { error: 'No autenticado' },
                    { status: 401 }
                )
            }
            
            const tenant = await getTenantFromSession(session)
            if (!tenant) {
                return NextResponse.json(
                    { error: 'No se encontró el tenant' },
                    { status: 404 }
                )
            }
            
            tenantId = tenant.id
        } else {
            // Si es llamada con API key, obtener tenant_id de la query
            tenantId = req.nextUrl.searchParams.get('tenant_id') || ''
            
            if (!tenantId) {
                return NextResponse.json(
                    { error: 'Se requiere tenant_id para llamadas con API key' },
                    { status: 400 }
                )
            }
        }
        
        // Obtener parámetros de filtro de fecha
        const dateFrom = req.nextUrl.searchParams.get('from') || undefined
        const dateTo = req.nextUrl.searchParams.get('to') || undefined
        
        // Obtener estadísticas de conversaciones
        const conversationStats = await batchOperations.getConversationStats(
            tenantId,
            dateFrom,
            dateTo
        )
        
        return NextResponse.json(conversationStats)
    } catch (error: any) {
        console.error('Error obteniendo estadísticas de conversaciones:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}