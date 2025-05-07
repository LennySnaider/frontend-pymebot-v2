/**
 * frontend/src/services/ChatService/apiSetTemplateEnabled.ts
 * Servicio para establecer el estado "enabled" de una plantilla de chatbot
 * @version 1.0.0
 * @updated 2025-04-26
 */

import axios from 'axios'

/**
 * Establece el estado "enabled" de una plantilla de chatbot
 * @param templateId ID de la plantilla a actualizar
 * @param isEnabled Nuevo estado "enabled" de la plantilla
 * @returns Promesa con el resultado de la operación
 */
const apiSetTemplateEnabled = async (
    templateId: string,
    isEnabled: boolean,
): Promise<boolean> => {
    try {
        const response = await axios.post('/api/templates/set-enabled', {
            templateId,
            isEnabled,
        })
        return response.data.success
    } catch (error) {
        console.error(
            'Error al establecer el estado "enabled" de la plantilla:',
            error,
        )
        return false
    }
}

export default apiSetTemplateEnabled
