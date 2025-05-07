/**
 * frontend/src/app/api/chatbot/whatsapp/whatsapp-service.ts
 * Servicio para envío de mensajes a través de WhatsApp Business API
 * 
 * @version 1.0.0
 * @created 2025-07-05
 */

import axios from 'axios'

// Tipos de mensajes soportados por WhatsApp
export enum WhatsAppMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
  LOCATION = 'location'
}

// Interfaz para las opciones de envío de mensajes
export interface SendMessageOptions {
  phoneNumberId: string; // ID del número de teléfono del WhatsApp Business
  to: string; // Número de teléfono del destinatario
  messageType?: WhatsAppMessageType; // Tipo de mensaje (default: TEXT)
  text?: string; // Contenido de texto del mensaje
  mediaId?: string; // ID de un archivo multimedia previamente cargado
  mediaUrl?: string; // URL de un archivo multimedia para enviar
  templateName?: string; // Nombre de la plantilla para mensajes tipo template
  templateLanguage?: string; // Código de idioma para la plantilla (ej: "es_ES")
  templateComponents?: any[]; // Componentes para personalizar la plantilla
  interactiveContent?: any; // Contenido para mensajes interactivos
  locationContent?: any; // Datos de ubicación
}

/**
 * Clase que implementa la integración con WhatsApp Business API
 */
export class WhatsAppService {
  private apiVersion: string
  private accessToken: string
  private baseUrl: string
  
  /**
   * Constructor del servicio de WhatsApp
   * 
   * @param accessToken Token de acceso a la API de WhatsApp
   * @param apiVersion Versión de la API (default: v18.0)
   */
  constructor(accessToken: string, apiVersion: string = 'v18.0') {
    this.accessToken = accessToken
    this.apiVersion = apiVersion
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`
  }
  
  /**
   * Envía un mensaje a través de WhatsApp
   * 
   * @param options Opciones para el envío del mensaje
   * @returns Respuesta de la API de WhatsApp
   */
  async sendMessage(options: SendMessageOptions): Promise<any> {
    const { 
      phoneNumberId, 
      to, 
      messageType = WhatsAppMessageType.TEXT, 
      text,
      mediaId,
      mediaUrl,
      templateName,
      templateLanguage,
      templateComponents,
      interactiveContent,
      locationContent
    } = options
    
    // Validar parámetros según el tipo de mensaje
    this.validateMessageParams(messageType, options)
    
    // Construir la URL para el envío
    const url = `${this.baseUrl}/${phoneNumberId}/messages`
    
    // Construir el cuerpo de la solicitud según el tipo de mensaje
    let requestBody: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to
    }
    
    // Añadir contenido específico según el tipo de mensaje
    switch (messageType) {
      case WhatsAppMessageType.TEXT:
        requestBody.type = 'text'
        requestBody.text = { body: text }
        break
        
      case WhatsAppMessageType.IMAGE:
        requestBody.type = 'image'
        requestBody.image = mediaId 
          ? { id: mediaId } 
          : { link: mediaUrl }
        break
        
      case WhatsAppMessageType.AUDIO:
        requestBody.type = 'audio'
        requestBody.audio = mediaId 
          ? { id: mediaId } 
          : { link: mediaUrl }
        break
        
      case WhatsAppMessageType.DOCUMENT:
        requestBody.type = 'document'
        requestBody.document = mediaId 
          ? { id: mediaId } 
          : { link: mediaUrl }
        break
        
      case WhatsAppMessageType.TEMPLATE:
        requestBody.type = 'template'
        requestBody.template = {
          name: templateName,
          language: { code: templateLanguage || 'es' },
          components: templateComponents || []
        }
        break
        
      case WhatsAppMessageType.INTERACTIVE:
        requestBody.type = 'interactive'
        requestBody.interactive = interactiveContent
        break
        
      case WhatsAppMessageType.LOCATION:
        requestBody.type = 'location'
        requestBody.location = locationContent
        break
    }
    
    // Configurar headers con el token de autenticación
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    }
    
    try {
      // Realizar la solicitud a la API de WhatsApp
      const response = await axios.post(url, requestBody, { headers })
      
      console.log(`Mensaje enviado exitosamente a ${to}, tipo: ${messageType}`)
      return response.data
    } catch (error: any) {
      console.error('Error al enviar mensaje de WhatsApp:', error?.response?.data || error.message)
      throw error
    }
  }
  
  /**
   * Envía un mensaje de texto simple a WhatsApp
   * 
   * @param phoneNumberId ID del número de teléfono de WhatsApp Business
   * @param to Número de teléfono del destinatario
   * @param text Contenido del mensaje
   * @returns Respuesta de la API de WhatsApp
   */
  async sendTextMessage(phoneNumberId: string, to: string, text: string): Promise<any> {
    return this.sendMessage({
      phoneNumberId,
      to,
      messageType: WhatsAppMessageType.TEXT,
      text
    })
  }
  
  /**
   * Envía una imagen a WhatsApp
   * 
   * @param phoneNumberId ID del número de teléfono de WhatsApp Business
   * @param to Número de teléfono del destinatario
   * @param imageUrl URL de la imagen a enviar
   * @returns Respuesta de la API de WhatsApp
   */
  async sendImage(phoneNumberId: string, to: string, imageUrl: string): Promise<any> {
    return this.sendMessage({
      phoneNumberId,
      to,
      messageType: WhatsAppMessageType.IMAGE,
      mediaUrl: imageUrl
    })
  }
  
  /**
   * Envía una plantilla predefinida a WhatsApp
   * 
   * @param phoneNumberId ID del número de teléfono de WhatsApp Business
   * @param to Número de teléfono del destinatario
   * @param templateName Nombre de la plantilla
   * @param language Código de idioma
   * @param components Componentes para personalizar la plantilla
   * @returns Respuesta de la API de WhatsApp
   */
  async sendTemplate(
    phoneNumberId: string, 
    to: string, 
    templateName: string,
    language: string = 'es',
    components: any[] = []
  ): Promise<any> {
    return this.sendMessage({
      phoneNumberId,
      to,
      messageType: WhatsAppMessageType.TEMPLATE,
      templateName,
      templateLanguage: language,
      templateComponents: components
    })
  }
  
  /**
   * Valida los parámetros según el tipo de mensaje
   * 
   * @param messageType Tipo de mensaje
   * @param options Opciones del mensaje
   * @throws Error si los parámetros no son válidos
   */
  private validateMessageParams(messageType: WhatsAppMessageType, options: SendMessageOptions) {
    const { 
      phoneNumberId, 
      to, 
      text,
      mediaId,
      mediaUrl,
      templateName,
      templateLanguage,
      templateComponents,
      interactiveContent,
      locationContent
    } = options
    
    // Validar parámetros comunes
    if (!phoneNumberId) {
      throw new Error('phoneNumberId es requerido')
    }
    
    if (!to) {
      throw new Error('El número de teléfono del destinatario (to) es requerido')
    }
    
    // Validar parámetros específicos según tipo de mensaje
    switch (messageType) {
      case WhatsAppMessageType.TEXT:
        if (!text) {
          throw new Error('El contenido de texto es requerido para mensajes de texto')
        }
        break
        
      case WhatsAppMessageType.IMAGE:
      case WhatsAppMessageType.AUDIO:
      case WhatsAppMessageType.DOCUMENT:
        if (!mediaId && !mediaUrl) {
          throw new Error(`mediaId o mediaUrl es requerido para mensajes tipo ${messageType}`)
        }
        break
        
      case WhatsAppMessageType.TEMPLATE:
        if (!templateName) {
          throw new Error('templateName es requerido para mensajes de plantilla')
        }
        break
        
      case WhatsAppMessageType.INTERACTIVE:
        if (!interactiveContent) {
          throw new Error('interactiveContent es requerido para mensajes interactivos')
        }
        break
        
      case WhatsAppMessageType.LOCATION:
        if (!locationContent) {
          throw new Error('locationContent es requerido para mensajes de ubicación')
        }
        break
    }
  }
  
  /**
   * Marca un mensaje como leído en WhatsApp
   * 
   * @param phoneNumberId ID del número de teléfono de WhatsApp Business
   * @param messageId ID del mensaje a marcar como leído
   * @returns Respuesta de la API de WhatsApp
   */
  async markMessageAsRead(phoneNumberId: string, messageId: string): Promise<any> {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`
    
    const requestBody = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    }
    
    try {
      const response = await axios.post(url, requestBody, { headers })
      console.log(`Mensaje ${messageId} marcado como leído`)
      return response.data
    } catch (error: any) {
      console.error('Error al marcar mensaje como leído:', error?.response?.data || error.message)
      throw error
    }
  }
}