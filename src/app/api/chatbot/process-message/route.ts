/**
 * frontend/src/app/api/chatbot/process-message/route.ts
 * API para procesar mensajes del chatbot con el nuevo motor de flujo
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import { NextRequest, NextResponse } from 'next/server'
import { processMessage } from '../executor/flow-executor'
import { validateTenantApiKey } from '../token-service'

/**
 * POST - Procesa un mensaje y ejecuta el flujo del chatbot
 */
export async function POST(req: NextRequest) {
  try {
    // Obtener datos del cuerpo de la solicitud
    const body = await req.json()
    
    const { 
      user_channel_id, 
      message, 
      tenant_id,
      channel_type = 'whatsapp', 
      api_key
    } = body
    
    // Validar parámetros obligatorios
    if (!user_channel_id || !message || !tenant_id) {
      return NextResponse.json(
        { 
          error: 'Se requieren los parámetros user_channel_id, message y tenant_id' 
        },
        { status: 400 }
      )
    }
    
    // Validar API key específica del tenant
    const isValidKey = await validateTenantApiKey(tenant_id, api_key)
    
    if (!isValidKey) {
      return NextResponse.json(
        { error: 'API key no válida para este tenant' },
        { status: 401 }
      )
    }
    
    // Procesar el mensaje con el motor de flujo
    const processResult = await processMessage(
      tenant_id,
      user_channel_id,
      message,
      channel_type
    )
    
    return NextResponse.json({
      success: true,
      responses: processResult.responses,
      session_id: processResult.sessionId,
      session_status: processResult.sessionStatus
    })
    
  } catch (error: any) {
    console.error('Error al procesar mensaje:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}