/**
 * /Users/masi/Documents/chatbot-builderbot-supabase/agentprop/src/services/VoiceService.ts
 *
 * Servicio para integración con el VoiceBot
 * Permite activar/desactivar plantillas, obtener estadísticas y gestionar configuraciones
 *
 * @version 1.0.0
 * @updated 2025-04-15
 */

import ApiService from './ApiService'
import { AxiosError, AxiosResponse } from 'axios' // Importar AxiosError y AxiosResponse
import type { AxiosRequestConfig } from 'axios'

// URL del servicio de VoiceBot
const VOICE_API_URL = process.env.NEXT_PUBLIC_VOICE_API_URL

// UUID del tenant predeterminado
const DEFAULT_TENANT_UUID = 'afa60b0a-3046-4607-9c48-266af6e1d322'

/**
 * Servicio para interactuar con la API del VoiceBot
 */
export const VoiceService = {
    /**
     * Método auxiliar para realizar peticiones GET
     */
    // Return the full AxiosResponse
    async get<T = unknown>(url: string): Promise<AxiosResponse<T>> {
        const config: AxiosRequestConfig = {
            method: 'GET',
            url,
        }
        return ApiService.fetchDataWithAxios<T>(config)
    },

    /**
     * Método auxiliar para realizar peticiones POST
     */
    // Return the full AxiosResponse
    async post<T = unknown, D = Record<string, unknown>>(
        url: string,
        data?: D,
    ): Promise<AxiosResponse<T>> {
        const config: AxiosRequestConfig = {
            method: 'POST',
            url,
            data,
        }
        return ApiService.fetchDataWithAxios<T>(config)
    },

    /**
     * Obtiene todas las plantillas disponibles
     * @returns Lista de plantillas
     */
    async getTemplates() {
        try {
            return await this.get(`${VOICE_API_URL}/api/templates`)
        } catch (error) {
            console.error('Error obteniendo plantillas de voz:', error)
            throw error
        }
    },

    /**
     * Obtiene una plantilla específica por ID
     * @param templateId - ID de la plantilla
     * @returns Detalles de la plantilla
     */
    async getTemplateById(templateId: string) {
        try {
            return await this.get(
                `${VOICE_API_URL}/api/templates/${templateId}`,
            )
        } catch (error) {
            console.error(
                `Error obteniendo plantilla de voz ${templateId}:`,
                error,
            )
            throw error
        }
    },

    /**
     * Activa una plantilla para un tenant específico
     * @param tenantId - ID del tenant
     * @param templateId - ID de la plantilla
     * @param config - Configuración personalizada (opcional)
     * @returns Detalles de la activación
     */
    async activateTemplate(tenantId: string, templateId: string, config = {}) {
        try {
            return await this.post(`${VOICE_API_URL}/api/templates/activate`, {
                tenantId,
                templateId,
                config,
            })
        } catch (error) {
            console.error(
                `Error activando plantilla de voz ${templateId} para tenant ${tenantId}:`,
                error,
            )
            throw error
        }
    },

    /**
     * Desactiva todas las plantillas para un tenant
     * @param tenantId - ID del tenant
     * @returns Resultado de la desactivación
     */
    async deactivateAllTemplates(tenantId: string) {
        try {
            return await this.post(
                `${VOICE_API_URL}/api/templates/deactivate`,
                {
                    tenantId,
                },
            )
        } catch (error) {
            console.error(
                `Error desactivando plantillas de voz para tenant ${tenantId}:`,
                error,
            )
            throw error
        }
    },

    /**
     * Obtiene la plantilla activa para un tenant
     * @param tenantId - ID del tenant
     * @returns Detalles de la plantilla activa o null si no hay
     */
    async getActiveTemplate(tenantId: string) {
        try {
            return await this.get(
                `${VOICE_API_URL}/api/templates/active/${tenantId}`,
            )
        } catch (error: unknown) {
            // Si no hay plantilla activa (404), devolver null
            if (
                error &&
                typeof error === 'object' &&
                'response' in error &&
                error.response &&
                typeof error.response === 'object' &&
                'status' in error.response &&
                error.response.status === 404
            ) {
                return null
            }
            console.error(
                `Error obteniendo plantilla activa para tenant ${tenantId}:`,
                error,
            )
            throw error
        }
    },

    /**
     * Obtiene la URL del widget de demo para incrustar en páginas web
     * @param tenantId - ID del tenant
     * @returns URL del widget
     */
    getWidgetUrl(tenantId: string): string {
        return `${VOICE_API_URL}/demo?tenant=${tenantId}`
    },

    /**
     * Obtiene el script para incrustar el widget en un sitio web
     * @param tenantId - ID del tenant
     * @returns Código HTML para incrustar
     */
    getEmbedCode(tenantId: string): string {
        return `<iframe src="${this.getWidgetUrl(tenantId)}" width="400" height="600" style="border:none;"></iframe>`
    },

    /**
     * Envía un mensaje (audio o texto) al endpoint de chat del VoiceBot.
     * @param data - Puede ser FormData (con un campo 'audio') o un objeto { text: string }
     * @returns La respuesta del backend
     */
    async sendChat<T = unknown>(
        data: FormData | { text: string },
        // Return the full AxiosResponse to allow header checking in the component
    ): Promise<AxiosResponse<T>> {
        const url = `${VOICE_API_URL}/api/voice/chat`

        // Si es FormData, asegurarnos de usar el tenant_id correcto
        if (data instanceof FormData) {
            // Comprobar si ya tiene tenant_id y eliminarlo para no duplicar
            try {
                data.delete('tenant_id')
            } catch (_e) {
                // Rename 'e' to '_e' as it's unused
                // Ignorar errores si no existe
            }

            // Añadir el tenant_id como UUID válido
            data.append('tenant_id', DEFAULT_TENANT_UUID) // UUID válido para tenant default
        }

        const config: AxiosRequestConfig = {
            // Ensure it's const
            method: 'POST',
            url,
            data,
            // Añadir timeout más largo para archivos grandes
            timeout: 60000, // 60 segundos
            // Asegurar que las credenciales se incluyan
            withCredentials: true,
            // Usar responseType: 'arraybuffer' para manejar correctamente tanto JSON como binarios (audio)
            responseType: 'arraybuffer',
            // Este tipo de respuesta nos permite manejar cualquier tipo de contenido y procesarlo según el Content-Type
        }

        // Si enviamos FormData (audio), necesitamos configurar explícitamente algunos headers
        if (data instanceof FormData) {
            config.headers = {
                // No establecer Content-Type para FormData y dejar que Axios lo configure con boundary
                Accept: 'application/json',
                // Importante: impedir que se transforme el FormData
                'X-Requested-With': 'XMLHttpRequest',
            }
        } else {
            // Si es texto, usar application/json y añadir tenant_id
            config.headers = { 'Content-Type': 'application/json' }
            // Only add tenant_id if it's the text object and doesn't already have it
            if (
                typeof data === 'object' &&
                data !== null &&
                !(data instanceof FormData) &&
                !('tenant_id' in data)
            ) {
                // Explicitly type data here for safety, assuming it's { text: string }
                const textData = data as { text: string }
                config.data = { ...textData, tenant_id: DEFAULT_TENANT_UUID } // Use config.data
            } else {
                config.data = data // Ensure original data is assigned if not modified
            }
        }

        try {
            // Usar directamente axios para mejor control del proceso
            console.log('Enviando solicitud al backend de voz:', {
                url,
                method: 'POST',
                dataType: data instanceof FormData ? 'FormData' : 'JSON',
                dataSize:
                    data instanceof FormData
                        ? '[FormData Object]'
                        : JSON.stringify(data).length + ' bytes',
            })

            // Fetch the full response
            const response: AxiosResponse<T> =
                await ApiService.fetchDataWithAxios<T>(config)

            // Verificar el tipo de contenido de la respuesta
            const contentType = response.headers['content-type'] || ''
            console.log('Tipo de contenido recibido:', contentType)
            
            // Procesamiento diferente según el tipo de contenido
            if (contentType.startsWith('audio/')) {
                console.log('Respuesta de tipo audio detectada:', contentType, 'Tamaño:', response.data.byteLength, 'bytes')
                
                // Convertir ArrayBuffer a Blob con el tipo MIME correcto
                const audioBlob = new Blob([response.data], { type: contentType })
                
                // Intentar determinar la extensión correcta para mejorar la compatibilidad
                let extension = '.mp3'  // Por defecto
                if (contentType.includes('wav')) {
                    extension = '.wav'
                } else if (contentType.includes('ogg')) {
                    extension = '.ogg'
                } else if (contentType.includes('mpeg') || contentType.includes('mp3')) {
                    extension = '.mp3'
                }
                
                // Crear URL de objeto para el Blob con extensión para mejor reconocimiento del navegador
                const blobUrl = URL.createObjectURL(audioBlob)
                const audioUrl = `${blobUrl}#ext${extension}`
                
                console.log('URL de audio creada con éxito:', audioUrl)
                
                // Reemplazar response.data con un objeto que tenga la estructura esperada
                response.data = {
                    success: true,
                    audio_blob: audioBlob,  // Guardar el Blob original para posible uso
                    audio_url: audioUrl,    // URL para reproducción directa
                    response: 'Audio response received', // Mensaje por defecto
                    content_type: contentType,
                    extension: extension
                } as any
            } 
            // Si es JSON, tenemos que convertir el ArrayBuffer a texto y luego parsearlo
            else if (contentType.includes('application/json')) {
                // Convertir ArrayBuffer a string
                const decoder = new TextDecoder('utf-8')
                const jsonString = decoder.decode(response.data)
                
                try {
                    // Parsear el JSON
                    const jsonData = JSON.parse(jsonString)
                    console.log('Respuesta JSON parseada correctamente:', jsonData)
                    
                    // Reemplazar response.data con el objeto JSON
                    response.data = jsonData
                    
                    // Make audio URL absolute if present
                    if ('audio_url' in response.data) {
                        const dataWithAudioUrl = response.data as {
                            audio_url?: string
                        } // Type assertion
                        const audioUrl = dataWithAudioUrl.audio_url
                        if (audioUrl && !audioUrl.startsWith('http')) {
                            dataWithAudioUrl.audio_url = `${VOICE_API_URL}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`
                        }
                    }
    
                    // Add success flag if missing but other fields indicate success
                    if (
                        !('success' in response.data) &&
                        ('response' in response.data || 'text' in response.data)
                    ) {
                        ;(response.data as any).success = true // Add success flag dynamically
                    }
                } catch (e) {
                    console.error('Error al parsear JSON:', e, 'Contenido recibido:', jsonString.substring(0, 200) + '...')
                    response.data = {
                        success: false,
                        error: 'Error al parsear JSON',
                        details: `No se pudo procesar la respuesta JSON: ${(e as Error).message}`
                    } as any
                }
            }
            // Cualquier otro tipo de contenido (text/plain, etc.)
            else {
                console.warn('Tipo de contenido no específicamente manejado:', contentType)
                
                // Convertir a texto e intentar interpretarlo
                const decoder = new TextDecoder('utf-8')
                try {
                    const textContent = decoder.decode(response.data)
                    console.log('Contenido como texto:', textContent.substring(0, 200) + '...')
                    
                    // Intentar parsear como JSON si parece ser un JSON
                    if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
                        try {
                            const jsonData = JSON.parse(textContent)
                            console.log('Contenido parseado como JSON:', jsonData)
                            response.data = jsonData
                            
                            // Agregar flag de éxito si corresponde
                            if (!('success' in response.data) && ('response' in response.data || 'text' in response.data)) {
                                (response.data as any).success = true
                            }
                        } catch (parseError) {
                            console.error('No se pudo parsear como JSON, tratando como texto:', parseError)
                            response.data = {
                                success: true,
                                response: textContent,
                                content_type: contentType
                            } as any
                        }
                    } else {
                        // Es texto plano
                        response.data = {
                            success: true,
                            response: textContent,
                            content_type: contentType
                        } as any
                    }
                } catch (decodeError) {
                    console.error('Error al decodificar contenido:', decodeError)
                    response.data = {
                        success: false,
                        error: 'Formato de respuesta no reconocido',
                        details: `Tipo de contenido: ${contentType}, no se pudo decodificar`
                    } as any
                }
            }

            return response // Return the full AxiosResponse
        } catch (error: unknown) {
            // Explicitly type error as unknown
            console.error('Error enviando mensaje de chat de voz:', error)

            // Import AxiosError if not already imported at the top
            // import { AxiosError } from 'axios'; // <--- Add this import if needed

            // Type checking for AxiosError
            if (error instanceof AxiosError) {
                if (error.response) {
                    // Error del servidor con respuesta
                    console.error('Detalles del error del servidor:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data, // Data might be relevant
                    })
                } else if (error.request) {
                    // Error de red - no se recibió respuesta
                    console.error(
                        'Error de red (sin respuesta del servidor):',
                        {
                            // Safer access to request properties if possible, fallback to any
                            requestUrl:
                                (error.request as any)?._currentUrl ??
                                (error.request as any)?.url ??
                                url,
                            method: (error.request as any)?.method ?? 'POST',
                        },
                    )
                } else {
                    // Error al configurar la solicitud u otro error Axios
                    console.error(
                        'Error Axios al configurar la solicitud:',
                        error.message,
                    )
                }
            } else if (error instanceof Error) {
                // Handle generic Error objects
                console.error('Error general:', error.message)
            } else {
                // Handle other types of errors or unknown errors
                console.error('Error desconocido:', error)
            }

            throw error // Re-throw the error after logging
        }
    },
}

export default VoiceService
