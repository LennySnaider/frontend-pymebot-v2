/**
 * v2-frontend-pymebot/src/app/api/chatbot/debug/route.ts
 * Endpoint de depuración para inspeccionar plantillas de chatbot
 * 
 * IMPORTANTE: Este endpoint es solo para depuración y debe desactivarse en producción
 * 
 * @version 1.0.0
 * @updated 2025-05-14
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Obtener el templateId desde los parámetros de la URL
    const url = new URL(req.url);
    const templateId = url.searchParams.get('templateId');
    
    if (!templateId) {
      return NextResponse.json({ error: 'El parámetro templateId es requerido' }, { status: 400 });
    }
    
    // Obtener la plantilla
    const { data: template, error } = await supabase
      .from('chatbot_templates')
      .select('id, name, status, react_flow_json')
      .eq('id', templateId)
      .single();
    
    if (error) {
      return NextResponse.json({ error: `Error al obtener la plantilla: ${error.message}` }, { status: 500 });
    }
    
    if (!template) {
      return NextResponse.json({ error: 'No se encontró la plantilla' }, { status: 404 });
    }
    
    // Analizar la estructura para fines de depuración
    const nodes = template.react_flow_json?.nodes || [];
    const edges = template.react_flow_json?.edges || [];
    
    // Construir mapa de conexiones
    const connectionMap = {};
    for (const edge of edges) {
      const { source, sourceHandle, target } = edge;
      if (!connectionMap[source]) connectionMap[source] = {};
      const handle = sourceHandle || 'next';
      connectionMap[source][handle] = target;
    }
    
    // Identificar posibles nodos iniciales
    const initialNodes = [];
    for (const node of nodes) {
      const nodeId = node.id?.toLowerCase() || '';
      const nodeType = node.type?.toLowerCase() || '';
      const nodeLabel = node.data?.label?.toLowerCase() || '';
      
      if (nodeId.includes('start') || nodeId.includes('inicio') || nodeId.includes('bienvenida') ||
          nodeType === 'start' || nodeType === 'inicio' || nodeType === 'bienvenida' ||
          nodeLabel === 'inicio' || nodeLabel === 'bienvenida' || nodeLabel === 'start' ||
          nodeLabel.includes('welcome') || nodeLabel.includes('hola')) {
        initialNodes.push({
          id: node.id,
          type: node.type,
          label: node.data?.label,
          messageText: node.data?.messageText,
          connections: connectionMap[node.id] || {}
        });
      }
    }
    
    // Ordenar nodos por posición Y para ver cuál está más arriba
    const topNodes = [...nodes]
      .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0))
      .slice(0, 3)
      .map(node => ({
        id: node.id,
        type: node.type,
        label: node.data?.label,
        position: node.position,
        connections: connectionMap[node.id] || {}
      }));
    
    // Simplificar la respuesta para que sea más legible
    const simplifiedNodes = nodes.map(node => ({
      id: node.id,
      type: node.type,
      label: node.data?.label,
      messageText: node.data?.messageText,
      position: node.position,
      connections: connectionMap[node.id] || {}
    }));
    
    return NextResponse.json({
      id: template.id,
      name: template.name,
      status: template.status,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      initialNodes,
      topNodes,
      nodes: simplifiedNodes,
      connections: connectionMap
    });
  } catch (error) {
    console.error('Error en endpoint de depuración:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}