/**
 * frontend/src/app/api/debug/chatbot-templates/route.ts
 * Endpoint de diagnóstico para analizar las plantillas de chatbot
 * @version 1.0.0
 * @updated 2025-09-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Handler para solicitudes GET - Analizar plantillas de chatbot
 */
export async function GET(req: NextRequest) {
  try {
    // Obtener el ID de la plantilla desde los query params
    const templateId = req.nextUrl.searchParams.get('id')
    
    // Primero un diagnóstico general
    console.log('🔬 DIAGNÓSTICO DE CHATBOT 🔬 Iniciando...')
    console.log('🔬 CONFIGURACIÓN 🔬 URL Supabase:', supabaseUrl)
    
    const report = {
      timestamp: new Date().toISOString(),
      config: {
        supabaseUrl,
        templateId: templateId || 'no especificado'
      },
      templateCount: 0,
      templateDetails: null,
      structureAnalysis: null,
      flowsCount: 0,
      flowsDetails: null,
      messages: [],
      errors: []
    }
    
    // Si se proporcionó un ID específico, analizar solo esa plantilla
    if (templateId) {
      try {
        console.log(`🔬 DIAGNÓSTICO DE PLANTILLA 🔬 ID: ${templateId}`)
        
        const { data: template, error } = await supabase
          .from('chatbot_templates')
          .select('*')
          .eq('id', templateId)
          .single()
        
        if (error) {
          console.error('🔬 ERROR 🔬 No se pudo obtener la plantilla:', error)
          report.errors.push(`Error al obtener plantilla: ${error.message}`)
          return NextResponse.json(report, { status: 500 })
        }
        
        if (!template) {
          console.warn(`🔬 NO ENCONTRADA 🔬 No existe plantilla con ID: ${templateId}`)
          report.errors.push(`No se encontró la plantilla con ID: ${templateId}`)
          return NextResponse.json(report, { status: 404 })
        }
        
        // Información básica de la plantilla
        const templateSummary = {
          id: template.id,
          name: template.name,
          status: template.status,
          hasFlowJson: !!template.react_flow_json,
          flowJsonType: typeof template.react_flow_json
        }
        
        report.templateDetails = templateSummary
        report.messages.push(`Plantilla encontrada: ${template.name}`)
        
        // Analizar la estructura del flujo
        if (template.react_flow_json) {
          let flowJson = template.react_flow_json
          
          // Si es string, intentar parsearlo
          if (typeof flowJson === 'string') {
            try {
              flowJson = JSON.parse(flowJson)
              report.messages.push('react_flow_json parseado de string a objeto')
            } catch (parseError) {
              report.errors.push(`Error al parsear react_flow_json: ${parseError.message}`)
              return NextResponse.json(report, { status: 500 })
            }
          }
          
          // Análisis de estructura
          const structureAnalysis = {
            hasNodes: !!flowJson.nodes,
            nodesCount: flowJson.nodes?.length || 0,
            hasEdges: !!flowJson.edges,
            edgesCount: flowJson.edges?.length || 0,
            nodeTypes: {}
          }
          
          // Contar tipos de nodos
          if (flowJson.nodes && Array.isArray(flowJson.nodes)) {
            flowJson.nodes.forEach(node => {
              const nodeType = node.type || 'unknown'
              structureAnalysis.nodeTypes[nodeType] = (structureAnalysis.nodeTypes[nodeType] || 0) + 1
            })
            
            // Analizar nodos de mensaje
            const messageNodes = flowJson.nodes.filter(node => 
              node.type === 'messageNode' || 
              (node.data && (node.data.type === 'messageNode' || node.data.nodeType === 'messageNode'))
            )
            
            if (messageNodes.length > 0) {
              report.messages.push(`Se encontraron ${messageNodes.length} nodos de mensaje`)
              
              // Mostrar el primer nodo de mensaje como ejemplo
              const firstMessageNode = messageNodes[0]
              
              report.structureAnalysis = {
                ...structureAnalysis,
                messageNodesCount: messageNodes.length,
                firstMessageNodeId: firstMessageNode.id,
                firstMessageNodeType: firstMessageNode.type,
                firstMessageNodeDataKeys: firstMessageNode.data ? Object.keys(firstMessageNode.data) : [],
                messageExamples: messageNodes.slice(0, 3).map(node => ({
                  id: node.id,
                  message: node.data?.message || node.data?.messageText || node.data?.content || node.data?.text || 'No se encontró mensaje'
                }))
              }
            } else {
              report.errors.push('No se encontraron nodos de mensaje en la plantilla')
              report.structureAnalysis = structureAnalysis
            }
          } else {
            report.errors.push('La estructura del flujo no contiene un array de nodos válido')
            report.structureAnalysis = structureAnalysis
          }
        } else {
          report.errors.push('La plantilla no tiene datos de flujo (react_flow_json)')
        }
        
        // Buscar flujos asociados a esta plantilla
        const { data: flows, error: flowsError } = await supabase
          .from('flows')
          .select('id, tenant_id, is_active, created_at')
          .eq('parent_template_id', templateId)
        
        if (flowsError) {
          report.errors.push(`Error al buscar flujos: ${flowsError.message}`)
        } else {
          report.flowsCount = flows?.length || 0
          report.flowsDetails = flows || []
          report.messages.push(`Se encontraron ${flows?.length || 0} flujos que usan esta plantilla`)
        }
        
        return NextResponse.json(report)
      } catch (specificError) {
        console.error('🔬 ERROR EN DIAGNÓSTICO ESPECÍFICO 🔬', specificError)
        report.errors.push(`Error en diagnóstico específico: ${specificError.message}`)
        return NextResponse.json(report, { status: 500 })
      }
    }
    
    // Si no se proporcionó ID, analizar todas las plantillas
    try {
      const { data: templates, error: templatesError } = await supabase
        .from('chatbot_templates')
        .select('id, name, status, created_at, updated_at')
        .order('created_at', { ascending: false })
      
      if (templatesError) {
        console.error('🔬 ERROR 🔬 No se pudieron obtener las plantillas:', templatesError)
        report.errors.push(`Error al obtener plantillas: ${templatesError.message}`)
        return NextResponse.json(report, { status: 500 })
      }
      
      report.templateCount = templates?.length || 0
      report.messages.push(`Se encontraron ${templates?.length || 0} plantillas en total`)
      
      // Obtener plantillas con react_flow_json
      const { data: flowTemplates, error: flowError } = await supabase
        .from('chatbot_templates')
        .select('id, name')
        .not('react_flow_json', 'is', null)
      
      if (!flowError) {
        report.messages.push(`${flowTemplates?.length || 0} plantillas tienen datos de flujo`)
      }
      
      // Verificar flujos
      const { data: allFlows, error: allFlowsError } = await supabase
        .from('flows')
        .select('id, tenant_id, parent_template_id, is_active')
      
      if (allFlowsError) {
        report.errors.push(`Error al obtener flujos: ${allFlowsError.message}`)
      } else {
        report.flowsCount = allFlows?.length || 0
        report.messages.push(`Se encontraron ${allFlows?.length || 0} flujos en total`)
      }
      
      // Búsqueda de plantillas específicas para chatbot lead
      const { data: leadTemplates } = await supabase
        .from('chatbot_templates')
        .select('id, name, status')
        .ilike('name', '%lead%')
        .ilike('name', '%basico%')
      
      if (leadTemplates && leadTemplates.length > 0) {
        report.messages.push(`Se encontraron ${leadTemplates.length} plantillas relacionadas con "lead básico"`)
        report.templateDetails = leadTemplates
      } else {
        report.messages.push('No se encontraron plantillas relacionadas con "lead básico"')
      }
      
      return NextResponse.json(report)
    } catch (generalError) {
      console.error('🔬 ERROR EN DIAGNÓSTICO GENERAL 🔬', generalError)
      report.errors.push(`Error en diagnóstico general: ${generalError.message}`)
      return NextResponse.json(report, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error general en diagnóstico:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}