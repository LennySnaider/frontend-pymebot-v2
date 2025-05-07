/**
 * frontend/src/app/api/chatbot/monitoring/active-sessions/route.ts
 * API para obtener sesiones activas de chatbot
 * @version 1.1.0
 * @updated 2025-06-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'
import getTenantFromSession from '@/server/actions/tenant/getTenantFromSession'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET - Obtiene las sesiones activas del chatbot para un tenant
 */
export async function GET(req: NextRequest) {
    try {
        // Verificar autenticación - API key o sesión de usuario
        const apiKey = req.headers.get('x-api-key')
        const isValidApiKey = apiKey === process.env.CHATBOT_API_KEY
        
        // Obtener tenant_id
        let tenantId = ''
        
        if (isValidApiKey) {
            // Si es llamada con API key, obtener tenant_id de la query
            tenantId = req.nextUrl.searchParams.get('tenant_id') || ''
        } else {
            // Obtener tenant del usuario autenticado
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
        }
        
        // Validar que se tiene un tenant_id
        if (!tenantId) {
            return NextResponse.json(
                { error: 'Se requiere tenant_id para obtener sesiones' },
                { status: 400 }
            )
        }
        
        // Obtener parámetros de paginación y filtrado
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)
        const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10)
        const status = req.nextUrl.searchParams.get('status') || 'active'
        
        // Consultar las sesiones activas junto con sus mensajes recientes
        const { data, error, count } = await supabase
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
            `, { count: 'exact' })
            .eq('tenant_id', tenantId)
            .eq('status', status)
            .order('last_interaction_at', { ascending: false })
            .range(offset, offset + limit - 1)
        
        if (error) {
            throw error
        }
        
        // Procesar datos para incluir solo los últimos 10 mensajes por sesión
        // y ordenarlos cronológicamente
        const sessions = data?.map(session => ({
            ...session,
            messages: (session.messages || [])
                .sort((a: any, b: any) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
                .slice(-10)
        })) || []
        
        // Devolver resultado
        return NextResponse.json({
            sessions,
            pagination: {
                total: count || 0,
                offset,
                limit
            }
        })
        
    } catch (error: any) {
        console.error('Error obteniendo sesiones activas:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}