/**
 * frontend/src/app/api/chatbot/message/route.ts
 * API para registrar mensajes en conversaciones de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Handler para solicitudes POST - Registrar un nuevo mensaje
 */
export async function POST(req: NextRequest) {
    try {
        // Verificar API key
        const apiKey = req.headers.get('x-api-key') || '';
        if (apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener datos del cuerpo
        const body = await req.json()
        
        // Validar campos requeridos
        const {
            session_id,
            content,
            is_from_user = true,
            content_type = 'text',
            node_id = null,
            metadata = {}
        } = body
        
        if (!session_id || !content) {
            return NextResponse.json(
                { error: 'session_id y content son requeridos' },
                { status: 400 }
            )
        }
        
        // Verificar que la sesión existe
        const { data: session, error: sessionError } = await supabase
            .from('conversation_sessions')
            .select('id, status')
            .eq('id', session_id)
            .single()
        
        if (sessionError) {
            return NextResponse.json(
                { error: 'Sesión no encontrada' },
                { status: 404 }
            )
        }
        
        // Verificar que la sesión esté activa
        if (session.status !== 'active' && session.status !== 'waiting_input') {
            return NextResponse.json(
                { error: 'No se pueden agregar mensajes a una sesión finalizada' },
                { status: 400 }
            )
        }
        
        // Registrar el mensaje
        const { data: message, error } = await supabase
            .from('conversation_messages')
            .insert({
                session_id,
                content,
                is_from_user,
                content_type,
                node_id,
                created_at: new Date().toISOString(),
                metadata
            })
            .select()
            .single()
        
        if (error) throw error
        
        // Actualizar timestamp de última interacción en la sesión
        await supabase
            .from('conversation_sessions')
            .update({
                last_interaction_at: new Date().toISOString()
            })
            .eq('id', session_id)
        
        return NextResponse.json({
            success: true,
            message_id: message.id
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
 * Handler para solicitudes GET - Obtener mensajes de una conversación
 */
export async function GET(req: NextRequest) {
    try {
        // Obtener parámetros de la consulta
        const searchParams = req.nextUrl.searchParams
        const sessionId = searchParams.get('session_id')
        const limit = parseInt(searchParams.get('limit') || '20', 10)
        const apiKey = searchParams.get('api_key')
        
        // Verificar API key
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Verificar parámetros obligatorios
        if (!sessionId) {
            return NextResponse.json(
                { error: 'session_id es requerido' },
                { status: 400 }
            )
        }
        
        // Obtener mensajes de la conversación
        const { data: messages, error } = await supabase
            .from('conversation_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(limit)
        
        if (error) throw error
        
        return NextResponse.json({
            messages: messages?.reverse() || []
        })
        
    } catch (error: any) {
        console.error('Error al obtener mensajes:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
