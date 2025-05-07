/**
 * frontend/src/services/ChatService/apiToggleMuteChat.ts
 * Servicio para silenciar/activar notificaciones de chat
 * @version 1.0.0
 * @updated 2025-04-16
 */

/**
 * Silencia o activa las notificaciones de un chat
 */
const apiToggleMuteChat = async (id: string, muted: boolean) => {
    // En implementación real, aquí se haría una llamada a la API
    // return await http.post(`/api/chat/mute/${id}`, { muted })
    
    // Simulación
    console.log(`${muted ? 'Silenciando' : 'Activando'} notificaciones para el chat ${id} (simulación)`)
    return Promise.resolve({ success: true, muted })
}

export default apiToggleMuteChat