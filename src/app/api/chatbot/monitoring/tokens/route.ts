/**
 * frontend/src/app/api/chatbot/monitoring/tokens/route.ts
 * API para obtener estadísticas de uso de tokens
 * @version 1.1.0
 * @updated 2025-06-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TokenUsageService } from '../../token-service'
import { auth } from '@/auth'
import getTenantFromSession from '@/server/actions/tenant/getTenantFromSession'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Instancia del servicio de tokens
const tokenService = new TokenUsageService(supabase)

/**
 * GET - Obtiene estadísticas de uso de tokens
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
        const tokenType = req.nextUrl.searchParams.get('type') as any || 'all'
        
        // Obtener estadísticas de uso de tokens
        const tokenStats = await tokenService.getTokenUsageStats(
            tenantId,
            tokenType,
            dateFrom,
            dateTo
        )
        
        return NextResponse.json(tokenStats)
    } catch (error: any) {
        console.error('Error obteniendo estadísticas de tokens:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}