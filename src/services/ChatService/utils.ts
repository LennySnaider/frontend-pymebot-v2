/**
 * frontend/src/services/ChatService/utils.ts
 * Utilidades para los servicios de chat
 * @version 1.0.0
 * @updated 2025-04-26
 */

import { v4 as uuidv4 } from 'uuid'

// Almacenamiento en memoria para sesiones persistentes
export const sessionStore: { [key: string]: string } = {}
export const userStore: { [key: string]: string } = {}

/**
 * Obtiene o crea un ID de sesión para un usuario
 * @param userId ID del usuario
 * @returns ID de sesión
 */
export const getOrCreateSessionId = (userId: string): string => {
    if (!sessionStore[userId]) {
        // Generamos y guardamos un nuevo ID de sesión
        const newSessionId = uuidv4()
        sessionStore[userId] = newSessionId
        console.log(
            `Nueva sesión creada para usuario ${userId}: ${newSessionId}`,
        )
        return newSessionId
    }

    // Devolvemos el ID de sesión existente
    console.log(
        `Usando sesión existente para usuario ${userId}: ${sessionStore[userId]}`,
    )
    return sessionStore[userId]
}

/**
 * Obtiene o crea un ID de usuario si no existe
 * @param userId ID opcional del usuario actual
 * @returns ID de usuario garantizado
 */
export const getOrCreateUserId = (userId?: string): string => {
    const key = 'current-user'

    // Si se proporciona un userId específico, lo usamos directamente
    if (userId) {
        console.log(`Usando ID de usuario proporcionado: ${userId}`)
        return userId
    }

    // Si no hay un ID guardado, creamos uno nuevo
    if (!userStore[key]) {
        // Usar un número de teléfono formateado en vez de un UUID para que el backend pueda crear un lead
        const generatedPhone = `52559${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`
        userStore[key] = generatedPhone
        console.log(`Nuevo ID de usuario con formato de teléfono generado: ${generatedPhone}`)
        return generatedPhone
    }

    // Devolvemos el ID de usuario existente
    console.log(`Usando ID de usuario existente: ${userStore[key]}`)
    return userStore[key]
}
