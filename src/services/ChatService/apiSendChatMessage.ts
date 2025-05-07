/**
 * frontend/src/services/ChatService/apiSendChatMessage.ts
 * Servicio para enviar mensajes de chat de texto sin utilizar procesamiento de voz
 * @version 1.0.0
 * @updated 2025-04-26
 */

import axios from 'axios'
import { getOrCreateSessionId, getOrCreateUserId } from './utils'
import { useChatStore } from '@/app/(protected-pages)/concepts/marketing/chat/_store/chatStore'

// URL base para las APIs
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3090/api'

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
        
        // Obtener la plantilla activa del store si no se proporciona
        let template_id = templateId
        if (!template_id) {
            // Si no hay template_id, usar el predeterminado
            template_id = 'default-template';
            console.log('Usando plantilla predeterminada: default-template');
        }

        console.log(`Enviando mensaje: "${text}"`)
        console.log(`Usuario: ${currentUserId}`)
        console.log(`Sesión: ${sessionId}`)
        console.log(`Tenant: ${currentTenantId}`)
        console.log(`Bot: ${currentBotId}`)
        console.log(`Plantilla: ${template_id || 'ninguna'}`)

        // Llamamos al endpoint de texto en lugar del endpoint de voz
        const response = await axios.post(
            `${API_BASE_URL}/text/chat`,
            {
                text: text,
                user_id: currentUserId,
                session_id: sessionId,
                tenant_id: currentTenantId,
                bot_id: currentBotId,
                template_id: template_id, // Añadir template_id a la solicitud
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )

        if (response.status === 200) {
            console.log(`Respuesta recibida: "${response.data.response}"`)
            return {
                response: response.data.response,
            }
        } else {
            throw new Error(
                `Error en la respuesta: ${response.status} ${response.statusText}`,
            )
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al enviar mensaje:', error);
        
        // Proporcionar un mensaje de error más detallado y la respuesta predeterminada
        return {
            response: `Lo siento, estoy teniendo problemas para procesar tu mensaje (${errorMessage}). ¿Puedes intentarlo de nuevo?`,
        }
    }
}

export default apiSendChatMessage
