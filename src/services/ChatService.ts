import ApiService from './ApiService'

// Interfaces para la comunicación con el chatbot
export interface ChatbotMessage {
  text: string
  user_id: string
  tenant_id: string
  session_id?: string
  template_id?: string
  bot_id?: string
}

export interface ChatbotResponse {
  success: boolean
  response?: string
  messages?: string[] // Para respuestas múltiples
  is_multi_message?: boolean
  processing_time_ms?: number
  tokens_used?: number
  error?: string
  fallback_response?: string
  debug?: any
}

export interface ChatbotTemplate {
  id: string
  name: string
  description: string
  isActive: boolean
  tokensEstimated: number
  category: string
  flowId?: string
}

// Función para enviar mensajes al chatbot con manejo avanzado de errores
export async function apiSendChatMessage(message: ChatbotMessage): Promise<ChatbotResponse> {
  try {
    const response = await ApiService.fetchDataWithAxios<ChatbotResponse>({
      url: `/chatbot/integrated-message`,
      method: 'post',
      data: message,
    });
    
    // Verificar si la respuesta indica un error pero con código 200
    if (!response.success && response.error) {
      console.warn('El chatbot devolvió un error:', response.error);
      
      // Si hay un fallback_response, lo mostramos en la UI
      if (response.fallback_response) {
        return {
          success: false,
          error: response.error,
          fallback_response: response.fallback_response,
          debug: response.debug || {}
        };
      }
    }
    
    return response;
  } catch (error: any) {
    console.error('Error en apiSendChatMessage:', error);
    
    // Intentar extraer información detallada si el error vino del servidor
    let errorMessage = error.message;
    let fallbackResponse = "Error de comunicación con el servidor. Por favor, verifica que el backend esté en funcionamiento.";
    let debugInfo = {};
    
    // Si hay una respuesta del servidor con datos
    if (error.response?.data) {
      // Usar información de error proporcionada por el servidor
      errorMessage = error.response.data.error || errorMessage;
      fallbackResponse = error.response.data.fallback_response || fallbackResponse;
      debugInfo = error.response.data.debug || {};
    }
    
    // Crear un mensaje de diagnóstico detallado para el log
    const diagnosticInfo = `
            ======== INFORMACIÓN DE DIAGNÓSTICO CONEXIÓN API ========
            Error al comunicarse con la API proxy.
            - Endpoint utilizado: /api/chatbot/integrated-message
            - Datos enviados: ${JSON.stringify(message.text)}
            - Error específico: ${errorMessage}
            - Status: ${error.response?.status || 'desconocido'}
            - Verificar que el servidor backend esté en ejecución
            =======================================================
        `;
    
    console.error(diagnosticInfo);
    
    // En lugar de lanzar un error, devolver un objeto de respuesta formateado
    // con información útil que se puede mostrar en la UI
    return {
      success: false,
      error: errorMessage,
      fallback_response: fallbackResponse,
      debug: {
        ...debugInfo,
        status: error.response?.status,
        originalMessage: error.message
      }
    };
  }
}

// Función alternativa que usa el endpoint simplificado
export async function apiSendChatMessageSimplified(message: ChatbotMessage): Promise<ChatbotResponse> {
  try {
    const response = await ApiService.fetchDataWithAxios<ChatbotResponse>({
      url: `/chatbot/simplified-flow`,
      method: 'post',
      data: message,
    });
    
    // Verificar si la respuesta indica un error pero con código 200
    if (!response.success && response.error) {
      console.warn('El chatbot simplificado devolvió un error:', response.error);
      
      if (response.fallback_response) {
        return {
          success: false,
          error: response.error,
          fallback_response: response.fallback_response,
          debug: response.debug || {}
        };
      }
    }
    
    return response;
  } catch (error: any) {
    console.error('Error en apiSendChatMessageSimplified:', error);
    
    // Intentar extraer información detallada si el error vino del servidor
    let errorMessage = error.message;
    let fallbackResponse = "Error de comunicación con el servidor (modo simplificado).";
    let debugInfo = {};
    
    // Si hay una respuesta del servidor con datos
    if (error.response?.data) {
      errorMessage = error.response.data.error || errorMessage;
      fallbackResponse = error.response.data.fallback_response || fallbackResponse;
      debugInfo = error.response.data.debug || {};
    }
    
    // Devolver un objeto de respuesta formateado con la información del error
    return {
      success: false,
      error: errorMessage,
      fallback_response: fallbackResponse,
      debug: {
        ...debugInfo,
        status: error.response?.status,
        originalMessage: error.message,
        endpoint: 'simplified'
      }
    };
  }
}

// Función para obtener plantillas disponibles
export async function apiGetChatbotTemplates(tenantId: string): Promise<{success: boolean, templates: ChatbotTemplate[]}> {
  try {
    return await ApiService.fetchDataWithAxios<{success: boolean, templates: ChatbotTemplate[]}>({
      url: `/text/templates?tenant_id=${tenantId}`,
      method: 'get',
    });
  } catch (error: any) {
    console.error('Error al obtener plantillas de chatbot:', error);
    return {success: false, templates: []};
  }
}

// Función para probar la conexión con el backend
export async function apiTestChatbotConnection(): Promise<{status: string, timestamp: string}> {
  try {
    return await ApiService.fetchDataWithAxios<{status: string, timestamp: string}>({
      url: `/text/ping`,
      method: 'get',
    });
  } catch (error: any) {
    console.error('Error al probar conexión con el backend de chatbot:', error);
    throw new Error(`Error de conexión: ${error.message}`);
  }
}

// Funciones originales
export async function apiGetConversation<T>({ id }: { id: string }) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/conversations/${id}`,
        method: 'get',
    })
}

export async function apiGetContacts<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: `/contacts`,
        method: 'get',
    })
}

export async function apiGetContactDetails<T>({ id }: { id: string }) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/contacts/${id}`,
        method: 'get',
    })
}
