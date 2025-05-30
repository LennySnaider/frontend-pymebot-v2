/**
 * frontend/src/services/ChatService/apiActivateTemplate.ts
 * Servicio para activar una plantilla de chatbot
 * @version 1.0.0
 * @created 2025-05-16
 */

/**
 * Activa una plantilla de chatbot para el tenant actual
 * @param templateId ID de la plantilla a activar
 * @param tenantId ID del tenant
 * @returns Promesa con el resultado de la operación
 */
const apiActivateTemplate = async (templateId: string, tenantId: string): Promise<{ success: boolean; activationId?: string; error?: string }> => {
    try {
        console.log(`Activando plantilla ${templateId} para tenant ${tenantId}...`);
        
        // Mejorar detección de URL del backend
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
                           (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
                               ? 'http://localhost:3090' 
                               : 'http://localhost:3090'); // Cambiar por la URL de producción
        
        console.log('🌐 URL del backend detectada:', BACKEND_URL);
        
        // Crear controlador de abort para timeout manual
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos
        
        const response = await fetch(`${BACKEND_URL}/api/text/templates/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: templateId,
                tenant_id: tenantId
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Verificar si la respuesta es válida
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP ${response.status}: ${errorText}`);
            return { 
                success: false, 
                error: `Error del servidor (${response.status}): ${errorText || 'Respuesta inválida'}` 
            };
        }

        // Intentar parsear JSON
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('Error al parsear respuesta JSON:', parseError);
            return { 
                success: false, 
                error: 'Respuesta del servidor no válida (no es JSON)' 
            };
        }

        if (data.success) {
            console.log(`Plantilla ${templateId} activada correctamente. Activation ID: ${data.activationId}`);
            return { success: true, activationId: data.activationId };
        } else {
            console.error('Error en la respuesta del API:', data.error || 'Error desconocido');
            return { success: false, error: data.error || 'Error desconocido en la activación' };
        }
    } catch (error) {
        console.error('Error al activar plantilla:', error);
        
        // Manejo específico de errores
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return { success: false, error: 'Timeout: La operación tardó demasiado tiempo' };
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                return { success: false, error: 'Error de conexión. Verifique que el backend esté funcionando.' };
            } else {
                return { success: false, error: `Error: ${error.message}` };
            }
        }
        
        return { success: false, error: 'Error desconocido en la conexión' };
    }
}

export default apiActivateTemplate;