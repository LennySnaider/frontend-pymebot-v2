/**
 * frontend/src/services/ChatService/apiActivateFlow.ts
 * Servicio para activar un flujo de chatbot instanciado
 * @version 1.1.0
 * @updated 2025-04-27
 */

import axios from 'axios'

/**
 * Activa un flujo de chatbot específico para el tenant actual
 * @param flowId ID del flujo a activar
 * @returns Promesa con el resultado de la operación
 */
const apiActivateFlow = async (flowId: string): Promise<boolean> => {
    try {
        console.log(`Intentando activar flujo con ID: ${flowId}...`)
        
        // Obtener la URL base de forma dinámica (API interna)
        // Usamos la URL relativa para que funcione en cualquier entorno
        const apiBasePath = '/api/chatbot';

        // Llamar al endpoint correcto: POST /api/chatbot/flows/:id/activate
        const response = await axios.post(
            `${apiBasePath}/flows/${flowId}/activate`,
            {}, // No se necesita enviar flowId en el body si está en la URL
            {
                // Añadimos un timeout más largo para operaciones que pueden tardar
                timeout: 15000,
                // Añadimos headers para ayudar con la depuración
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Version': '1.1.0',
                    'X-Client-Name': 'AgentProp Frontend'
                }
            }
        )

        if (response.data && response.data.success) {
            console.log(`Flujo ${flowId} activado correctamente`)
            return true
        } else {
            console.error(
                'Error en la respuesta del API al activar flujo:',
                response.data?.error || 'Error desconocido'
            )
            return false
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Es un error específico de Axios
            if (error.response) {
                // El servidor respondió con un código de error
                console.error('Error al activar flujo desde API:', 
                    `Status: ${error.response.status}`, 
                    `Mensaje: ${error.response.data?.error || error.response.data?.message || 'Error desconocido'}`,
                    error.response.data?.details ? `Detalles: ${error.response.data.details}` : ''
                )
                
                // Información adicional para diagnóstico
                if (error.response.status === 403) {
                    console.error('Error de permisos. Verifica que estás autenticado correctamente y tienes permisos para activar este flujo.');
                } else if (error.response.status === 404) {
                    console.error(`El flujo con ID ${flowId} no se encontró en el servidor.`);
                } else if (error.response.status === 401) {
                    console.error('Error de autenticación. Verifica que estás autenticado correctamente.');
                }
            } else if (error.request) {
                // La solicitud se realizó pero no se recibió respuesta
                console.error(
                    'Error al activar flujo: No se recibió respuesta del servidor.',
                    'Verifica que el servidor esté ejecutándose en http://localhost:3090'
                )
            } else {
                // Algo ocurrió al configurar la solicitud
                console.error('Error al configurar la solicitud:', error.message)
            }
        } else {
            // Error genérico
            console.error('Error inesperado al activar flujo:', error)
        }
        return false
    }
}

export default apiActivateFlow
