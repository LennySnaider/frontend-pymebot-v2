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
 * @returns Promesa con el resultado de la operación y mensaje de error si ocurre
 */
const apiSetTemplateEnabled = async (
    templateId: string,
    isEnabled: boolean,
): Promise<{success: boolean, errorMessage?: string}> => {
    try {
        const response = await axios.post('/api/chatbot/templates/set-enabled', {
            templateId,
            isEnabled,
        })
        return { success: response.data.success }
    } catch (error) {
        console.error(
            'Error al establecer el estado "enabled" de la plantilla:',
            error,
        )

        // Extraer detalles del error si están disponibles
        let errorMessage = 'Error desconocido al procesar la solicitud';

        if (axios.isAxiosError(error) && error.response) {
            const data = error.response.data;
            if (data && data.error) {
                errorMessage = data.error;

                // Si hay detalles adicionales, incluirlos
                if (data.details) {
                    if (typeof data.details === 'string') {
                        errorMessage += `: ${data.details}`;
                    } else {
                        errorMessage += `: ${JSON.stringify(data.details)}`;
                    }
                }
            }
        }

        return { success: false, errorMessage }
    }
}

export default apiSetTemplateEnabled
