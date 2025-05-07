/**
 * frontend/src/app/api/chatbot/monitoring/route.ts
 * API para obtener datos de monitoreo del chatbot
 * @version 1.1.0
 * @updated 2025-06-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ConversationBatchOperations } from '../conversation/batch-operations'
import { TokenUsageService } from '../token-service'
import { auth } from '@/auth'
import getTenantFromSession from '@/server/actions/tenant/getTenantFromSession'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Instancias de servicios
const batchOperations = new ConversationBatchOperations(supabase)
const tokenService = new TokenUsageService(supabase)

/**
 * GET - Obtiene estadísticas y datos para el panel de monitoreo
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
        
        // Obtener parámetros
        const dateFrom = req.nextUrl.searchParams.get('from') || undefined
        const dateTo = req.nextUrl.searchParams.get('to') || undefined
        const metric = req.nextUrl.searchParams.get('metric') || 'all'
        
        // Según el metric solicitado, devolver diferentes datos
        switch (metric) {
            case 'active-sessions':
                // Obtener sesiones activas
                const activeSessions = await getActiveSessions(tenantId)
                return NextResponse.json({ sessions: activeSessions })
                
            case 'tokens':
                // Obtener uso de tokens
                const tokenStats = await tokenService.getTokenUsageStats(
                    tenantId,
                    'all',
                    dateFrom,
                    dateTo
                )
                return NextResponse.json(tokenStats)
                
            case 'stats':
                // Obtener estadísticas generales
                const conversationStats = await batchOperations.getConversationStats(
                    tenantId,
                    dateFrom,
                    dateTo
                )
                return NextResponse.json(conversationStats)
                
            case 'all':
            default:
                // Obtener todos los datos (para dashboard)
                const [sessions, tokens, stats] = await Promise.all([
                    getActiveSessions(tenantId),
                    tokenService.getTokenUsageStats(tenantId, 'all', dateFrom, dateTo),
                    batchOperations.getConversationStats(tenantId, dateFrom, dateTo)
                ])
                
                return NextResponse.json({
                    active_sessions: sessions,
                    token_usage: tokens,
                    conversation_stats: stats
                })
        }
    } catch (error: any) {
        console.error('Error en API de monitoreo:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * Obtiene las sesiones activas con sus mensajes recientes
 */
async function getActiveSessions(tenantId: string) {
    try {
        const { data, error } = await supabase
            .from('conversation_sessions')
            .select(`
                id,
                user_channel_id,
                channel_type,
                current_node_id,
                state_data,
                status,
                last_interaction_at,
                created_at,
                messages:conversation_messages(
                    id,
                    content,
                    is_from_user,
                    created_at
                )
            `)
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .order('last_interaction_at', { ascending: false })
            .limit(20)
        
        if (error) {
            throw error
        }
        
        // Procesar datos para incluir solo los últimos 10 mensajes por sesión
        return data?.map(session => ({
            ...session,
            messages: session.messages
                ?.sort((a: any, b: any) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
                .slice(-10)
        })) || []
        
    } catch (error) {
        console.error('Error obteniendo sesiones activas:', error)
        throw error
    }
}

/**
 * PATCH - Acciones de mantenimiento como expirar sesiones inactivas
 */
export async function PATCH(req: NextRequest) {
    try {
        // Verificar API key
        const apiKey = req.headers.get('x-api-key')
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener acción a realizar
        const body = await req.json()
        const { action, tenant_id: tenantId, params } = body
        
        if (!action) {
            return NextResponse.json(
                { error: 'Se requiere especificar una acción' },
                { status: 400 }
            )
        }
        
        // Ejecutar acción correspondiente
        switch (action) {
            case 'expire_inactive_sessions':
                const minutes = params?.minutes || 60
                const count = await batchOperations.markInactiveSessions(
                    minutes,
                    tenantId
                )
                return NextResponse.json({
                    success: true,
                    action,
                    affected_count: count,
                    message: `${count} sesiones marcadas como expiradas`
                })
                
            case 'cleanup_old_sessions':
                const days = params?.days || 30
                const deletedCount = await batchOperations.cleanupOldSessions(
                    days,
                    tenantId
                )
                return NextResponse.json({
                    success: true,
                    action,
                    affected_count: deletedCount,
                    message: `${deletedCount} sesiones antiguas eliminadas`
                })
                
            case 'reset_token_count':
                const tokenType = params?.token_type || 'ai'
                const result = await tokenService.resetTokenUsage(
                    tenantId,
                    tokenType as any
                )
                return NextResponse.json({
                    success: result,
                    action,
                    message: result ? 
                        `Contador de tokens ${tokenType} reiniciado correctamente` : 
                        'Error al reiniciar contador de tokens'
                })
                
            default:
                return NextResponse.json(
                    { error: `Acción '${action}' no soportada` },
                    { status: 400 }
                )
        }
    } catch (error: any) {
        console.error('Error en acción de mantenimiento:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}