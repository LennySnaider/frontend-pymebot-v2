import type { AxiosError } from 'axios'

const AxiosResponseIntrceptorErrorCallback = (error: AxiosError) => {
    /** handle response error here */
    // Registro de error mejorado con más detalles según el tipo de error
    
    // Errores con respuesta del servidor (errores HTTP como 4xx, 5xx)
    if (error.response) {
        console.error('Error de respuesta HTTP:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url || 'URL desconocida',
            method: error.config?.method?.toUpperCase() || 'Método desconocido',
            headers: error.response.headers
        });
        
        // Error específico para problemas de envío de audio
        if (error.config?.data instanceof FormData && 
            error.config?.url?.includes('/voice/chat')) {
            console.error('Error en envío de audio al backend. Verifica la conexión y tamaño de archivo.');
        }
    } 
    // Errores sin respuesta (problemas de red, conexión rechazada, timeout)
    else if (error.request) {
        console.error('Error de red (sin respuesta):', {
            url: error.config?.url || 'URL desconocida',
            method: error.config?.method?.toUpperCase() || 'Método desconocido',
            timeoutMs: error.config?.timeout,
            errorCode: error.code,
            errorMessage: error.message
        });
        
        // Mensaje específico para timeouts
        if (error.code === 'ECONNABORTED') {
            console.error('La solicitud excedió el tiempo límite. Posible problema de conexión o archivo demasiado grande.');
        }
    } 
    // Otros errores (problemas de configuración, etc.)
    else {
        console.error('Error en la solicitud:', {
            message: error.message,
            code: error.code,
            config: error.config
        });
    }
}

export default AxiosResponseIntrceptorErrorCallback
