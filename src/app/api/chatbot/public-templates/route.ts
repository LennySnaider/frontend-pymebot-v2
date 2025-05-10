/**
 * frontend/src/app/api/chatbot/public-templates/route.ts
 * API para obtener plantillas de chatbot publicadas para el tenant actual
 * @version 1.1.0
 * @updated 2025-05-11
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuración del backend externo
const BACKEND_URL = process.env.CHATBOT_BACKEND_URL || 'http://localhost:3090'

/**
 * Handler para solicitudes GET - Listar plantillas disponibles para el tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Obtener el tenant ID de la cookie o query param (para propósitos de desarrollo)
    const cookieStore = cookies()
    const tenantIdCookie = cookieStore.get('tenant_id')?.value
    const tenantIdQuery = req.nextUrl.searchParams.get('tenant_id')
    const tenantId = tenantIdCookie || tenantIdQuery || 'default'

    console.log('🔎 DIAGNÓSTICO PLANTILLAS 🔎 Obteniendo para tenant:', tenantId)
    
    // NUEVO: Intentar obtener plantillas del backend primero
    try {
      console.log(`🔎 DIAGNÓSTICO PLANTILLAS 🔎 Intentando obtener plantillas del backend en ${BACKEND_URL}/api/text/templates`)
      
      const backendResponse = await fetch(`${BACKEND_URL}/api/text/templates?tenant_id=${tenantId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (backendResponse.ok) {
        const data = await backendResponse.json()
        console.log('🔎 DIAGNÓSTICO PLANTILLAS 🔎 Plantillas obtenidas del backend:', data)
        
        if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
          console.log(`🔎 DIAGNÓSTICO PLANTILLAS 🔎 ${data.templates.length} plantillas del backend serán utilizadas`)
          
          // Asegurar que al menos una plantilla esté activa
          const formattedTemplates = data.templates.map((template: any, index: number) => ({
            id: template.id,
            name: template.name,
            description: template.description || 'Sin descripción',
            isActive: template.isActive || false,
            isEnabled: true,
            avatarUrl: '/img/avatars/thumb-2.jpg',
            tokensEstimated: template.tokensEstimated || 500,
            category: template.category || 'general',
            flowId: template.flowId || null
          }))
          
          // Si ninguna está activa, activar la primera
          if (!formattedTemplates.some(t => t.isActive) && formattedTemplates.length > 0) {
            formattedTemplates[0].isActive = true;
          }
          
          return NextResponse.json({
            success: true,
            templates: formattedTemplates,
            source: 'backend_externo'
          })
        }
      } else {
        console.warn(`🔎 DIAGNÓSTICO PLANTILLAS 🔎 Error del backend al obtener plantillas: ${backendResponse.status} ${backendResponse.statusText}`)
      }
    } catch (backendError) {
      console.warn('🔎 DIAGNÓSTICO PLANTILLAS 🔎 Error al obtener plantillas del backend, usando procesamiento local:', backendError)
    }

    // Función auxiliar para verificar si una plantilla tiene datos de flujo válidos
    const verifyFlowJson = async (templateId: string) => {
      try {
        const { data, error } = await supabase
          .from('chatbot_templates')
          .select('id, react_flow_json')
          .eq('id', templateId)
          .single();

        if (error || !data) {
          console.warn(`🔎 PLANTILLA ${templateId} 🔎 Error al verificar react_flow_json:`, error);
          return false;
        }

        if (!data.react_flow_json) {
          console.warn(`🔎 PLANTILLA ${templateId} 🔎 No tiene react_flow_json`);
          return false;
        }

        // Validar estructura básica del flujo
        const flowJson = data.react_flow_json;
        let hasValidStructure = false;

        if (typeof flowJson === 'object' && flowJson !== null) {
          if (flowJson.nodes && Array.isArray(flowJson.nodes) && flowJson.nodes.length > 0) {
            hasValidStructure = true;
          }
        } else if (typeof flowJson === 'string') {
          try {
            const parsedFlow = JSON.parse(flowJson);
            if (parsedFlow && parsedFlow.nodes && Array.isArray(parsedFlow.nodes) && parsedFlow.nodes.length > 0) {
              hasValidStructure = true;
            }
          } catch (parseError) {
            console.error(`🔎 PLANTILLA ${templateId} 🔎 No se pudo parsear react_flow_json:`, parseError);
          }
        }

        console.log(`🔎 PLANTILLA ${templateId} 🔎 Tiene estructura válida: ${hasValidStructure}`);
        return hasValidStructure;
      } catch (error) {
        console.error(`🔎 PLANTILLA ${templateId} 🔎 Error al verificar flujo:`, error);
        return false;
      }
    };

    // Todas las búsquedas ahora incluyen react_flow_json para diagnóstico
    const templateFields = 'id, name, description, created_at, updated_at, status, react_flow_json';

    // Si no hay tenant, simplemente obtener todas las plantillas publicadas
    if (tenantId === 'default') {
      const { data: allTemplates, error: allTemplatesError } = await supabase
        .from('chatbot_templates')
        .select(templateFields)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (allTemplatesError) {
        console.error('🔎 ERROR AL OBTENER PLANTILLAS 🔎', allTemplatesError);
        return NextResponse.json(
          { error: 'Error al obtener plantillas', details: allTemplatesError.message },
          { status: 500 }
        )
      }

      console.log(`🔎 PLANTILLAS ENCONTRADAS 🔎 Total: ${allTemplates?.length || 0}`);

      if (allTemplates && allTemplates.length > 0) {
        // Verificar cada plantilla para depuración
        console.log('🔎 LISTADO PLANTILLAS 🔎', allTemplates.map(t => ({
          id: t.id,
          name: t.name,
          hasFlowJson: !!t.react_flow_json
        })));

        // Filtrar solo las plantillas que tienen datos de flujo válidos
        const validTemplates = [];

        for (const template of allTemplates) {
          const isValid = await verifyFlowJson(template.id);
          if (isValid) {
            validTemplates.push(template);
          }
        }

        console.log(`🔎 PLANTILLAS VÁLIDAS 🔎 ${validTemplates.length} de ${allTemplates.length}`);

        // Usar plantillas generales
        const formattedTemplates = validTemplates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description || 'Sin descripción',
          isActive: false,
          isEnabled: true,
          avatarUrl: '/img/avatars/thumb-2.jpg',
          createdAt: template.created_at,
          updatedAt: template.updated_at,
          hasFlowData: !!template.react_flow_json // Para diagnóstico en frontend
        }))

        // Asegurar que al menos una esté activa si hay plantillas
        if (formattedTemplates.length > 0) {
          formattedTemplates[0].isActive = true;

          // Verificar si hay una plantilla relacionada con lead
          const leadTemplate = formattedTemplates.find(t =>
            t.name.toLowerCase().includes('lead') &&
            t.name.toLowerCase().includes('basico'));

          if (leadTemplate) {
            // Desactivar todas
            formattedTemplates.forEach(t => t.isActive = false);
            // Activar solo la de lead
            leadTemplate.isActive = true;
            console.log(`🔎 PLANTILLA LEAD ACTIVADA 🔎 ${leadTemplate.name} (${leadTemplate.id})`);
          }
        }

        return NextResponse.json({
          success: true,
          templates: formattedTemplates,
          source: 'local_database'
        })
      } else {
        console.warn('🔎 NO SE ENCONTRARON PLANTILLAS 🔎');
        // Si no hay plantillas, crear una plantilla básica
        return NextResponse.json({
          success: true,
          templates: [{
            id: '00000000-0000-0000-0000-000000000000',
            name: 'Plantilla Básica',
            description: 'Plantilla básica generada automáticamente',
            isActive: true,
            isEnabled: true,
            avatarUrl: '/img/avatars/thumb-2.jpg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            hasFlowData: true
          }],
          source: 'fallback_mock'
        })
      }
    }

    // Si hay tenant específico, intentar obtener las plantillas para él
    console.log(`🔎 BÚSQUEDA DE FLUJOS 🔎 Tenant: ${tenantId}`);

    // Consultar flows (instancias de plantillas) para este tenant
    const { data: flows, error: flowsError } = await supabase
      .from('flows')
      .select(`
        id,
        is_active,
        parent_template_id,
        chatbot_templates!inner(
          ${templateFields}
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('chatbot_templates.status', 'published')
      .order('created_at', { ascending: false })

    if (flowsError) {
      console.error('🔎 ERROR AL OBTENER FLUJOS 🔎', flowsError);
    }

    if (!flows || flows.length === 0 || flowsError) {
      console.warn('🔎 NO SE ENCONTRARON FLUJOS PARA ESTE TENANT 🔎 Buscando plantillas generales');

      // Caer back a todas las plantillas publicadas
      const { data: allTemplates, error: allTemplatesError } = await supabase
        .from('chatbot_templates')
        .select(templateFields)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (allTemplatesError) {
        console.error('🔎 ERROR AL OBTENER PLANTILLAS GENERALES 🔎', allTemplatesError);
        return NextResponse.json(
          { error: 'Error al obtener plantillas', details: allTemplatesError.message },
          { status: 500 }
        )
      }

      console.log(`🔎 PLANTILLAS GENERALES ENCONTRADAS 🔎 Total: ${allTemplates?.length || 0}`);

      if (allTemplates && allTemplates.length > 0) {
        // Verificar cada plantilla para depuración
        console.log('🔎 LISTADO PLANTILLAS GENERALES 🔎', allTemplates.map(t => ({
          id: t.id,
          name: t.name,
          hasFlowJson: !!t.react_flow_json
        })));

        // Filtrar solo las plantillas que tienen datos de flujo válidos
        const validTemplates = [];

        for (const template of allTemplates) {
          const isValid = await verifyFlowJson(template.id);
          if (isValid) {
            validTemplates.push(template);
          }
        }

        console.log(`🔎 PLANTILLAS GENERALES VÁLIDAS 🔎 ${validTemplates.length} de ${allTemplates.length}`);

        // Usar plantillas generales si no hay específicas para el tenant
        const formattedTemplates = validTemplates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description || 'Sin descripción',
          isActive: false,
          isEnabled: true,
          avatarUrl: '/img/avatars/thumb-2.jpg',
          createdAt: template.created_at,
          updatedAt: template.updated_at,
          hasFlowData: !!template.react_flow_json // Para diagnóstico en frontend
        }))

        // Asegurar que al menos una esté activa si hay plantillas
        if (formattedTemplates.length > 0) {
          formattedTemplates[0].isActive = true;

          // Verificar si hay una plantilla relacionada con lead
          const leadTemplate = formattedTemplates.find(t =>
            t.name.toLowerCase().includes('lead') &&
            t.name.toLowerCase().includes('basico'));

          if (leadTemplate) {
            // Desactivar todas
            formattedTemplates.forEach(t => t.isActive = false);
            // Activar solo la de lead
            leadTemplate.isActive = true;
            console.log(`🔎 PLANTILLA LEAD ACTIVADA 🔎 ${leadTemplate.name} (${leadTemplate.id})`);
          }
        }

        return NextResponse.json({
          success: true,
          templates: formattedTemplates,
          source: 'local_database_fallback'
        })
      } else {
        console.warn('🔎 NO SE ENCONTRARON PLANTILLAS GENERALES 🔎');
        // Si no hay plantillas, crear una plantilla básica
        return NextResponse.json({
          success: true,
          templates: [{
            id: '00000000-0000-0000-0000-000000000000',
            name: 'Plantilla Básica',
            description: 'Plantilla básica generada automáticamente',
            isActive: true,
            isEnabled: true,
            avatarUrl: '/img/avatars/thumb-2.jpg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            hasFlowData: true
          }],
          source: 'fallback_mock'
        })
      }
    }

    console.log(`🔎 FLUJOS ENCONTRADOS PARA TENANT 🔎 Total: ${flows.length}`);

    // Verificar cada flujo para depuración
    console.log('🔎 LISTADO FLUJOS 🔎', flows.map(f => ({
      id: f.id,
      templateId: f.chatbot_templates.id,
      name: f.chatbot_templates.name,
      isActive: f.is_active,
      hasFlowJson: !!f.chatbot_templates.react_flow_json
    })));

    // Filtrar solo los flujos con plantillas válidas
    const validFlows = [];

    for (const flow of flows) {
      const isValid = await verifyFlowJson(flow.chatbot_templates.id);
      if (isValid) {
        validFlows.push(flow);
      }
    }

    console.log(`🔎 FLUJOS VÁLIDOS 🔎 ${validFlows.length} de ${flows.length}`);

    // Transformar a formato esperado por el frontend
    const formattedTemplates = validFlows.map(flow => ({
      id: flow.chatbot_templates.id,
      name: flow.chatbot_templates.name,
      description: flow.chatbot_templates.description || 'Sin descripción',
      isActive: flow.is_active,
      isEnabled: true,
      avatarUrl: '/img/avatars/thumb-2.jpg',
      flowId: flow.id,
      createdAt: flow.chatbot_templates.created_at,
      updatedAt: flow.chatbot_templates.updated_at,
      hasFlowData: !!flow.chatbot_templates.react_flow_json // Para diagnóstico en frontend
    }))

    // Asegurarse de que al menos una esté marcada como activa
    if (formattedTemplates.length > 0 && !formattedTemplates.some(t => t.isActive)) {
      formattedTemplates[0].isActive = true;

      // Verificar si hay una plantilla relacionada con lead
      const leadTemplate = formattedTemplates.find(t =>
        t.name.toLowerCase().includes('lead') &&
        t.name.toLowerCase().includes('basico'));

      if (leadTemplate) {
        // Desactivar todas
        formattedTemplates.forEach(t => t.isActive = false);
        // Activar solo la de lead
        leadTemplate.isActive = true;
        console.log(`🔎 PLANTILLA LEAD ACTIVADA 🔎 ${leadTemplate.name} (${leadTemplate.id})`);
      }
    }

    return NextResponse.json({
      success: true,
      templates: formattedTemplates,
      source: 'local_database_tenant_specific'
    })
  } catch (error: any) {
    console.error('Error al obtener plantillas:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error.message,
        templates: [{
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Plantilla de Error',
          description: 'Plantilla generada debido a un error en el sistema',
          isActive: true,
          isEnabled: true,
          avatarUrl: '/img/avatars/thumb-2.jpg'
        }],
        source: 'error_fallback'
      },
      { status: 200 } // Siempre retornar 200 para mostrar al menos la plantilla por defecto
    )
  }
}