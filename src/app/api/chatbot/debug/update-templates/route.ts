/**
 * frontend/src/app/api/chatbot/debug/update-templates/route.ts
 * Endpoint para verificar y actualizar propiedades de waitForResponse en plantillas
 * 
 * @version 1.0.0
 * @updated 2025-07-14
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/services/supabase/SupabaseClient';

/**
 * API endpoint para actualizar todas las plantillas asegurando 
 * que los nodos de mensaje tengan la propiedad waitForResponse
 */
export async function GET(request: Request) {
  try {
    // Obtener todas las plantillas activas
    const { data: templates, error } = await supabase
      .from('chatbot_templates')
      .select('id, name, react_flow_json')
      .eq('is_deleted', false);
    
    if (error) {
      throw new Error(`Error al obtener plantillas: ${error.message}`);
    }
    
    if (!templates || templates.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'No se encontraron plantillas para actualizar',
        count: 0
      });
    }
    
    const results: any[] = [];
    let updatedCount = 0;
    
    // Procesar cada plantilla
    for (const template of templates) {
      const flowJson = template.react_flow_json;
      let wasUpdated = false;
      
      if (!flowJson || !flowJson.nodes || !Array.isArray(flowJson.nodes)) {
        results.push({
          id: template.id,
          name: template.name,
          status: 'skipped',
          reason: 'No tiene estructura de nodos válida'
        });
        continue;
      }
      
      // Revisar y actualizar cada nodo
      for (const node of flowJson.nodes) {
        // Verificar si es un nodo de mensaje
        if (
          (node.type === 'messageNode' || 
           node.type === 'message' || 
           node.type === 'text') && 
          node.data
        ) {
          // Si es nodo de bienvenida, por defecto usar auto-flow
          const isWelcomeNode = 
            node.id === 'messageNode-welcome' || 
            node.id.includes('welcome') ||
            (node.data.label && (
              node.data.label.includes('Bienvenida') || 
              node.data.label.includes('Welcome')
            ));
          
          // Si la propiedad waitForResponse no está definida
          if (node.data.waitForResponse === undefined) {
            // Por defecto, nodos de bienvenida usan auto-flow (waitForResponse=false)
            // y otros nodos de mensaje esperan respuesta (waitForResponse=true)
            node.data.waitForResponse = isWelcomeNode ? false : true;
            wasUpdated = true;
          }
        }
      }
      
      // Si se actualizó la plantilla, guardarla
      if (wasUpdated) {
        const { error: updateError } = await supabase
          .from('chatbot_templates')
          .update({ react_flow_json: flowJson })
          .eq('id', template.id);
        
        if (updateError) {
          results.push({
            id: template.id,
            name: template.name,
            status: 'error',
            error: updateError.message
          });
        } else {
          results.push({
            id: template.id,
            name: template.name,
            status: 'updated'
          });
          updatedCount++;
        }
      } else {
        results.push({
          id: template.id,
          name: template.name,
          status: 'unchanged',
          reason: 'No requirió actualización'
        });
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: `Proceso completado. Se actualizaron ${updatedCount} de ${templates.length} plantillas.`,
      count: templates.length,
      updatedCount,
      results
    });
  } catch (error) {
    console.error('Error al procesar plantillas:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Error desconocido',
      error: error
    }, { status: 500 });
  }
}