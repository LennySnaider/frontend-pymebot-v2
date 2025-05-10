/**
 * frontend/src/services/ChatService/apiGetChatTemplates.ts
 * Servicio para obtener plantillas de chatbot disponibles
 * @version 1.5.0
 * @updated 2025-09-05
 */

// IMPORTANTE: NO IMPORTAR AXIOS aquí - solo usar fetch para SSR
// Se cambió el tipo ChatTemplate para una mejor compatibilidad con SSR
// Definimos localmente el tipo para no importar del módulo chat que tiene problemas con SSR
export interface ChatTemplate {
    id: string
    name: string
    description?: string
    avatarUrl?: string
    isActive: boolean
    isEnabled?: boolean
    tokenCost?: number
    flowId?: string | null
}

/**
 * Obtiene la lista de plantillas de chatbot disponibles para el tenant actual
 * @returns Promesa con la lista de plantillas
 * @throws Nunca lanza excepciones, solo devuelve array vacío en caso de error
 */
const apiGetChatTemplates = async (): Promise<ChatTemplate[]> => {
    // Verificación de seguridad para SSR
    if (typeof window === 'undefined') {
        console.log('apiGetChatTemplates: Ejecutando en el servidor, devolviendo array vacío');
        return [];
    }

    try {
        console.info('Obteniendo plantillas desde API...');

        // Usar URL relativa para adaptarse automáticamente al dominio actual
        const response = await fetch('/api/chatbot/public-templates', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            console.warn('Error en respuesta API:', response.status, response.statusText);
            return [];
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.success && Array.isArray(jsonData.templates)) {
            const templates = jsonData.templates;
            console.log('Plantillas obtenidas desde API:', templates);

            if (templates.length > 0) {
                return templates;
            } else {
                console.warn('API devolvió un array vacío de plantillas');
                return [];
            }
        } else {
            console.warn(
                'Respuesta inválida del API al obtener plantillas',
                jsonData?.error,
            );
            return [];
        }
    } catch (error) {
        console.warn('Error al obtener plantillas desde API:', error);
        return [];
    }
}

export default apiGetChatTemplates