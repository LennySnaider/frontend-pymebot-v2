/**
 * frontend/src/services/ChatService/apiMarkAsRead.ts
 * Servicio para marcar conversaciones como leídas
 * @version 1.0.0
 * @updated 2025-04-16
 */

/**
 * Marca una conversación como leída
 */
const apiMarkAsRead = async (id: string) => {
    // En implementación real, aquí se haría una llamada a la API
    // return await http.post(`/api/chat/read/${id}`)
    
    // Simulación
    console.log(`Marcando conversación ${id} como leída (simulación)`)
    return Promise.resolve({ success: true })
}

export default apiMarkAsRead