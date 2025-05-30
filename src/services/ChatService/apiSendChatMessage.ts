/**
 * frontend/src/services/ChatService/apiSendChatMessage.ts
 * Servicio para enviar mensajes de chat de texto sin utilizar procesamiento de voz
 * @version 1.4.0
 * @updated 2025-05-13
 */

import axios from 'axios'
import { getOrCreateSessionId, getOrCreateUserId } from './utils'
// Importamos el estado del store directamente en lugar de usar el hook
// Esto evita el error de "Maximum update depth exceeded" por importación circular
// No podemos usar hooks en archivos que no son componentes React
import { useChatStore } from '@/app/(protected-pages)/modules/marketing/chat/_store/chatStore'

// URL base para las APIs
// Siempre usamos nuestro proxy API para garantizar comunicación CORS correcta
// (evitamos la conexión directa al backend que puede tener problemas CORS)
const API_BASE_URL = '/api/chatbot';

/**
 * Envía un mensaje de texto al backend sin utilizar procesamiento de voz
 * @param text Texto del mensaje
 * @param userId ID del usuario (opcional)
 * @param tenantId ID del tenant (opcional)
 * @param botId ID del bot (opcional)
 * @param templateId ID de plantilla explícito (opcional)
 * @returns Respuesta del servidor
 */
const apiSendChatMessage = async (
    text: string,
    userId?: string,
    tenantId?: string,
    botId?: string,
    templateId?: string,
): Promise<{ response: string, error?: boolean, errorDetails?: any, buttons?: any[], [key: string]: any }> => {
    let endpoint: string;

    try {
        // Usamos los IDs existentes o generamos nuevos
        let currentUserId = getOrCreateUserId(userId)
        const sessionId = getOrCreateSessionId(currentUserId)
        const currentTenantId = tenantId || 'default'
        const currentBotId = botId || 'default'
        
        // Obtener la plantilla activa del store si no se proporciona explícitamente
        let template_id = templateId;
        let templateChanged = false;
        
        if (!template_id) {
            try {
                // Paso 1: Verificar el localStorage (máxima prioridad)
                const savedTemplateId = localStorage.getItem('selectedTemplateId');
                if (savedTemplateId) {
                    console.log('🔍 USANDO PLANTILLA DE LOCALSTORAGE 🔍:', savedTemplateId);
                    template_id = savedTemplateId;
                    
                    // Verificar si cambió la plantilla comparando con el último uso
                    const lastUsedTemplate = localStorage.getItem('lastUsedTemplateId');
                    if (lastUsedTemplate && lastUsedTemplate !== savedTemplateId) {
                        console.log('🔄 PLANTILLA CAMBIÓ 🔄:', lastUsedTemplate, '→', savedTemplateId);
                        templateChanged = true;
                    }
                    // Actualizar último template usado
                    localStorage.setItem('lastUsedTemplateId', savedTemplateId);
                }
                else {
                    // Paso 2: Consultar el store global
                    // Aquí NO estamos usando el hook (useChatStore()),
                    // sino accediendo directamente al estado actual del store
                    const activeTemplateId = useChatStore.getState().activeTemplateId;
                    const availableTemplates = useChatStore.getState().templates || [];

                    console.log('🔍 DIAGNÓSTICO PLANTILLAS 🔍 ActiveTemplateId:', activeTemplateId);
                    console.log('🔍 DIAGNÓSTICO PLANTILLAS 🔍 Templates disponibles:',
                        availableTemplates.length > 0 
                            ? availableTemplates.map(t => ({id: t.id, name: t.name, isActive: t.isActive}))
                            : 'Ninguna'
                    );

                    if (activeTemplateId) {
                        console.log('🔍 USANDO PLANTILLA DEL STORE 🔍 ID:', activeTemplateId);
                        template_id = activeTemplateId;
                    }
                    else if (availableTemplates.length > 0) {
                        // Buscar "Flujo basico lead"
                        const leadTemplate = availableTemplates.find(t =>
                            t.name.toLowerCase().includes('lead') &&
                            t.name.toLowerCase().includes('basico'));

                        if (leadTemplate) {
                            template_id = leadTemplate.id;
                            console.log('🔍 USANDO PLANTILLA DE LEAD 🔍 ID:', template_id);
                        }
                        else {
                            // Buscar cualquier plantilla activa
                            const activeTemplate = availableTemplates.find(t => t.isActive);
                            if (activeTemplate) {
                                template_id = activeTemplate.id;
                                console.log('🔍 USANDO PLANTILLA ACTIVA 🔍 ID:', template_id);
                            }
                            else if (availableTemplates.length > 0) {
                                // Usar la primera disponible
                                template_id = availableTemplates[0].id;
                                console.log('🔍 USANDO PRIMERA PLANTILLA DISPONIBLE 🔍 ID:', template_id);
                            }
                        }
                    }
                }
            } catch (storeError) {
                console.error('🔍 ERROR AL OBTENER PLANTILLAS 🔍', storeError);
            }
        }

        // Verificación final de seguridad
        if (!template_id) {
            console.warn('🔍 ALERTA: SIN TEMPLATE_ID 🔍 No se encontró plantilla activa');
            // No establecer un valor por defecto, dejar que el backend maneje la ausencia
            template_id = null;
        }

        // Verificar si el ID de usuario es un ID de lead
        // Puede venir como lead_XXXX
        const isLead = userId?.startsWith('lead_');
        const leadId = isLead ? userId.replace('lead_', '') : null;
        
        // Actualizar currentUserId para usar el ID limpio
        currentUserId = leadId || userId;

        console.log(`Enviando mensaje: "${text}"`)
        console.log(`Usuario: ${currentUserId}`)
        console.log(`Sesión: ${sessionId}`)
        console.log(`Tenant: ${currentTenantId}`)
        console.log(`Bot: ${currentBotId}`)
        console.log(`Plantilla: ${template_id || 'ninguna'}`)
        console.log(`Lead ID: ${leadId ? leadId : 'No es un lead'}`)
        // Log adicional para depuración de leads
        if (leadId) {
            console.log(`MODO LEAD DETECTADO - Enviando mensaje como lead ID: ${leadId}`);
        }

        // Armar los datos de la solicitud
        const requestData = {
            text: text,
            user_id: isLead ? leadId : currentUserId, // Usar leadId como user_id si es un lead
            session_id: sessionId,
            tenant_id: currentTenantId,
            bot_id: currentBotId,
            template_id: template_id, // Añadir template_id a la solicitud
            is_internal_test: true, // Marcar como prueba interna para evitar errores de cuota
            force_template_reset: templateChanged, // Forzar reinicio del backend si cambió la plantilla
            // Incluir leadId si existe
            lead_id: leadId
        };

        console.log('Enviando solicitud con datos:', requestData);

        // Usamos el nuevo endpoint que garantiza la bienvenida y reemplaza variables
        endpoint = `${API_BASE_URL}/integrated-message`;
        console.log(`Endpoint actualizado: ${endpoint}`);

        const response = await axios.post(
            endpoint, // Endpoint mejorado para mensajes de chatbot
            requestData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                // Timeout extendido para dar tiempo al procesamiento de IA
                timeout: 60000, // 60 segundos
                // No necesitamos withCredentials cuando usamos nuestro propio proxy
                withCredentials: false
            },
        )

        console.log('Respuesta del servidor:', response);

        if (response.status === 200) {
            // Manejar caso de múltiples mensajes
            if (response.data.is_multi_message && Array.isArray(response.data.messages)) {
                console.log(`Recibidos múltiples mensajes: ${response.data.messages.length}`);
                
                // Tomamos solo el primer mensaje para regresar inmediatamente
                const firstResponse = response.data.messages[0];
                
                // Programamos envío de mensajes adicionales con delay para simular respuestas naturales
                if (response.data.messages.length > 1) {
                    // Capturamos una referencia al store para actualizar mensajes adicionales
                    const chatStore = useChatStore.getState();
                    
                    // Enviamos los mensajes adicionales con un pequeño retraso entre ellos
                    setTimeout(() => {
                        // Iniciando desde el segundo mensaje (índice 1)
                        for (let i = 1; i < response.data.messages.length; i++) {
                            const message = response.data.messages[i];
                            
                            // Añadimos delay progresivo para cada mensaje
                            setTimeout(() => {
                                console.log(`Añadiendo mensaje adicional ${i}:`, message);
                                
                                // Actualizar el store para mostrar el mensaje
                                // Usar pushConversationMessage que es la función disponible
                                if (chatStore.selectedChat && chatStore.selectedChat.id) {
                                    const chatId = chatStore.selectedChat.id;
                                    chatStore.pushConversationMessage(chatId, {
                                        id: `msg-${Date.now()}-${i}`,
                                        sender: {
                                            id: 'bot',
                                            name: 'BuilderBot',
                                            avatarImageUrl: '/img/avatars/thumb-3.jpg'
                                        },
                                        content: message,
                                        timestamp: new Date(),
                                        type: 'regular',
                                        isMyMessage: false
                                    });
                                }
                            }, (i - 1) * 1000); // 1 segundo entre cada mensaje
                        }
                    }, 1000); // 1 segundo después del primer mensaje
                    
                    const buttons = response.data.metadata?.buttons || [];
                    console.log('Botones con múltiples mensajes:', buttons);
                    
                    return {
                        response: firstResponse,
                        hasFollowUpMessages: true,
                        buttons: buttons,
                        ...response.data
                    };
                }
                
                const buttons = response.data.metadata?.buttons || [];
                return {
                    response: firstResponse,
                    buttons: buttons,
                    ...response.data
                };
            }
            
            // Manejo normal para un solo mensaje
            const responseText = response.data.response || 'No se obtuvo respuesta del servidor';
            console.log(`Respuesta recibida: "${responseText}"`);
            
            // Incluir botones si están presentes
            const buttons = response.data.buttons || response.data.metadata?.buttons || [];
            console.log('Botones recibidos:', buttons);
            
            const result = {
                response: responseText,
                buttons: buttons,
                success: response.data.success,
                metadata: response.data.data?.metadata || response.data.metadata || {},
                ...response.data // Incluir toda la respuesta por si hay más datos
            };
            
            console.log('Estructura de resultado final:', JSON.stringify(result, null, 2));
            return result;
        } else {
            throw new Error(
                `Error en la respuesta: ${response.status} ${response.statusText}`,
            )
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al enviar mensaje:', error);

        // Mostrar información detallada de diagnóstico
        console.error(`
            ======== INFORMACIÓN DE DIAGNÓSTICO CONEXIÓN API ========
            Error al comunicarse con la API proxy.
            - Endpoint utilizado: ${endpoint}
            - Datos enviados: ${JSON.stringify(text)}
            - Error específico: ${errorMessage}
            - Verificar que el servidor backend esté en ejecución
            =======================================================
        `);

        // Verificar si el error es específico de activación
        const isActivationError = errorMessage.includes('No se pudo determinar una activación') ||
                                errorMessage.includes('No se ha configurado ninguna plantilla');
        
        // Proporcionar un mensaje de error más detallado y la respuesta predeterminada
        return {
            response: isActivationError
                ? `Error de configuración: No hay plantillas de chatbot activadas para este tenant. Por favor, contacte al administrador para configurar una plantilla.`
                : `Lo siento, estoy teniendo problemas para procesar tu mensaje (${errorMessage}). ¿Puedes intentarlo de nuevo?`,
            error: true,
            errorType: isActivationError ? 'activation_error' : 'general_error',
            errorDetails: {
                message: errorMessage,
                endpoint: endpoint
            }
        }
    }
}

export default apiSendChatMessage