/**
 * frontend/src/services/ChatService/apiSetActiveTemplate.ts
 * Servicio para establecer la plantilla activa de chatbot
 * @version 1.0.0
 * @updated 2025-04-26
 */

import axios from 'axios'

/**
 * Establece la plantilla de chatbot activa
 * @param templateId ID de la plantilla a activar
 * @returns Promesa con el resultado de la operación
 */
const apiSetActiveTemplate = async (templateId: string): Promise<boolean> => {
    try {
        const response = await axios.post('/api/templates/set-active', {
            templateId,
        })
        return response.data.success
    } catch (error) {
        console.error('Error al establecer plantilla activa:', error)
        return false
    }
}

export default apiSetActiveTemplate
