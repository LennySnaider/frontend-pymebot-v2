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
    try {
        // URL del backend - ajusta el puerto si es necesario
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3090'
        
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: data.content || data.message,
                userId: data.leadId || data.userId || 'test-user',
                tenantId: data.tenantId || localStorage.getItem('tenantId') || 'test-tenant',
                conversationId: data.conversationId
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('Respuesta del backend:', result)
        
        return {
            success: true,
            data: result
        }
    } catch (error) {
        console.error('Error enviando mensaje:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

export default apiSendMessage