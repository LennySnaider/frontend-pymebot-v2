/**
 * frontend/src/services/ChatService/apiGetConversation.ts
 * Servicio para obtener conversaciones de chat
 * @version 1.0.0
 * @updated 2025-04-16
 */

import { getMockConversation } from './mockChatData'

/**
 * Obtiene una conversación específica por ID
 */
const apiGetConversation = async <T>({ id }: { id: string }): Promise<T> => {
    // En implementación real, aquí se haría una llamada a la API
    // return await http.get(`/api/chat/conversation/${id}`)
    
    // Simulación con datos mock
    return Promise.resolve(getMockConversation(id) as unknown as T)
}

export default apiGetConversation