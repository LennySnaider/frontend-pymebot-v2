/**
 * frontend/src/app/api/chatbot/whatsapp/route.ts
 * Endpoint para integración con WhatsApp Business API
 * 
 * @version 1.0.0
 * @created 2025-07-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { identifyTenant, TenantRequestContext } from '../tenant-middleware'
import { processMessage } from '../executor/flow-executor'
import { validateWhatsAppSignature, verifyWebhookToken } from './whatsapp-auth'
import { WhatsAppService, WhatsAppMessageType } from './whatsapp-service'
import { WhatsAppMediaHandler, MediaType } from './multimedia-handler'
import { supabase } from '@/services/supabase/SupabaseClient'
import { ConversationManager } from '../conversation/conversation-manager'
import { ContentType } from '../conversation/conversation-types'

// Maneja solicitudes GET (verificación webhook de WhatsApp)
export async function GET(req: NextRequest) {
  try {
    // Extraer los parámetros de la URL para la verificación del webhook
    const params = req.nextUrl.searchParams
    const mode = params.get('hub.mode')
    const token = params.get('hub.verify_token')
    const challenge = params.get('hub.challenge')
    
    // Verificar que esto es una solicitud de verificación válida
    if (verifyWebhookToken(mode, token)) {
      console.log('Webhook de WhatsApp verificado exitosamente')
      return new NextResponse(challenge)
    }
    
    return new NextResponse('Verification failed', { status: 403 })
  } catch (error) {
    console.error('Error en verificación de webhook:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

// Maneja solicitudes POST (mensajes entrantes de WhatsApp)
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticidad de la solicitud mediante firma
    const isValid = await validateWhatsAppSignature(req)
    
    if (!isValid) {
      console.warn('Solicitud de WhatsApp con firma inválida rechazada')
      return NextResponse.json({ success: false, error: 'Firma inválida' }, { status: 401 })
    }
    
    // Obtener datos de la solicitud
    const data = await req.json()
    
    // Procesar solo si hay entradas y cambios (formato de webhook de WhatsApp)
    if (!data.entry || !data.entry.length || !data.entry[0].changes || !data.entry[0].changes.length) {
      return NextResponse.json({ success: true, message: 'No hay mensajes para procesar' })
    }
    
    // Extraer el valor de los cambios (mensajes)
    const value = data.entry[0].changes[0].value
    
    // Verificar que sea un mensaje y no otro tipo de notificación
    if (!value.messages || !value.messages.length) {
      // Podría ser una notificación de entrega o lectura, la procesamos si es necesario
      if (value.statuses) {
        console.log('Notificación de estado recibida:', value.statuses[0].status)
        return NextResponse.json({ success: true, message: 'Notificación de estado procesada' })
      }
      
      return NextResponse.json({ success: true, message: 'No hay mensajes entrantes' })
    }
    
    // Extraer información del mensaje
    const message = value.messages[0]
    const whatsappId = value.metadata.phone_number_id
    const userPhoneNumber = message.from
    const messageId = message.id
    const timestamp = message.timestamp
    
    // Marcar mensaje como leído (buena práctica para WhatsApp)
    try {
      await markMessageAsRead(whatsappId, messageId)
    } catch (markError) {
      console.warn('Error al marcar mensaje como leído:', markError)
      // Continuamos el proceso aunque haya fallado marcar como leído
    }
    
    let messageContent = ''
    let messageType = 'text'
    
    // Determinar tipo de mensaje y extraer contenido
    if (message.text) {
      messageContent = message.text.body
      messageType = 'text'
    } else if (message.image) {
      messageContent = message.image.id // ID de la imagen para descargar posteriormente
      messageType = 'image'
    } else if (message.audio) {
      messageContent = message.audio.id
      messageType = 'audio'
    } else if (message.voice) {
      messageContent = message.voice.id
      messageType = 'voice'
    } else if (message.document) {
      messageContent = message.document.id
      messageType = 'document'
    } else if (message.location) {
      messageContent = JSON.stringify(message.location)
      messageType = 'location'
    } else {
      // Tipo de mensaje no soportado
      console.warn(`Tipo de mensaje no soportado: ${JSON.stringify(message)}`)
      messageContent = 'Mensaje no soportado'
      messageType = 'unsupported'
    }
    
    console.log(`Mensaje recibido de ${userPhoneNumber}: ${messageContent} (${messageType})`)
    
    // Crear una instancia del gestor de conversaciones
    const conversationManager = new ConversationManager(supabase)
    
    // Procesar mensajes multimedia
    if (messageType !== 'text') {
      try {
        // Crear instancia del manejador de multimedia
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
        
        if (!accessToken) {
          throw new Error('WHATSAPP_ACCESS_TOKEN no está configurado')
        }
        
        const mediaHandler = new WhatsAppMediaHandler(accessToken)
        
        // Mapear tipo de mensaje a MediaType
        let mediaTypeEnum: MediaType
        switch (messageType) {
          case 'image': mediaTypeEnum = MediaType.IMAGE; break
          case 'audio': mediaTypeEnum = MediaType.AUDIO; break
          case 'voice': mediaTypeEnum = MediaType.VOICE; break
          case 'video': mediaTypeEnum = MediaType.VIDEO; break
          case 'document': mediaTypeEnum = MediaType.DOCUMENT; break
          default:
            // Responder que no soportamos este tipo de mensaje
            await sendWhatsAppMessage(
              whatsappId, 
              userPhoneNumber, 
              "Lo siento, por el momento no puedo procesar este tipo de mensaje. Por favor, envía tu consulta como texto."
            )
            
            return NextResponse.json({ 
              success: true,
              message: `Mensaje tipo ${messageType} recibido pero no soportado`
            })
        }
        
        // Intentar identificar el tenant
        const tenantContext = await identifyTenant(req, {
          validateApiKey: false,
          requireSession: true,
          requireChannel: true
        })
        
        if (!(tenantContext as TenantRequestContext).tenantId) {
          throw new Error('No se pudo identificar el tenant')
        }
        
        const context = tenantContext as TenantRequestContext
        
        // Procesar el contenido multimedia
        const processedMedia = await mediaHandler.processMediaMessage(
          context.tenantId,
          messageContent, // ID del contenido en WhatsApp
          mediaTypeEnum,
          message.caption // Si existe un caption, lo incluimos
        )
        
        // Registrar el mensaje en la conversación
        if (context.session?.id) {
          let contentTypeEnum: ContentType
          
          switch (mediaTypeEnum) {
            case MediaType.IMAGE: contentTypeEnum = ContentType.IMAGE; break
            case MediaType.AUDIO:
            case MediaType.VOICE: contentTypeEnum = ContentType.AUDIO; break
            case MediaType.VIDEO: contentTypeEnum = ContentType.VIDEO; break
            case MediaType.DOCUMENT: contentTypeEnum = ContentType.DOCUMENT; break
            default: contentTypeEnum = ContentType.TEXT
          }
          
          // El contenido será la URL interna o el ID del contenido si no se pudo procesar
          const mediaContent = processedMedia.metadata.internalUrl || messageContent
          
          // Guardar en la conversación
          await conversationManager.addMessage(
            context.session.id,
            mediaContent,
            contentTypeEnum,
            true, // Es del usuario
            undefined, // No hay nodo asociado
            {
              originalMediaId: messageContent,
              mediaType: mediaTypeEnum,
              caption: processedMedia.metadata.caption,
              fileName: processedMedia.metadata.fileName,
              mimeType: processedMedia.metadata.mimeType
            }
          )
          
          // Si hay un caption, también procesarlo como texto
          if (processedMedia.metadata.caption) {
            await processMessage(
              context.tenantId,
              userPhoneNumber,
              processedMedia.metadata.caption,
              'whatsapp'
            )
          } else {
            // Si no hay caption, responder que necesitamos un texto
            await sendWhatsAppMessage(
              whatsappId,
              userPhoneNumber,
              "He recibido tu contenido multimedia. Por favor, indícame cómo puedo ayudarte con una descripción o pregunta."
            )
          }
        }
        
        // Éxito
        return NextResponse.json({
          success: true,
          message: `Contenido multimedia ${mediaTypeEnum} procesado correctamente`,
          metadata: processedMedia.metadata
        })
        
      } catch (mediaError: any) {
        console.error(`Error al procesar contenido multimedia:`, mediaError)
        
        // Informar al usuario sobre el error
        try {
          await sendWhatsAppMessage(
            whatsappId,
            userPhoneNumber,
            "Lo siento, hubo un problema al procesar tu contenido multimedia. Por favor, intenta con un mensaje de texto."
          )
        } catch (sendError) {
          console.error('Error al enviar mensaje de error:', sendError)
        }
        
        return NextResponse.json({
          success: false,
          error: 'Error al procesar contenido multimedia',
          details: mediaError.message
        }, { status: 500 })
      }
    }
    
    // Intentar identificar el tenant basado en el número de teléfono
    // En este caso el channel_type será 'whatsapp' y el user_channel_id será el número de teléfono
    const tenantContext = await identifyTenant(req, {
      validateApiKey: false, // No requerimos API key para webhooks entrantes
      requireSession: true,
      requireChannel: true
    })
    
    // Si no pudimos identificar el tenant, rechazar el mensaje
    if (!(tenantContext as TenantRequestContext).tenantId) {
      console.error('No se pudo identificar el tenant para el mensaje de WhatsApp')
      
      // Informar al usuario
      try {
        const errorMessage = "Lo siento, este número no está configurado para recibir mensajes. Por favor, contacta al soporte para configurar el servicio."
        await sendWhatsAppMessage(whatsappId, userPhoneNumber, errorMessage)
      } catch (sendError) {
        console.error('Error al enviar mensaje de error:', sendError)
      }
      
      return NextResponse.json({ success: false, error: 'Tenant no identificado' }, { status: 404 })
    }
    
    const context = tenantContext as TenantRequestContext
    
    // Procesar el mensaje con el motor de chatbot
    const result = await processMessage(
      context.tenantId,
      userPhoneNumber, // El número de teléfono es el identificador del usuario
      messageContent,
      'whatsapp' // Tipo de canal
    )
    
    // Enviar respuestas al usuario a través de WhatsApp
    if (result.responses && result.responses.length > 0) {
      try {
        // Obtener la configuración de WhatsApp para este tenant
        const { data: tenantConfig } = await supabase
          .from('tenant_chatbot_channels')
          .select('channel_config')
          .eq('tenant_id', context.tenantId)
          .eq('channel_type', 'whatsapp')
          .eq('is_active', true)
          .limit(1)
          .single()
        
        // Si no hay configuración, usar valores por defecto
        const config = tenantConfig?.channel_config || {}
        
        // Enviar cada respuesta como un mensaje separado
        for (const response of result.responses) {
          await sendWhatsAppMessage(whatsappId, userPhoneNumber, response, config)
        }
        
        console.log(`${result.responses.length} respuestas enviadas a ${userPhoneNumber}`)
      } catch (sendError) {
        console.error('Error al enviar respuestas a WhatsApp:', sendError)
      }
    } else {
      console.warn(`No hay respuestas para enviar a ${userPhoneNumber}`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Mensaje procesado correctamente',
      responses: result.responses,
      sessionId: result.sessionId
    })
    
  } catch (error: any) {
    console.error('Error al procesar mensaje de WhatsApp:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * Envía un mensaje a un número de WhatsApp
 * 
 * @param phoneNumberId ID del número de teléfono de WhatsApp Business
 * @param to Número de teléfono del destinatario
 * @param message Contenido del mensaje
 * @param config Configuración adicional
 */
async function sendWhatsAppMessage(
  phoneNumberId: string, 
  to: string, 
  message: string,
  config: Record<string, any> = {}
): Promise<any> {
  // Obtener el token de acceso para la API de WhatsApp
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  if (!accessToken) {
    throw new Error('WHATSAPP_ACCESS_TOKEN no está configurado en variables de entorno')
  }
  
  // Crear instancia del servicio
  const whatsappService = new WhatsAppService(accessToken)
  
  // Enviar mensaje de texto
  return whatsappService.sendTextMessage(phoneNumberId, to, message)
}

/**
 * Marca un mensaje como leído
 * 
 * @param phoneNumberId ID del número de teléfono de WhatsApp Business
 * @param messageId ID del mensaje a marcar como leído
 */
async function markMessageAsRead(phoneNumberId: string, messageId: string): Promise<any> {
  // Obtener el token de acceso para la API de WhatsApp
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  if (!accessToken) {
    throw new Error('WHATSAPP_ACCESS_TOKEN no está configurado en variables de entorno')
  }
  
  // Crear instancia del servicio
  const whatsappService = new WhatsAppService(accessToken)
  
  // Marcar mensaje como leído
  return whatsappService.markMessageAsRead(phoneNumberId, messageId)
}