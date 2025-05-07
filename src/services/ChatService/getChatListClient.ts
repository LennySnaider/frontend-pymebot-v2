/**
 * frontend/src/services/ChatService/getChatListClient.ts
 * Servicio para obtener la lista de chats desde el cliente
 * @version 1.0.0
 * @updated 2025-04-16
 */

import { mockData } from './mockChatData'

/**
 * Obtiene la lista de chats para el usuario actual
 * En modo desarrollo, simplemente devolvemos datos simulados
 * En producción, aquí se conectaría a una API real
 */
const getChatListClient = async () => {
    try {
        // En una implementación real, aquí se haría una llamada a la API
        // const response = await fetch('/api/chat/list')
        // return await response.json()
        
        // Por ahora, devolvemos datos simulados para desarrollo
        return mockData
    } catch (error) {
        console.warn('Error obteniendo datos de chat:', error)
        // Devolver array vacío en caso de error
        return []
    }
}

export default getChatListClient