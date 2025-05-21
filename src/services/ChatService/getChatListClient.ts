/**
 * frontend/src/services/ChatService/getChatListClient.ts
 * Servicio para obtener la lista de chats desde el cliente
 * @version 1.0.0
 * @updated 2025-04-16
 */

/**
 * Obtiene la lista de chats para el usuario actual
 * ACTUALIZADO: No usar datos mock
 */
const getChatListClient = async () => {
    try {
        // Llamar a la API real para obtener la lista de chats
        const response = await fetch('/api/chat/list')
        
        if (!response.ok) {
            throw new Error('Error al obtener la lista de chats')
        }
        
        const data = await response.json()
        return data || []
    } catch (error) {
        console.warn('Error obteniendo datos de chat:', error)
        // Devolver array vacío en caso de error
        return []
    }
}

export default getChatListClient