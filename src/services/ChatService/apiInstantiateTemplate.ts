/**
 * frontend/src/services/ChatService/apiInstantiateTemplate.ts
 * Servicio para instanciar una plantilla de chatbot para el tenant actual
 * @version 1.2.0
 * @updated 2025-04-27
 */

import axios from 'axios'

interface InstantiateResponse {
    success: boolean
    id?: string // ID del nuevo flujo creado
    message?: string
    error?: string
    details?: string
}

/**
 * Instancia una plantilla de chatbot específica para el tenant actual
 * @param templateId ID de la plantilla a instanciar
 * @param customName Nombre personalizado para el flujo (opcional)
 * @returns Promesa con el ID del nuevo flujo creado o null si falla
 */
const apiInstantiateTemplate = async (
    templateId: string,
    customName?: string,
): Promise<string | null> => {
    try {
        console.log(`Intentando instanciar plantilla ${templateId}${customName ? ` con nombre "${customName}"` : ''}...`);
        
        // Llamar al endpoint del backend para instanciar la plantilla
        const response = await axios.post<InstantiateResponse>(
            `http://localhost:3090/api/templates/${templateId}/instantiate`,
            { customName }, // Enviamos el nombre personalizado si existe
            {
                // Añadimos un timeout más largo para operaciones que pueden tardar
                timeout: 25000,
                // Aseguramos que se envían correctamente las cookies de autenticación
                withCredentials: true,
                // Añadimos headers para ayudar con la depuración
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Version': '1.2.0',
                    'X-Client-Name': 'AgentProp Frontend'
                }
            }
        );

        if (response.data && response.data.success && response.data.id) {
            console.log(
                `Plantilla ${templateId} instanciada correctamente como flujo ${response.data.id}`,
            );
            return response.data.id; // Devuelve el ID del nuevo flujo
        } else {
            console.error(
                'Error en la respuesta del API al instanciar plantilla:',
                response.data?.error || response.data?.message,
                response.data?.details ? `Detalles: ${response.data.details}` : ''
            );
            return null;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Es un error específico de Axios
            if (error.response) {
                // El servidor respondió con un código de error
                console.error('Error al instanciar plantilla desde API:', 
                    `Status: ${error.response.status}`, 
                    `Mensaje: ${error.response.data?.error || error.response.data?.message || 'Error desconocido'}`,
                    error.response.data?.details ? `Detalles: ${error.response.data.details}` : ''
                );
                
                // Información adicional para diagnóstico
                if (error.response.status === 500) {
                    console.error('Error 500 del servidor. Posiblemente hay un problema en el backend con la estructura de la plantilla.');
                } else if (error.response.status === 404) {
                    console.error(`La plantilla con ID ${templateId} no se encontró en el servidor.`);
                } else if (error.response.status === 401 || error.response.status === 403) {
                    console.error('Error de autenticación o permisos. Verifica que estás autenticado correctamente.');
                }
            } else if (error.request) {
                // La solicitud se realizó pero no se recibió respuesta
                console.error(
                    'Error al instanciar plantilla: No se recibió respuesta del servidor.',
                    'Verifica que el servidor esté ejecutándose en http://localhost:3090'
                );
            } else {
                // Algo ocurrió al configurar la solicitud
                console.error('Error al configurar la solicitud:', error.message);
            }
            
            // Información adicional sobre el error para depuración
            if (error.config) {
                console.log('Configuración de la solicitud fallida:', {
                    url: error.config.url,
                    method: error.config.method,
                    headers: error.config.headers,
                    timeout: error.config.timeout,
                    withCredentials: error.config.withCredentials
                });
            }
        } else {
            // Error genérico
            console.error('Error inesperado al instanciar plantilla:', error);
        }
        return null;
    }
}

export default apiInstantiateTemplate
