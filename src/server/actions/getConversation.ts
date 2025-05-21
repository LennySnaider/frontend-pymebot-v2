/**
 * server/actions/getConversation.ts
 * Acción del servidor para obtener una conversación específica por ID.
 * 
 * @version 1.0.0
 * @updated 2025-04-16
 */

const getConversation = async (id: string) => {
    try {
        // Esta función ya no usa datos mock
        // En caso de necesitarla, debería conectarse a la base de datos real
        console.warn('getConversation: Esta función necesita ser actualizada para usar datos reales')
        
        // Por ahora retorna una conversación vacía
        return {
            id,
            conversation: []
        }
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