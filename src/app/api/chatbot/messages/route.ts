/**
 * frontend/src/app/api/chatbot/messages/route.ts
 * API para gestionar los mensajes de una conversación de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ConversationManager } from '../conversation/conversation-manager'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Instancia del gestor de conversaciones
const conversationManager = new ConversationManager(supabase)

/**
 * GET - Obtiene los mensajes de una sesión de conversación
 */
export async function GET(req: NextRequest) {
    try {
        // Verificar la API key
        const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key')
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener parámetros de la solicitud
        const searchParams = req.nextUrl.searchParams
        const sessionId = searchParams.get('session_id')
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 20
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string, 10) : 0
        
        // Validar parámetros obligatorios
        if (!sessionId) {
            return NextResponse.json(
                { error: 'Se requiere el parámetro session_id' },
                { status: 400 }
            )
        }
        
        // Consultar mensajes
        const { data: messages, error } = await supabase
            .from('conversation_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1)
        
        if (error) {
            throw error
        }
        
        // Obtener el conteo total
        const { count, error: countError } = await supabase
            .from('conversation_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
        
        if (countError) {
            throw countError
        }
        
        return NextResponse.json({
            messages: messages || [],
            total: count || 0,
            limit,
            offset
        })
        
    } catch (error: any) {
        console.error('Error al obtener mensajes de la conversación:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * POST - Registra un nuevo mensaje en la conversación
 */
export async function POST(req: NextRequest) {
    try {
        // Verificar la API key
        const apiKey = req.headers.get('x-api-key')
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener los datos del cuerpo de la solicitud
        const body = await req.json()
        
        const { 
            session_id, 
            content, 
            is_from_user,
            content_type = 'text',
            node_id,
            metadata
        } = body
        
        // Validar parámetros obligatorios
        if (!session_id || !content || is_from_user === undefined) {
            return NextResponse.json(
                { error: 'Se requieren los parámetros session_id, content y is_from_user' },
                { status: 400 }
            )
        }
        
        // Registrar el mensaje
        await conversationManager.logMessage(
            session_id,
            content,
            is_from_user,
            content_type,
            node_id,
            metadata
        )
        
        // También actualizar la marca de tiempo de la sesión
        await conversationManager.updateSession(
            session_id,
            { last_interaction_at: new Date().toISOString() }
        )
        
        return NextResponse.json({
            success: true,
            message: 'Mensaje registrado correctamente'
        })
        
    } catch (error: any) {
        console.error('Error al registrar mensaje:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * GET - Ruta anidada para análisis de conversación
 */
async function analysis(req: NextRequest) {
    try {
        // Verificar la API key
        const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key')
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener parámetros de la solicitud
        const searchParams = req.nextUrl.searchParams
        const sessionId = searchParams.get('session_id')
        
        // Validar parámetros obligatorios
        if (!sessionId) {
            return NextResponse.json(
                { error: 'Se requiere el parámetro session_id' },
                { status: 400 }
            )
        }
        
        // Obtener la sesión para verificar el tenant
        const session = await conversationManager.getSessionById(sessionId)
        
        if (!session) {
            return NextResponse.json(
                { error: 'Sesión no encontrada' },
                { status: 404 }
            )
        }
        
        // Obtener estadísticas sobre la conversación
        const [messagesCount, userMessagesCount, botMessagesCount, averageResponseTime] = await Promise.all([
            // Total de mensajes
            supabase
                .from('conversation_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId)
                .then(({ count }) => count || 0),
            
            // Mensajes del usuario
            supabase
                .from('conversation_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId)
                .eq('is_from_user', true)
                .then(({ count }) => count || 0),
            
            // Mensajes del bot
            supabase
                .from('conversation_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', sessionId)
                .eq('is_from_user', false)
                .then(({ count }) => count || 0),
            
            // Tiempo medio de respuesta (más complejo, simplificado aquí)
            calculateAverageResponseTime(sessionId)
        ])
        
        // Obtener los nodos visitados
        const { data: visitedNodes } = await supabase
            .from('conversation_messages')
            .select('node_id')
            .eq('session_id', sessionId)
            .not('node_id', 'is', null)
            .order('created_at', { ascending: true })
        
        const nodeIds = visitedNodes
            ? Array.from(new Set(visitedNodes.map(msg => msg.node_id).filter(Boolean)))
            : []
        
        return NextResponse.json({
            session_id: sessionId,
            tenant_id: session.tenant_id,
            stats: {
                total_messages: messagesCount,
                user_messages: userMessagesCount,
                bot_messages: botMessagesCount,
                average_response_time_ms: averageResponseTime,
                conversation_duration_mins: calculateConversationDuration(session),
                visited_nodes_count: nodeIds.length
            },
            visited_node_ids: nodeIds,
            session_status: session.status,
            start_time: session.created_at,
            last_activity: session.last_interaction_at
        })
        
    } catch (error: any) {
        console.error('Error al analizar conversación:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * Calcula el tiempo medio de respuesta del bot
 */
async function calculateAverageResponseTime(sessionId: string): Promise<number> {
    // Obtener todos los mensajes ordenados por tiempo
    const { data: messages } = await supabase
        .from('conversation_messages')
        .select('created_at, is_from_user')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
    
    if (!messages || messages.length < 2) {
        return 0
    }
    
    let totalResponseTime = 0
    let responsesCount = 0
    
    // Calcular el tiempo entre un mensaje del usuario y la siguiente respuesta del bot
    for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].is_from_user && !messages[i + 1].is_from_user) {
            const userMsgTime = new Date(messages[i].created_at).getTime()
            const botMsgTime = new Date(messages[i + 1].created_at).getTime()
            const responseTime = botMsgTime - userMsgTime
            
            if (responseTime > 0 && responseTime < 30000) { // Filtrar valores atípicos (>30s)
                totalResponseTime += responseTime
                responsesCount++
            }
        }
    }
    
    return responsesCount > 0 ? Math.round(totalResponseTime / responsesCount) : 0
}

/**
 * Calcula la duración total de la conversación en minutos
 */
function calculateConversationDuration(session: any): number {
    const startTime = new Date(session.created_at).getTime()
    const endTime = new Date(session.last_interaction_at).getTime()
    const durationMs = endTime - startTime
    
    return Math.round(durationMs / (1000 * 60)) // Convertir a minutos
}
