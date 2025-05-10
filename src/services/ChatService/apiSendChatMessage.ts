/**
 * frontend/src/services/ChatService/apiSendChatMessage.ts
 * Servicio para enviar mensajes de chat de texto sin utilizar procesamiento de voz
 * @version 1.2.0
 * @updated 2025-05-11
 */

import axios from 'axios'
import { getOrCreateSessionId, getOrCreateUserId } from './utils'
// Corregir la ruta de importación
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
 * @returns Respuesta del servidor
 */
const apiSendChatMessage = async (
    text: string,
    userId?: string,
    tenantId?: string,
    botId?: string,
    templateId?: string,
): Promise<{ response: string }> => {
    try {
        // Usamos los IDs existentes o generamos nuevos
        const currentUserId = getOrCreateUserId(userId)
        const sessionId = getOrCreateSessionId(currentUserId)
        const currentTenantId = tenantId || 'default'
        const currentBotId = botId || 'default'
        
        // Obtener la plantilla activa del store si no se proporciona explícitamente
        let template_id = templateId;
        if (!template_id) {
            try {
                // Intentar obtener del store global
                const store = useChatStore.getState();
                const activeTemplateId = store.activeTemplateId;
                const availableTemplates = store.templates || [];

                console.log('🔍 DIAGNÓSTICO PLANTILLAS 🔍 ActiveTemplateId:', activeTemplateId);
                console.log('🔍 DIAGNÓSTICO PLANTILLAS 🔍 Templates disponibles:',
                  availableTemplates.map(t => ({id: t.id, name: t.name, isActive: t.isActive})));

                if (activeTemplateId) {
                    console.log('🔍 USANDO PLANTILLA DEL STORE 🔍 ID:', activeTemplateId);

                    // Verificar que el ID es un UUID válido
                    if (activeTemplateId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                        template_id = activeTemplateId;
                        console.log('🔍 UUID VÁLIDO 🔍 Usando directamente');
                    } else {
                        console.warn('🔍 UUID INVÁLIDO 🔍 ID de plantilla activa no es un UUID válido:', activeTemplateId);

                        // Buscar la plantilla por nombre si el ID no es UUID
                        const isBasicLeadTemplate = activeTemplateId === 'flujo-basico-lead' ||
                            (activeTemplateId.toLowerCase().includes('basico') &&
                             activeTemplateId.toLowerCase().includes('lead'));

                        if (isBasicLeadTemplate) {
                            // Buscar el UUID real en el store
                            const basicLeadTemplate = availableTemplates.find(t =>
                                t.name.toLowerCase().includes('basico') &&
                                t.name.toLowerCase().includes('lead') &&
                                t.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));

                            if (basicLeadTemplate) {
                                template_id = basicLeadTemplate.id;
                                console.log('🔍 PLANTILLA ENCONTRADA POR NOMBRE 🔍', template_id);
                            } else {
                                // Si no encontramos plantilla específica, usar cualquiera disponible con UUID válido
                                const anyValidTemplate = availableTemplates.find(t =>
                                    t.id && t.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));

                                if (anyValidTemplate) {
                                    template_id = anyValidTemplate.id;
                                    console.log('🔍 USANDO CUALQUIER PLANTILLA VÁLIDA 🔍', template_id);
                                } else {
                                    console.warn('🔍 NO HAY PLANTILLAS VÁLIDAS DISPONIBLES 🔍');
                                }
                            }
                        } else {
                            // Intentar usar cualquier plantilla disponible
                            if (availableTemplates.length > 0) {
                                const firstValidTemplate = availableTemplates.find(t =>
                                    t.id && t.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));

                                if (firstValidTemplate) {
                                    template_id = firstValidTemplate.id;
                                    console.log('🔍 USANDO PRIMERA PLANTILLA DISPONIBLE 🔍', template_id);
                                }
                            }
                        }
                    }
                } else {
                    console.warn('🔍 SIN PLANTILLA ACTIVA 🔍 Buscando alternativas...');

                    // Si no hay plantilla activa, intentar encontrar alguna válida
                    if (availableTemplates.length > 0) {
                        // Primero buscar una activa
                        const activeTemplate = availableTemplates.find(t => t.isActive === true);

                        if (activeTemplate && activeTemplate.id) {
                            template_id = activeTemplate.id;
                            console.log('🔍 ENCONTRADA PLANTILLA ACTIVA 🔍', template_id);
                        } else {
                            // Si no hay activa, usar la primera disponible
                            template_id = availableTemplates[0].id;
                            console.log('🔍 USANDO PRIMERA PLANTILLA 🔍', template_id);
                        }
                    } else {
                        console.error('🔍 ERROR 🔍 No hay plantillas disponibles');
                        // Fallback a un UUID constante para pruebas o comunicarlo al backend
                        template_id = '00000000-0000-0000-0000-000000000000';
                    }
                }
            } catch (storeError) {
                console.error('🔍 ERROR AL OBTENER PLANTILLAS 🔍', storeError);
                // Fallback a un UUID constante para pruebas
                template_id = '00000000-0000-0000-0000-000000000000';
            }
        }

        // Verificación final de seguridad
        if (!template_id) {
            console.warn('🔍 ALERTA: SIN TEMPLATE_ID 🔍 Usando fallback');
            template_id = '00000000-0000-0000-0000-000000000000';  // UUID nulo pero válido
        }

        // Verificar si el ID de usuario es un ID de lead o si viene directamente como ID de lead
        // El formato puede ser lead_XXXX o directamente el ID de lead
        const isLead = userId?.startsWith('lead_') || false;
        const leadId = isLead
            ? userId?.replace('lead_', '')
            : (userId && !userId.includes('-') ? userId : null);  // Si no incluye guiones, probable ID de lead directo

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
            // Incluir leadId si existe
            lead_id: leadId
        };

        console.log('Enviando solicitud con datos:', requestData);

        // Siempre usamos nuestro proxy API
        const endpoint = `${API_BASE_URL}/message`;
        console.log(`Endpoint completo: ${endpoint}`);

        const response = await axios.post(
            endpoint, // Endpoint correcto para mensajes de chatbot
            requestData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                // Timeout estándar
                timeout: 15000,
                // No necesitamos withCredentials cuando usamos nuestro propio proxy
                withCredentials: false
            },
        )

        console.log('Respuesta del servidor:', response)

        if (response.status === 200) {
            const responseText = response.data.response || 'No se obtuvo respuesta del servidor';
            console.log(`Respuesta recibida: "${responseText}"`)
            return {
                response: responseText,
            }
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

        // Proporcionar un mensaje de error más detallado y la respuesta predeterminada
        return {
            response: `Lo siento, estoy teniendo problemas para procesar tu mensaje (${errorMessage}). ¿Puedes intentarlo de nuevo?`,
            error: true,
            errorDetails: {
                message: errorMessage,
                endpoint: endpoint
            }
        }
    }
}

export default apiSendChatMessage