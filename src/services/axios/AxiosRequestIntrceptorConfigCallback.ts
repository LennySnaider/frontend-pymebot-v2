import type { InternalAxiosRequestConfig } from 'axios'

const AxiosRequestIntrceptorConfigCallback = (
    config: InternalAxiosRequestConfig,
) => {
    /** handle config mutatation here before request to server */
    
    // Asegurarnos de tener headers configurados
    if (!config.headers) {
        config.headers = {};
    }
    
    // Asegurar que las solicitudes que tienen FormData se manejen adecuadamente
    if (config.data && config.data instanceof FormData) {
        // No establecer el Content-Type para FormData - Axios lo hará automáticamente con el boundary correcto
        // Pero añadir otros headers útiles
        config.headers['Accept'] = 'application/json';
        
        // Evitar que los datos se transformen
        config.transformRequest = (data, headers) => {
            // Eliminar Content-Type configurado automáticamente para evitar duplicados
            delete headers!['Content-Type'];
            // Devolver los datos sin transformar
            return data;
        };
        
        // Asegurarnos que las solicitudes de FormData no tengan un timeout demasiado corto 
        // para archivos grandes
        if (!config.timeout || config.timeout < 60000) {
            config.timeout = 60000; // 60 segundos mínimo para uploads
        }
        
        console.log('Interceptor: Configurando solicitud FormData para upload');
    }
    
    return config
}

export default AxiosRequestIntrceptorConfigCallback
