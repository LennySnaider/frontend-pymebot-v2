/**
 * frontend/src/services/ChatService/apiGetChatTemplates.ts
 * Servicio para obtener plantillas de chatbot disponibles
 * @version 1.2.0
 * @updated 2025-05-07
 */

import axios from 'axios'
import { ChatTemplate } from '@/app/(protected-pages)/concepts/marketing/chat/_components/TemplateSelector'

// Plantillas por defecto para usar cuando no hay conectividad
const DEFAULT_TEMPLATES: ChatTemplate[] = [
    {
        id: 'default-template-1',
        name: 'Asistente de Ventas',
        description: 'Plantilla optimizada para atención al cliente y ventas',
        isActive: true,
        isEnabled: true,
        avatarUrl: '/img/avatars/thumb-2.jpg'
    },
    {
        id: 'default-template-2',
        name: 'Atención General',
        description: 'Respuestas a preguntas frecuentes y soporte básico',
        isActive: true,
        isEnabled: true,
        avatarUrl: '/img/avatars/thumb-4.jpg'
    },
    {
        id: 'default-template-3',
        name: 'Asistente Técnico',
        description: 'Soporte técnico y resolución de problemas',
        isActive: true,
        isEnabled: true,
        avatarUrl: '/img/avatars/thumb-7.jpg'
    }
];

/**
 * Obtiene la lista de plantillas de chatbot disponibles
 * @returns Promesa con la lista de plantillas
 */
const apiGetChatTemplates = async (): Promise<ChatTemplate[]> => {
    // Para desarrollo local, usar plantillas por defecto sin hacer llamada a API
    // Esto evita errores de red en entornos de desarrollo
    if (process.env.NODE_ENV === 'development') {
        console.info('Usando plantillas predeterminadas en entorno de desarrollo');
        return Promise.resolve(DEFAULT_TEMPLATES);
    }
    
    try {
        // En ambiente de producción, usar la URL relativa para evitar problemas de CORS
        // y adaptarse automáticamente al dominio actual
        const response = await axios.get(
            '/api/chatbot/public-templates',
            { 
                timeout: 5000,  // Aumentar timeout para redes más lentas
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            }
        )

        if (response.data && response.data.success) {
            return response.data.templates as ChatTemplate[];
        } else {
            console.warn(
                'Respuesta inválida del API al obtener plantillas, usando plantillas por defecto',
                response.data?.error,
            );
            return DEFAULT_TEMPLATES;
        }
    } catch (error) {
        console.warn('Error al obtener plantillas desde API, usando plantillas por defecto:', error);
        return DEFAULT_TEMPLATES;
    }
}

export default apiGetChatTemplates