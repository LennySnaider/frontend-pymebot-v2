/**
 * frontend/src/services/ChatService/apiSendMessage.ts
 * Servicio para enviar mensajes en conversaciones
 * @version 1.0.0
 * @updated 2025-04-16
 */

/**
 * Envía un mensaje en una conversación
 */
const apiSendMessage = async (data: any) => {
    // En implementación real, aquí se haría una llamada a la API
    // return await http.post('/api/chat/message', data)
    
    // Simulación
    console.log('Enviando mensaje (simulación):', data)
    return Promise.resolve({ success: true })
}

export default apiSendMessage