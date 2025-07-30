import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/services/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, isEnabled } = body
    
    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'ID de plantilla requerido'
      }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Por ahora usar un tenant_id hardcodeado para desarrollo
    // TODO: Obtener el tenant_id real del usuario autenticado
    const tenantId = 'afa60b0a-3046-4607-9c48-266af6e1d322'
    
    if (isEnabled) {
      // Primero desactivar cualquier plantilla activa
      const { error: deactivateError } = await supabase
        .from('tenant_chatbot_activations')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
      
      if (deactivateError) {
        console.error('Error al desactivar plantillas:', deactivateError)
      }
      
      // Verificar si ya existe un registro para esta plantilla
      const { data: existing } = await supabase
        .from('tenant_chatbot_activations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('template_id', templateId)
        .single()
      
      if (existing) {
        // Actualizar el registro existente
        const { error: updateError } = await supabase
          .from('tenant_chatbot_activations')
          .update({
            is_active: true,
            activated_at: new Date().toISOString(),
            deactivated_at: null
          })
          .eq('id', existing.id)
        
        if (updateError) {
          throw updateError
        }
      } else {
        // Crear un nuevo registro
        const { error: insertError } = await supabase
          .from('tenant_chatbot_activations')
          .insert({
            tenant_id: tenantId,
            template_id: templateId,
            is_active: true,
            activated_at: new Date().toISOString()
          })
        
        if (insertError) {
          throw insertError
        }
      }
    } else {
      // Desactivar la plantilla
      const { error: deactivateError } = await supabase
        .from('tenant_chatbot_activations')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .eq('template_id', templateId)
      
      if (deactivateError) {
        throw deactivateError
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Plantilla ${isEnabled ? 'activada' : 'desactivada'} correctamente`
    })
    
  } catch (error) {
    console.error('Error al actualizar estado de plantilla:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 })
  }
}