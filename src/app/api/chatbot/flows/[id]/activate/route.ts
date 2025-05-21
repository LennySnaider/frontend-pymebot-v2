/**
 * frontend/src/app/api/chatbot/flows/[id]/activate/route.ts
 * API para activar un flujo de chatbot instanciado
 * @version 1.0.0
 * @created 2025-11-07
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener ID del flujo desde la URL
    const flowId = String(params?.id || '')
    
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener tenantId del usuario autenticado
    const tenantId = session.user.tenant_id

    if (!flowId) {
      return NextResponse.json(
        { success: false, error: 'ID del flujo es requerido' },
        { status: 400 }
      )
    }

    // Simulación de activación para pruebas
    // En un sistema real, deberíamos hacer lo siguiente:
    // 1. Verificar que el flujo existe y pertenece al tenant
    // 2. Activar el flujo en el sistema de chatbot
    // 3. Actualizar el estado en la base de datos

    // Simplemente registramos la activación para propósitos de demostración
    const { data, error } = await supabase
      .from('tenant_chatbot_activations')
      .update({ is_active: true, activated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('flow_id', flowId)
      .select()

    if (error) {
      console.error('Error al activar flujo en DB:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al activar flujo',
          details: error 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Flujo activado correctamente',
      data
    })
  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}