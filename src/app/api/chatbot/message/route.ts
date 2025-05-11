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

            // Manejo mejorado de la respuesta para soportar mensajes múltiples
            let responseText = '';

            // Si tenemos una respuesta en formato de array de mensajes
            if (data.is_multi_message && Array.isArray(data.messages) && data.messages.length > 0) {
                // MODIFICADO: Combinar mensajes en uno solo para solucionar problema de UI
                if (data.messages.length > 1) {
                    // Combinar mensajes con saltos de línea para garantizar que se muestren
                    responseText = data.messages.join('\n\n');
                    console.log('Combinando mensajes múltiples en uno solo:', responseText);
                } else {
                    // Si hay solo un mensaje, usarlo directamente
                    responseText = data.messages[0];
                    console.log('Detectado un solo mensaje en array:', responseText);
                }
            }
            // Si tenemos una respuesta normal
            else if (data.response) {
                // MODIFICADO: Verificar si hay mensaje de despedida para combinarlo
                if (data.endMessage ||
                    (data.originalData?.state?.endMessage) ||
                    (data.state?.endMessage)) {

                    const farewell = data.endMessage ||
                                     data.originalData?.state?.endMessage ||
                                     data.state?.endMessage;

                    // Combinar respuesta principal con despedida
                    responseText = `${data.response}\n\n${farewell}`;
                    console.log('Combinando respuesta con despedida:', responseText);
                } else {
                    // Usar solo la respuesta si no hay despedida
                    responseText = data.response;
                    console.log('Usando respuesta simple sin despedida:', responseText);
                }
            }
            // Fallback solo si no hay ninguna respuesta válida
            else {
                console.warn('Sin respuesta del backend, usando fallback');
                responseText = 'Lo siento, estoy teniendo problemas para procesar tu solicitud.';
            }

            return NextResponse.json({
                success: true,
                response: responseText,
                // Pasar explícitamente mensajes múltiples si existen
                messages: data.messages || [],
                is_multi_message: data.is_multi_message || false,
                // Pasar todos los datos originales para debugging
                originalData: data,
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