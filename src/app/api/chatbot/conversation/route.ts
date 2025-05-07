/**
 * frontend/src/app/api/chatbot/conversation/route.ts
 * API para gestionar el estado de conversaciones de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/services/supabase/SupabaseClient'
import { ConversationManager } from './conversation-manager'

// Instancia del gestor de conversaciones
const conversationManager = new ConversationManager(supabase)

/**
 * GET - Busca una sesión de conversación existente o devuelve null
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
        const userChannelId = searchParams.get('user_channel_id')
        const channelType = searchParams.get('channel_type')
        const tenantId = searchParams.get('tenant_id')
        
        // Validar parámetros obligatorios
        if (!userChannelId || !channelType || !tenantId) {
            return NextResponse.json(
                { error: 'Se requieren los parámetros user_channel_id, channel_type y tenant_id' },
                { status: 400 }
            )
        }
        
        // Buscar sesión de conversación activa
        const session = await conversationManager.findActiveSession(
            userChannelId,
            channelType,
            tenantId
        )
        
        return NextResponse.json(session || { exists: false })
        
    } catch (error: any) {
        console.error('Error al buscar sesión de conversación:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * POST - Crea o actualiza una sesión de conversación
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
            user_channel_id, 
            channel_type, 
            tenant_id, 
            activation_id,
            current_node_id,
            state_data,
            status,
            session_id
        } = body
        
        // Validar parámetros obligatorios
        if (!user_channel_id || !channel_type || !tenant_id) {
            return NextResponse.json(
                { error: 'Se requieren los parámetros user_channel_id, channel_type y tenant_id' },
                { status: 400 }
            )
        }
        
        let result
        
        // Si se proporciona session_id, actualizar la sesión existente
        if (session_id) {
            result = await conversationManager.updateSession(
                session_id,
                {
                    current_node_id,
                    state_data,
                    status,
                    last_interaction_at: new Date().toISOString()
                }
            )
        } else {
            // Si no, crear una nueva sesión
            result = await conversationManager.createSession(
                user_channel_id,
                channel_type,
                tenant_id,
                activation_id,
                current_node_id,
                state_data,
                status
            )
        }
        
        return NextResponse.json(result)
        
    } catch (error: any) {
        console.error('Error al crear/actualizar sesión de conversación:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * PATCH - Actualiza parcialmente una sesión existente
 */
export async function PATCH(req: NextRequest) {
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
            state_updates,
            current_node_id,
            status
        } = body
        
        // Validar parámetros obligatorios
        if (!session_id) {
            return NextResponse.json(
                { error: 'Se requiere el parámetro session_id' },
                { status: 400 }
            )
        }
        
        // Primero, obtener la sesión actual
        const currentSession = await conversationManager.getSessionById(session_id)
        
        if (!currentSession) {
            return NextResponse.json(
                { error: 'Sesión no encontrada' },
                { status: 404 }
            )
        }
        
        // Preparar los datos actualizados
        const updatedData: any = {
            last_interaction_at: new Date().toISOString()
        }
        
        // Actualizar el nodo actual si se proporciona
        if (current_node_id) {
            updatedData.current_node_id = current_node_id
        }
        
        // Actualizar el estado si se proporciona
        if (status) {
            updatedData.status = status
        }
        
        // Actualizar el estado de la conversación si se proporcionan actualizaciones
        if (state_updates && Object.keys(state_updates).length > 0) {
            // Combinar el estado existente con las actualizaciones
            updatedData.state_data = {
                ...(currentSession.state_data || {}),
                ...state_updates
            }
        }
        
        // Realizar la actualización
        const result = await conversationManager.updateSession(session_id, updatedData)
        
        return NextResponse.json(result)
        
    } catch (error: any) {
        console.error('Error al actualizar parcialmente la sesión:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * DELETE - Marca una sesión como completada o eliminada
 */
export async function DELETE(req: NextRequest) {
    try {
        // Verificar la API key
        const apiKey = req.headers.get('x-api-key')
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener el session_id
        const searchParams = req.nextUrl.searchParams
        const sessionId = searchParams.get('session_id')
        
        // Validar parámetros obligatorios
        if (!sessionId) {
            return NextResponse.json(
                { error: 'Se requiere el parámetro session_id' },
                { status: 400 }
            )
        }
        
        // Actualizar el estado de la sesión a 'completed'
        const result = await conversationManager.updateSession(
            sessionId,
            {
                status: 'completed',
                last_interaction_at: new Date().toISOString()
            }
        )
        
        return NextResponse.json({
            success: true,
            message: 'Sesión marcada como completada',
            session: result
        })
        
    } catch (error: any) {
        console.error('Error al completar la sesión:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}
