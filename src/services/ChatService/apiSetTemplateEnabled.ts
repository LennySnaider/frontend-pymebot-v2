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
        // Agregar timeout a axios
        const response = await axios.post('/api/templates/set-enabled', {
            templateId,
            isEnabled,
        }, {
            timeout: 15000, // 15 segundos timeout
        })
        
        // Verificar que la respuesta tenga el formato esperado
        if (response.data && typeof response.data.success === 'boolean') {
            return { success: response.data.success }
        } else {
            console.error('Respuesta inválida del servidor:', response.data)
            return { success: false, errorMessage: 'Respuesta inválida del servidor' }
        }
    } catch (error) {
        console.error(
            'Error al establecer el estado "enabled" de la plantilla:',
            error,
        )

        // Extraer detalles del error con mejor manejo
        let errorMessage = 'Error desconocido al procesar la solicitud';

        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Timeout: La operación tardó demasiado tiempo';
            } else if (error.response) {
                // Error de respuesta del servidor
                const status = error.response.status;
                const data = error.response.data;
                
                if (status === 401) {
                    errorMessage = 'No autorizado. Inicie sesión nuevamente.';
                } else if (status === 403) {
                    errorMessage = 'No tiene permisos para realizar esta acción.';
                } else if (status === 404) {
                    errorMessage = 'Plantilla no encontrada.';
                } else if (status >= 500) {
                    errorMessage = 'Error interno del servidor. Intente más tarde.';
                } else if (data && data.error) {
                    errorMessage = data.error;

                    // Si hay detalles adicionales, incluirlos
                    if (data.details) {
                        if (typeof data.details === 'string') {
                            errorMessage += `: ${data.details}`;
                        } else {
                            errorMessage += `: ${JSON.stringify(data.details)}`;
                        }
                    }
                } else {
                    errorMessage = `Error HTTP ${status}`;
                }
            } else if (error.request) {
                // Error de red
                errorMessage = 'Error de conexión. Verifique su conexión a internet.';
            } else {
                // Otro tipo de error
                errorMessage = error.message || 'Error al configurar la solicitud';
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return { success: false, errorMessage }
    }
}

export default apiSetTemplateEnabled
