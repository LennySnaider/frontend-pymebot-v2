/**
 * frontend/src/app/api/chatbot/whatsapp/whatsapp-auth.ts
 * Utilidades de autenticación para solicitudes entrantes de WhatsApp
 * 
 * @version 1.0.0
 * @created 2025-07-05
 */

import { NextRequest } from 'next/server'
import crypto from 'crypto'

/**
 * Valida la firma de una solicitud entrante de WhatsApp
 * 
 * @param req Solicitud entrante
 * @returns true si la firma es válida, false en caso contrario
 */
export async function validateWhatsAppSignature(req: NextRequest): Promise<boolean> {
  try {
    // En modo de desarrollo, podemos omitir la validación para facilitar pruebas
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_WHATSAPP_SIGNATURE_VALIDATION === 'true') {
      console.warn('Omitiendo validación de firma de WhatsApp en modo desarrollo')
      return true
    }
    
    // Obtener la firma proporcionada en los headers
    const signature = req.headers.get('x-hub-signature-256')
    
    if (!signature) {
      console.warn('Falta la firma x-hub-signature-256 en la solicitud')
      return false
    }
    
    // Obtener el cuerpo de la solicitud como texto para la verificación
    const body = await req.text()
    const parsedBody = body ? JSON.parse(body) : {}
    
    // Recrear el cuerpo JSON para asegurar el mismo formato usado por WhatsApp
    const stringifiedBody = JSON.stringify(parsedBody)
    
    // Obtener el app secret de las variables de entorno
    const appSecret = process.env.WHATSAPP_APP_SECRET
    
    if (!appSecret) {
      console.error('WHATSAPP_APP_SECRET no está definido en variables de entorno')
      return false
    }
    
    // Calcular el HMAC usando el cuerpo y el app secret
    const hmac = crypto.createHmac('sha256', appSecret)
    hmac.update(stringifiedBody)
    const expectedSignature = `sha256=${hmac.digest('hex')}`
    
    // Comparar la firma calculada con la proporcionada (usando comparación de tiempo constante)
    const signatureIsValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
    
    return signatureIsValid
  } catch (error) {
    console.error('Error al validar firma de WhatsApp:', error)
    return false
  }
}

/**
 * Verifica si una solicitud entrante contiene un token de verificación válido
 * para la configuración inicial del webhook
 * 
 * @param mode Modo de verificación
 * @param token Token proporcionado en la solicitud
 * @returns true si el token es válido, false en caso contrario
 */
export function verifyWebhookToken(mode: string | null, token: string | null): boolean {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  
  if (!verifyToken) {
    console.error('WHATSAPP_VERIFY_TOKEN no está definido en variables de entorno')
    return false
  }
  
  return mode === 'subscribe' && token === verifyToken
}