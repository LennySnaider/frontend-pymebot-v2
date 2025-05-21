/**
 * backend/src/server/actions/getChatList.ts
 * Acción del servidor para obtener la lista de chats del usuario actual
 * @version 1.2.0
 * @updated 2025-06-05
 */

import { auth } from '@/auth'

/**
 * Obtiene la lista de chats para el usuario actual
 * ACTUALIZADO: Ya no usa datos mock
 */
const getChatList = async () => {
    try {
        // Esta función no debe ser utilizada ya que getChatListFromLeads es la implementación correcta
        console.warn('getChatList está deprecado. Usar getChatListFromLeads en su lugar.')
        
        // Retornar array vacío para evitar datos fantasmas
        return []
    } catch (error) {
        console.error('Error obteniendo lista de chats:', error)
        return []
    }
}

export default getChatList
