/**
 * server/actions/getConversation.ts
 * Acción del servidor para obtener una conversación específica por ID.
 * 
 * @version 1.0.0
 * @updated 2025-04-16
 */

import { conversationList } from '@/mock/data/chatData'

const getConversation = async (id: string) => {
    try {
        // En una implementación real, aquí consultaríamos a la base de datos
        // usando el ID del chat y posiblemente filtrando por tenant_id
        
        // Para la versión de mock, buscamos en nuestros datos de prueba
        const conversation = conversationList.find(item => item.id === id)
        
        if (!conversation) {
            // Si no encontramos la conversación, devolvemos una vacía
            return {
                id,
                conversation: []
            }
        }
        
        return conversation
    } catch (error) {
        console.error('Error getting conversation:', error)
        // En caso de error, devolvemos una conversación vacía
        return {
            id,
            conversation: []
        }
    }
}

export default getConversation