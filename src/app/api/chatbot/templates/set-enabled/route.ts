/**
 * frontend/src/app/api/chatbot/templates/set-enabled/route.ts
 * API para establecer el estado "enabled" de una plantilla de chatbot
 * @version 1.0.0
 * @created 2025-05-11
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener datos del cuerpo
    const body = await req.json()
    const { templateId, isEnabled } = body

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId es requerido' },
        { status: 400 }
      )
    }

    // Obtener tenantId del usuario autenticado
    const tenantId = session.user.tenant_id

    // Buscar registro existente
    const { data: existingRecord, error: findError } = await supabase
      .from('tenant_chatbot_activations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('template_id', templateId)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error al buscar activación:', findError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al buscar activación',
          details: findError 
        },
        { status: 500 }
      )
    }

    // Dependiendo de si existe o no y del nuevo estado, realizar la operación correcta
    let result
    
    if (existingRecord) {
      // Primero necesitamos obtener información sobre la plantilla para su versión
      // (también para la actualización, para mantener consistencia)
      const { data: templateData, error: templateError } = await supabase
        .from('chatbot_templates')
        .select('id, version')
        .eq('id', templateId)
        .single();

      if (templateError) {
        console.error('Error al obtener información de la plantilla:', templateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Error al obtener información de la plantilla',
            details: templateError
          },
          { status: 500 }
        );
      }

      // Usar versión 1 como fallback si no está definida
      const templateVersion = templateData?.version || 1;

      // Actualizar estado
      const updateData = {
        is_active: isEnabled,
        template_version: templateVersion // Aseguramos que siempre tenga un valor actualizado
      };

      // Si se está desactivando, agregar fecha de desactivación
      if (!isEnabled) {
        updateData.deactivated_at = new Date().toISOString();
      } else {
        // Si se está activando, actualizar fecha de activación
        updateData.activated_at = new Date().toISOString();
        // Y establecer fecha de desactivación a null
        updateData.deactivated_at = null;
      }

      const { error: updateError } = await supabase
        .from('tenant_chatbot_activations')
        .update(updateData)
        .eq('id', existingRecord.id)
        .eq('tenant_id', tenantId)

      if (updateError) {
        console.error('Error al actualizar activación:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: 'Error al actualizar activación',
            details: updateError
          },
          { status: 500 }
        )
      }

      result = {
        success: true,
        message: `Plantilla ${isEnabled ? 'activada' : 'desactivada'} exitosamente`,
        operation: 'update'
      }
    } else if (isEnabled) {
      // Primero necesitamos obtener información sobre la plantilla para su versión
      const { data: templateData, error: templateError } = await supabase
        .from('chatbot_templates')
        .select('id, version')
        .eq('id', templateId)
        .single();

      if (templateError) {
        console.error('Error al obtener información de la plantilla:', templateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Error al obtener información de la plantilla',
            details: templateError
          },
          { status: 500 }
        );
      }

      // Usar versión 1 como fallback si no está definida
      const templateVersion = templateData?.version || 1;

      // Solo insertar si se está activando
      const { error: insertError } = await supabase
        .from('tenant_chatbot_activations')
        .insert({
          tenant_id: tenantId,
          template_id: templateId,
          is_active: true,
          activated_at: new Date().toISOString(),
          activated_by: session.user.id,
          template_version: templateVersion
        })
      
      if (insertError) {
        console.error('Error al crear activación:', insertError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al crear activación',
            details: insertError 
          },
          { status: 500 }
        )
      }
      
      result = { 
        success: true, 
        message: 'Plantilla activada exitosamente',
        operation: 'insert'
      }
    } else {
      // Si no existe y se está desactivando, no hay nada que hacer
      result = { 
        success: true, 
        message: 'No existía registro, no es necesario desactivar',
        operation: 'none'
      }
    }

    return NextResponse.json(result)
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