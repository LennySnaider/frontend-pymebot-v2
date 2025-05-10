/**
 * frontend/src/app/api/chatbot/validate-template/route.ts
 * API para validar que una plantilla de chatbot tiene una estructura correcta
 * @version 1.0.0
 * @updated 2025-05-11
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { findInitialMessage } from '../message/message-extractor'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Handler para solicitudes GET - Validar plantilla por ID
 */
export async function GET(req: NextRequest) {
  try {
    // Obtener el ID de la plantilla desde los parámetros de consulta
    const templateId = req.nextUrl.searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro id' },
        { status: 400 }
      )
    }

    console.log(`🧪 VALIDANDO PLANTILLA 🧪 ID: ${templateId}`)

    // Obtener la plantilla de la base de datos
    const { data: template, error } = await supabase
      .from('chatbot_templates')
      .select('id, name, description, react_flow_json')
      .eq('id', templateId)
      .single()

    if (error || !template) {
      console.error('🧪 ERROR AL OBTENER PLANTILLA 🧪', error)
      return NextResponse.json(
        { 
          error: 'No se pudo obtener la plantilla',
          details: error?.message || 'Plantilla no encontrada'
        },
        { status: 404 }
      )
    }

    // Información básica de la plantilla
    const result = {
      id: template.id,
      name: template.name,
      description: template.description,
      hasFlowJson: !!template.react_flow_json,
      isValid: false,
      validationDetails: null,
      message: null
    }

    // Si no hay datos de flujo, la plantilla no es válida
    if (!template.react_flow_json) {
      console.warn('🧪 PLANTILLA SIN DATOS DE FLUJO 🧪')
      return NextResponse.json({
        ...result,
        isValid: false,
        validationDetails: {
          error: 'La plantilla no tiene datos de flujo (react_flow_json)'
        }
      })
    }

    // Preparar el JSON de flujo para análisis
    let flowJson = template.react_flow_json
    
    // Si es string, intentar parsearlo
    if (typeof flowJson === 'string') {
      try {
        flowJson = JSON.parse(flowJson)
        console.log('🧪 FLUJO PARSEADO 🧪 Convertido de string a objeto')
      } catch (parseError) {
        console.error('🧪 ERROR AL PARSEAR FLUJO 🧪', parseError)
        return NextResponse.json({
          ...result,
          isValid: false,
          validationDetails: {
            error: 'No se pudo parsear react_flow_json'
          }
        })
      }
    }

    // Verificar que sea un objeto
    if (!flowJson || typeof flowJson !== 'object') {
      console.error('🧪 FLUJO NO ES UN OBJETO 🧪')
      return NextResponse.json({
        ...result,
        isValid: false,
        validationDetails: {
          error: 'react_flow_json no es un objeto válido'
        }
      })
    }

    // Intentar extraer el mensaje inicial usando el extractor
    const { message, diagnostics } = findInitialMessage(flowJson)

    // Actualizar el resultado con los detalles del análisis
    result.validationDetails = diagnostics
    
    if (message) {
      console.log(`🧪 MENSAJE ENCONTRADO 🧪 "${message.substring(0, 50)}..."`)
      result.isValid = true
      result.message = message
    } else {
      console.warn('🧪 NO SE ENCONTRÓ MENSAJE 🧪')
      result.isValid = false
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error al validar plantilla:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}