import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/services/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Por ahora usar un tenant_id hardcodeado para desarrollo
    // TODO: Obtener el tenant_id real del usuario autenticado
    const tenantId = 'afa60b0a-3046-4607-9c48-266af6e1d322'
    
    // Obtener todas las plantillas publicadas
    const { data: templates, error } = await supabase
      .from('chatbot_templates')
      .select('id, name, description, status, created_at, updated_at, react_flow_json')
      .eq('status', 'published')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al obtener plantillas:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
    
    // Obtener qué plantilla está activa para este tenant
    const { data: activeTemplates, error: activeError } = await supabase
      .from('tenant_chatbot_activations')
      .select('template_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
    
    if (activeError) {
      console.error('Error al obtener plantillas activas:', activeError)
    }
    
    const activeTemplateIds = activeTemplates?.map(at => at.template_id) || []
    
    // Transformar las plantillas al formato esperado por el frontend
    const formattedTemplates = templates?.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      is_active: activeTemplateIds.includes(template.id),
      created_at: template.created_at,
      updated_at: template.updated_at,
      flows: template.react_flow_json || []
    })) || []
    
    // Devolver las plantillas en el formato que espera el frontend
    return NextResponse.json({
      success: true,
      templates: formattedTemplates
    })
  } catch (error) {
    console.error('Error en endpoint de plantillas:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}