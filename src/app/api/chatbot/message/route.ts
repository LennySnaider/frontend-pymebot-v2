/**
 * v2-frontend-pymebot/src/app/api/chatbot/message/route.ts
 * API para integración completa con chatbot - versión mejorada
 *
 * @version 1.4.1
 * @updated 2025-07-14
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processMessage } from '../executor/flow-executor'
import { SystemVariablesService } from '@/services/SystemVariablesService'

// Configuración del backend externo (fallback)
const BACKEND_URL = process.env.CHATBOT_BACKEND_URL || 'http://localhost:3090'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Instancia del servicio de variables del sistema
// En rutas de API, no usamos instancias de clases, para evitar problemas con React
// Usamos funciones independientes
const systemVariables = {
    replaceVariables: (text: string, variables: Record<string, any>): string => {
        if (!text) return ''
        
        return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
            return variables[variableName] !== undefined ? String(variables[variableName]) : match
        })
    }
}

/**
 * Handler para solicitudes POST - versión mejorada con procesamiento directo
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

        console.log('⭐ SOLICITUD DE CHAT RECIBIDA ⭐', {
            text, user_id, session_id, tenant_id, template_id
        })

        // Verificación básica
        if (!text || !user_id || !session_id) {
            return NextResponse.json(
                { error: 'Campos requeridos incompletos' },
                { status: 400 }
            )
        }

        // Cargar las variables del sistema para este tenant
        const tenantVariables = await loadSystemVariables(tenant_id);
        console.log('⭐ VARIABLES DISPONIBLES ⭐', Object.keys(tenantVariables));

        // Intentar procesar el mensaje localmente primero
        try {
            if (template_id) {
                console.log(`⭐ PROCESANDO LOCALMENTE ⭐ Plantilla: ${template_id}`);

                try {
                    // Procesar el mensaje usando nuestro motor local
                    const result = await processMessage(
                        tenant_id,
                        user_id,
                        text,
                        'webchat'  // Tipo de canal
                    );

                    // Verificar si hay respuestas
                    if (!result.responses || result.responses.length === 0) {
                        console.warn('⭐ NO HAY RESPUESTAS DEL MOTOR LOCAL ⭐ Generando respuesta por defecto');
                        result.responses = ['Hola, ¿en qué puedo ayudarte? (respuesta predeterminada)'];
                    }
                    
                    // Verificar si la primera respuesta debería ser el mensaje de bienvenida
                    // Esta es una última verificación de calidad
                    if (result.isNewConversation === true || session_id.startsWith('new_') || !session_id.includes('-')) {
                        let hasWelcomeMessage = false;
                        
                        // Comprobar si alguna respuesta contiene palabras de bienvenida
                        result.responses.forEach(resp => {
                            if (resp.toLowerCase().includes('hola') || 
                                resp.toLowerCase().includes('bienvenido') ||
                                resp.toLowerCase().includes('welcome') ||
                                resp.toLowerCase().includes('asistente virtual')) {
                                hasWelcomeMessage = true;
                            }
                        });
                        
                        // Si no hay mensaje de bienvenida, agregar uno al principio
                        if (!hasWelcomeMessage) {
                            console.warn('⭐ NO HAY MENSAJE DE BIENVENIDA ⭐ Agregando mensaje de bienvenida');                           
                            result.responses.unshift('👋 Hola, soy el asistente virtual de PymeBot. ¿En qué puedo ayudarte hoy?');
                        }
                    }

                    // Reemplazar variables en las respuestas
                    const processedResponses = result.responses.map(response =>
                        systemVariables.replaceVariables(response, tenantVariables)
                    );

                console.log('⭐ RESPUESTAS GENERADAS LOCALMENTE ⭐', processedResponses);

                // Combinar respuestas si hay múltiples
                const responseText = processedResponses.join('\n\n');

                return NextResponse.json({
                    success: true,
                    response: responseText,
                    messages: processedResponses,
                    is_multi_message: processedResponses.length > 1,
                    metadata: {
                        source: 'local_processing',
                        sessionId: result.sessionId,
                        sessionStatus: result.sessionStatus,
                        isNewConversation: result.isNewConversation === true
                    }
                });
                } catch (processingError: any) {
                    // Capturar específicamente el error de activación
                    if (processingError.message && processingError.message.includes('No se pudo determinar una activación')) {
                        console.error('⭐ ERROR DE ACTIVACIÓN ⭐', processingError.message);
                        
                        // Buscar cualquier plantilla disponible como último recurso
                        const { data: templates } = await supabase
                            .from('chatbot_templates')
                            .select('id, name')
                            .eq('status', 'published')
                            .eq('is_deleted', false)
                            .limit(5);
                            
                        return NextResponse.json({
                            success: false,
                            error: true,
                            response: 'Actualmente no hay ninguna plantilla de chatbot configurada para este tenant. Esto es necesario para poder procesar los mensajes correctamente. Por favor, contacte al administrador para activar una plantilla de chatbot.',
                            error_type: 'no_activation',
                            available_templates: templates || [],
                            metadata: {
                                source: 'error_no_activation',
                                tenant_id: tenant_id
                            }
                        }, { status: 200 }); // Devolver 200 para que el frontend pueda mostrar el mensaje de error
                    }
                    
                    // Re-lanzar el error para que lo maneje el catch general
                    throw processingError;
                }
            } else {
                console.log('⭐ SIN TEMPLATE_ID ⭐ Intentando contactar backend...');
            }
        } catch (localError) {
            console.error('⭐ ERROR EN PROCESAMIENTO LOCAL ⭐', localError);
            console.log('⭐ FALLBACK AL BACKEND ⭐ Intentando conexión...');
            // Continuar con el backend externo como fallback
        }

        // Comunicación con el backend externo (como fallback)
        try {
            // Configurar timeout extendido para el fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos
            
            const response = await fetch(`${BACKEND_URL}/api/text/chatbot`, {
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
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            // Intentar obtener la respuesta como JSON
            const data = await response.json();

            // Manejo mejorado de la respuesta para soportar mensajes múltiples
            let responseText = '';

            // Si tenemos una respuesta en formato de array de mensajes
            if (data.is_multi_message && Array.isArray(data.messages) && data.messages.length > 0) {
                // Procesar cada mensaje y reemplazar variables
                const processedMessages = data.messages.map(msg =>
                    systemVariables.replaceVariables(msg, tenantVariables)
                );

                if (processedMessages.length > 1) {
                    // Combinar mensajes con saltos de línea
                    responseText = processedMessages.join('\n\n');
                } else {
                    // Si hay solo un mensaje, usarlo directamente
                    responseText = processedMessages[0];
                }
            }
            // Si tenemos una respuesta normal
            else if (data.response) {
                // Reemplazar variables en la respuesta principal
                let mainResponse = systemVariables.replaceVariables(data.response, tenantVariables);

                // Verificar si hay mensaje de despedida para combinarlo
                if (data.endMessage ||
                    (data.originalData?.state?.endMessage) ||
                    (data.state?.endMessage)) {

                    const farewell = data.endMessage ||
                                     data.originalData?.state?.endMessage ||
                                     data.state?.endMessage;

                    // Reemplazar variables en la despedida
                    const processedFarewell = systemVariables.replaceVariables(farewell, tenantVariables);

                    // Combinar respuesta principal con despedida
                    responseText = `${mainResponse}\n\n${processedFarewell}`;
                } else {
                    // Usar solo la respuesta principal
                    responseText = mainResponse;
                }
            }
            // Fallback si no hay ninguna respuesta válida
            else {
                console.warn('⭐ SIN RESPUESTA DEL BACKEND ⭐ Usando fallback');
                responseText = 'Lo siento, estoy teniendo problemas para procesar tu solicitud.';
            }

            return NextResponse.json({
                success: true,
                response: responseText,
                // Pasar explícitamente mensajes múltiples si existen
                messages: data.messages ? data.messages.map(msg =>
                    systemVariables.replaceVariables(msg, tenantVariables)
                ) : [],
                is_multi_message: data.is_multi_message || false,
                metadata: {
                    source: 'backend_proxy',
                    status: response.status
                }
            });
        } catch (error) {
            console.error('⭐ ERROR AL COMUNICARSE CON EL BACKEND ⭐', error);

            return NextResponse.json({
                success: false,
                error: true,
                response: 'Lo siento, no puedo procesar tu mensaje en este momento. Por favor, intenta nuevamente más tarde.',
                metadata: {
                    source: 'error_backend'
                }
            }, { status: 200 });
        }
    } catch (error) {
        console.error('⭐ ERROR GENERAL EN ENDPOINT ⭐', error);

        return NextResponse.json({
            success: false,
            error: true,
            response: 'Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente.',
            metadata: {
                source: 'error_general'
            }
        }, { status: 200 });
    }
}

/**
 * Carga las variables del sistema para un tenant específico
 * Incluye variables comunes y personalizadas del tenant
 */
async function loadSystemVariables(tenantId: string): Promise<Record<string, string>> {
    try {
        // Variables base por defecto
        const defaultVariables: Record<string, string> = {
            'company_name': 'PymeBot',
            'user_name': 'Usuario',
            'tenant_name': 'Empresa'
        };

        // Intentar obtener variables del sistema de la base de datos
        if (tenantId && tenantId !== 'default') {
            try {
                // 1. Obtener información del tenant
                const { data: tenantData } = await supabase
                    .from('tenants')
                    .select('name, company_name, contact_email, contact_phone')
                    .eq('id', tenantId)
                    .single();

                if (tenantData) {
                    defaultVariables['tenant_name'] = tenantData.name || defaultVariables['tenant_name'];
                    defaultVariables['company_name'] = tenantData.company_name || defaultVariables['company_name'];
                    defaultVariables['contact_email'] = tenantData.contact_email || '';
                    defaultVariables['contact_phone'] = tenantData.contact_phone || '';
                }

                // 2. Obtener variables específicas del tenant
                const { data: tenantVariables } = await supabase
                    .from('tenant_variables')
                    .select('variable_name, variable_value')
                    .eq('tenant_id', tenantId);

                if (tenantVariables && tenantVariables.length > 0) {
                    tenantVariables.forEach(variable => {
                        defaultVariables[variable.variable_name] = variable.variable_value;
                    });
                }

                // 3. Obtener variables del sistema globales
                const { data: systemVars } = await supabase
                    .from('system_variables')
                    .select('name, default_value, is_tenant_configurable')
                    .eq('is_tenant_configurable', true);

                if (systemVars && systemVars.length > 0) {
                    systemVars.forEach(variable => {
                        // Solo agregar si no existe ya una versión específica del tenant
                        if (!defaultVariables[variable.name] && variable.default_value) {
                            defaultVariables[variable.name] = variable.default_value;
                        }
                    });
                }
            } catch (dbError) {
                console.error('⭐ ERROR AL CARGAR VARIABLES DEL SISTEMA ⭐', dbError);
            }
        }

        return defaultVariables;
    } catch (error) {
        console.error('⭐ ERROR GENERAL EN CARGA DE VARIABLES ⭐', error);
        return {
            'company_name': 'PymeBot',
            'user_name': 'Usuario',
            'tenant_name': 'Empresa'
        };
    }
}