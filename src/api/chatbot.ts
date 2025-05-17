/**
 * API Chatbot
 * Implementación centralizada para interacción con el chatbot
 */

import { 
  apiSendChatMessage, 
  apiSendChatMessageSimplified,
  apiGetChatbotTemplates,
  apiTestChatbotConnection,
  ChatbotMessage,
  ChatbotResponse,
  ChatbotTemplate
} from '@/services/ChatService'
import { v4 as uuidv4 } from 'uuid'

/**
 * Clase para manejar la comunicación con el chatbot
 */
export class ChatbotAPI {
  private userId: string
  private tenantId: string
  private sessionId: string
  private templateId?: string
  private isReconnecting: boolean = false
  private reconnectAttempts: number = 0
  private readonly MAX_RECONNECT_ATTEMPTS = 3

  /**
   * Constructor del API de chatbot
   * @param tenantId ID del tenant
   * @param userId ID del usuario (opcional, se genera uno si no se proporciona)
   * @param templateId ID de la plantilla a usar (opcional)
   */
  constructor(tenantId: string, userId?: string, templateId?: string) {
    this.tenantId = tenantId
    this.userId = userId || `user-${uuidv4()}`
    this.sessionId = `session-${uuidv4()}`
    this.templateId = templateId
  }

  /**
   * Establece el ID de la plantilla a usar
   * @param templateId ID de la plantilla
   */
  setTemplateId(templateId: string): void {
    this.templateId = templateId
  }

  /**
   * Genera un nuevo ID de sesión para reiniciar la conversación
   */
  resetSession(): void {
    this.sessionId = `session-${uuidv4()}`
  }

  /**
   * Envía un mensaje al chatbot
   * @param text Texto del mensaje
   * @returns Respuesta del chatbot
   */
  async sendMessage(text: string): Promise<ChatbotResponse> {
    const message: ChatbotMessage = {
      text,
      user_id: this.userId,
      tenant_id: this.tenantId,
      session_id: this.sessionId,
      template_id: this.templateId
    }

    try {
      // Intentamos con el endpoint principal
      const response = await apiSendChatMessage(message)
      this.isReconnecting = false
      this.reconnectAttempts = 0
      return response
    } catch (error) {
      // Si falla, y no estamos ya en un intento de reconexión
      if (!this.isReconnecting && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        this.isReconnecting = true
        this.reconnectAttempts++
        
        // Intentamos con el endpoint simplificado como fallback
        try {
          console.log(`Intento de reconexión ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} usando endpoint simplificado`)
          const fallbackResponse = await apiSendChatMessageSimplified(message)
          this.isReconnecting = false
          return fallbackResponse
        } catch (fallbackError) {
          this.isReconnecting = false
          throw new Error(`Error en ambos endpoints de chatbot. Original: ${error}. Fallback: ${fallbackError}`)
        }
      } else {
        // Si ya estamos reconectando o excedimos los intentos
        this.isReconnecting = false
        throw error
      }
    }
  }

  /**
   * Obtiene las plantillas disponibles para el tenant
   * @returns Lista de plantillas
   */
  async getAvailableTemplates(): Promise<ChatbotTemplate[]> {
    try {
      const response = await apiGetChatbotTemplates(this.tenantId)
      return response.success ? response.templates : []
    } catch (error) {
      console.error('Error al obtener plantillas:', error)
      return []
    }
  }

  /**
   * Verifica la conexión con el backend del chatbot
   * @returns Estado de la conexión
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await apiTestChatbotConnection()
      return response.status === 'ok'
    } catch (error) {
      console.error('Error de conexión con el chatbot:', error)
      return false
    }
  }

  /**
   * Crea una instancia configurada para un usuario anónimo
   * @param tenantId ID del tenant
   * @param templateId ID de la plantilla (opcional)
   * @returns Instancia configurada de ChatbotAPI
   */
  static createAnonymous(tenantId: string, templateId?: string): ChatbotAPI {
    return new ChatbotAPI(tenantId, `anonymous-${uuidv4()}`, templateId)
  }
}

/**
 * Funciones de utilidad para formatear mensajes y respuestas
 */
export const ChatbotUtils = {
  /**
   * Formatea los mensajes para mostrarlos en UI
   * @param response Respuesta del chatbot
   * @returns Array de mensajes formateados
   */
  formatResponseMessages(response: ChatbotResponse): string[] {
    if (response.is_multi_message && response.messages) {
      return response.messages
    } else if (response.response) {
      return [response.response]
    } else if (response.fallback_response) {
      return [response.fallback_response]
    } else {
      return ['Lo siento, no pude procesar tu solicitud. Por favor, intenta de nuevo.']
    }
  },

  /**
   * Detecta si el mensaje indica un error
   * @param message Mensaje a verificar
   * @returns true si es un mensaje de error
   */
  isErrorMessage(message: string): boolean {
    const errorPatterns = [
      'error',
      'lo siento',
      'problema',
      'dificultad',
      'no pude',
      'falló',
      'intenta',
      'intentalo',
      'no disponible'
    ]
    const lowerMessage = message.toLowerCase()
    return errorPatterns.some(pattern => lowerMessage.includes(pattern))
  }
}

export default ChatbotAPI