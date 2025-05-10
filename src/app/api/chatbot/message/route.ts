/**
 * frontend/src/app/api/chatbot/message/route.ts
 * API para integración completa con chatbot - versión simplificada para diagnóstico
 * 
 * @version 1.3.1
 * @updated 2025-05-11
 */

import { NextRequest, NextResponse } from 'next/server'

// Configuración del backend externo
const BACKEND_URL = process.env.CHATBOT_BACKEND_URL || 'http://localhost:3090'

/**
 * Handler para solicitudes POST - versión simplificada para diagnóstico
 */
export async function POST(req: NextRequest) {
    try {
        // Obtener datos del cuerpo
        const body = await req.json()
        
        // Validar campos requeridos
        const {
            text,
            user_id,
            session_id,
            tenant_id,
            bot_id,
            template_id = null,
            is_internal_test = false,
        } = body
        
        console.log('📝 SOLICITUD RECIBIDA (simplificada)', {
            text, user_id, session_id, tenant_id, bot_id, template_id
        })
        
        // Verificación básica
        if (!text || !user_id || !session_id) {
            return NextResponse.json(
                { error: 'Campos requeridos incompletos' },
                { status: 400 }
            )
        }
        
        // Comunicación directa con el backend
        try {
            const response = await fetch(`${BACKEND_URL}/api/text/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    user_id,
                    session_id,
                    tenant_id: tenant_id || 'default',
                    bot_id: bot_id || 'default',
                    template_id,
                    is_internal_test: true
                })
            })
            
            // Intentar obtener la respuesta como JSON
            const data = await response.json()
            
            return NextResponse.json({
                success: true,
                response: data.response || 'Mensaje procesado',
                metadata: {
                    source: 'backend_proxy_simplificado',
                    status: response.status
                }
            })
        } catch (error) {
            console.error('Error al comunicarse con el backend:', error)
            
            return NextResponse.json({
                success: false,
                error: true,
                response: 'Error al procesar el mensaje en el backend',
                metadata: {
                    source: 'error_simplificado'
                }
            }, { status: 200 })
        }
    } catch (error) {
        console.error('Error general en endpoint simplificado:', error)
        
        return NextResponse.json({
            success: false,
            error: true,
            response: 'Error en el procesamiento del mensaje',
            metadata: {
                source: 'error_general_simplificado'
            }
        }, { status: 200 })
    }
}