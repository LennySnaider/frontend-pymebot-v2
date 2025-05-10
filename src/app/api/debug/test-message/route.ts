/**
 * frontend/src/app/api/debug/test-message/route.ts
 * Endpoint de diagnóstico para probar envío de mensajes al chatbot
 * @version 1.0.0
 * @updated 2025-05-11
 */

import { NextRequest, NextResponse } from 'next/server'
import { processChatMessage } from '../../chatbot/message/chat-handler'
import { createClient } from '@supabase/supabase-js'
import { extractWelcomeMessage } from '../../chatbot/message/message-extractor'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Handler para solicitudes GET - Probar extracción de mensaje de plantilla
 */
export async function GET(req: NextRequest) {
  try {
    // Obtener el ID de la plantilla desde los parámetros de consulta
    const templateId = req.nextUrl.searchParams.get('id')
    const tenantId = req.nextUrl.searchParams.get('tenant_id') || 'default'
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro id' },
        { status: 400 }
      )
    }
    
    console.log(`🔍 DIAGNÓSTICO TEST-MESSAGE 🔍 Probando para template: ${templateId}, tenant: ${tenantId}`)
    
    // Extraer mensaje de bienvenida de la plantilla
    const welcomeResult = await extractWelcomeMessage(templateId, tenantId, supabase)
    
    // Intentar simular el procesamiento completo de un mensaje
    const sessionId = `test-${Date.now()}`
    const userId = `test-user-${Date.now()}`
    const testText = "Hola, ¿cómo estás?"
    
    const chatResponse = await processChatMessage(
      testText,
      userId,
      sessionId,
      tenantId,
      'default',
      templateId
    )
    
    // Verificar si la respuesta obtenida del processChatMessage es la misma que la de nuestro extractor
    // Esto nos permite identificar si el problema está en la extracción o en el procesamiento
    const responseMatches = welcomeResult.message && 
      welcomeResult.message === chatResponse.response
    
    return NextResponse.json({
      templateId,
      tenantId,
      welcomeMessage: welcomeResult,
      testMessageResponse: {
        userMessage: testText,
        response: chatResponse.response,
        matchesWelcomeMessage: responseMatches
      },
      suggestions: [
        {
          title: "Extraer Mensaje Directo",
          url: `/api/debug/test-message?id=${templateId}`,
          description: "Probar extracción de mensaje de la plantilla"
        },
        {
          title: "Diagnosticar Plantilla",
          url: `/api/debug/chatbot-templates?id=${templateId}`,
          description: "Analizar la estructura de la plantilla"
        },
        {
          title: "Validar Plantilla",
          url: `/api/chatbot/validate-template?id=${templateId}`,
          description: "Verificar si la plantilla es válida"
        }
      ]
    })
  } catch (error: any) {
    console.error('Error en diagnóstico de mensajes:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Handler para solicitudes POST - Probar envío de mensaje a plantilla
 */
export async function POST(req: NextRequest) {
  try {
    // Obtener datos del cuerpo
    const body = await req.json()
    
    // Validar campos requeridos
    const {
      text = "Hola, ¿cómo estás?",
      template_id
    } = body
    
    if (!template_id) {
      return NextResponse.json(
        { error: 'template_id es requerido' },
        { status: 400 }
      )
    }
    
    // Generar IDs de prueba
    const userId = `test-user-${Date.now()}`
    const sessionId = `test-session-${Date.now()}`
    const tenantId = body.tenant_id || 'default'
    
    console.log(`🔍 TEST MENSAJE 🔍 Probando para template: ${template_id}, texto: ${text}`)
    
    // Procesar el mensaje y generar una respuesta
    const chatResponse = await processChatMessage(
      text,
      userId,
      sessionId,
      tenantId,
      'default',
      template_id
    )
    
    // Intentar también extraer mensaje directo para comparar
    const welcomeResult = await extractWelcomeMessage(template_id, tenantId, supabase)
    
    return NextResponse.json({
      requestData: {
        text,
        template_id,
        user_id: userId,
        session_id: sessionId,
        tenant_id: tenantId
      },
      welcomeMessage: welcomeResult.message,
      response: chatResponse.response,
      metadata: chatResponse.metadata
    })
  } catch (error: any) {
    console.error('Error en prueba de mensaje:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}