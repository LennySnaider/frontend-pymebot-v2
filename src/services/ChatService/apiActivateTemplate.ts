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
        
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3090';
        
        const response = await fetch(`${BACKEND_URL}/api/text/templates/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: templateId,
                tenant_id: tenantId
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log(`Plantilla ${templateId} activada correctamente. Activation ID: ${data.activationId}`);
            return { success: true, activationId: data.activationId };
        } else {
            console.error('Error en la respuesta del API:', data.error || 'Error desconocido');
            return { success: false, error: data.error || 'Error desconocido' };
        }
    } catch (error) {
        console.error('Error al activar plantilla:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error de conexión' };
    }
}

export default apiActivateTemplate;