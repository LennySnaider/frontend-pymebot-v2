/**
 * frontend/src/services/ChatService/apiClearChatHistory.ts
 * Servicio para limpiar el historial de conversación de un usuario
 * @version 1.0.0
 * @updated 2025-04-26
 */

import { sessionStore } from './utils'

/**
 * Limpia el historial de conversación (reinicia la sesión)
 * @param userId ID del usuario
 */
const apiClearChatHistory = (userId: string): void => {
    console.log(`Limpiando historial de chat para usuario: ${userId}`)

    if (sessionStore[userId]) {
        delete sessionStore[userId]
        console.log(`Sesión eliminada para usuario: ${userId}`)
    } else {
        console.log(`No se encontró sesión para el usuario: ${userId}`)
    }
}

export default apiClearChatHistory
