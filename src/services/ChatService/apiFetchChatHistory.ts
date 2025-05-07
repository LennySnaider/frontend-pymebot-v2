/**
 * frontend/src/services/ChatService/apiFetchChatHistory.ts
 * Servicio para obtener el historial de mensajes de una conversación
 * @version 1.0.0
 * @updated 2025-04-26
 */

import { v4 as uuidv4 } from 'uuid'

export interface ChatMessage {
    id: string
    content: string
    sender: {
        id: string
        name: string
        avatarImageUrl?: string
    }
    timestamp: Date
    isMyMessage: boolean
}

/**
 * Obtiene el historial de mensajes para una conversación
 * @param conversationId ID de la conversación
 * @returns Historial de mensajes
 */
const apiFetchChatHistory = async (
    conversationId: string,
): Promise<ChatMessage[]> => {
    // Aquí harías una llamada real a la API
    // Por ahora simulamos algunos mensajes
    console.log(`Obteniendo historial para conversación: ${conversationId}`)

    const currentTime = new Date()
    const tenMinutesAgo = new Date(currentTime.getTime() - 10 * 60000)
    const twentyMinutesAgo = new Date(currentTime.getTime() - 20 * 60000)

    // En una implementación real, este ID se usaría para filtrar mensajes
    // Para la simulación, generamos mensajes de demostración
    const demoMessages: ChatMessage[] = [
        {
            id: uuidv4(),
            content: 'Hola, ¿en qué puedo ayudarte hoy?',
            sender: {
                id: 'bot-1',
                name: 'Asistente PYMEBOT',
                avatarImageUrl: '/img/avatars/thumb-2.jpg',
            },
            timestamp: twentyMinutesAgo,
            isMyMessage: false,
        },
        {
            id: uuidv4(),
            content:
                'Me gustaría obtener información sobre sus servicios de marketing digital',
            sender: {
                id: 'user-1',
                name: 'Tú',
                avatarImageUrl: '/img/avatars/thumb-1.jpg',
            },
            timestamp: tenMinutesAgo,
            isMyMessage: true,
        },
        {
            id: uuidv4(),
            content:
                'Por supuesto, ofrecemos servicios completos de marketing digital, incluyendo SEO, SEM, gestión de redes sociales y email marketing. ¿Hay algún área específica que te interese?',
            sender: {
                id: 'bot-1',
                name: 'Asistente PYMEBOT',
                avatarImageUrl: '/img/avatars/thumb-2.jpg',
            },
            timestamp: new Date(tenMinutesAgo.getTime() + 30000),
            isMyMessage: false,
        },
    ]

    return demoMessages
}

export default apiFetchChatHistory
