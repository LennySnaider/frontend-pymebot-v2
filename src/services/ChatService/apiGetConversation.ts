/**
 * frontend/src/services/ChatService/apiGetConversation.ts
 * Servicio para obtener conversaciones de chat
 * @version 1.0.0
 * @updated 2025-04-16
 */

/**
 * Obtiene una conversación específica por ID
 * ACTUALIZADO: No usar datos mock
 */
const apiGetConversation = async <T>({ id }: { id: string }): Promise<T> => {
    try {
        // Llamar a la API real
        const response = await fetch(`/api/chat/conversation/${id}`)
        
        if (!response.ok) {
            throw new Error('Error al obtener la conversación')
        }
        
        const data = await response.json()
        return data as T
    } catch (error) {
        console.error('Error obteniendo conversación:', error)
        throw error
    }
}

export default apiGetConversation