/**
 * API para mostrar y depurar la estructura de nodos de una plantilla
 */
import { NextResponse } from 'next/server';
import { supabase } from '@/services/supabase/SupabaseClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('templateId');
  
  if (!templateId) {
    return NextResponse.json({ error: 'Se requiere templateId' }, { status: 400 });
  }
  
  try {
    // Obtener la plantilla
    const { data: template, error } = await supabase
      .from('chatbot_templates')
      .select('id, name, react_flow_json')
      .eq('id', templateId)
      .single();
    
    if (error) {
      return NextResponse.json({ error: `Error al obtener la plantilla: ${error.message}` }, { status: 500 });
    }
    
    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    const flowJson = template.react_flow_json;
    const nodes = flowJson?.nodes || [];
    const edges = flowJson?.edges || [];
    
    // Ordenar los nodos por posición Y para entender la estructura
    const orderedNodes = [...nodes].sort((a, b) => {
      const aY = a.position?.y || 0;
      const bY = b.position?.y || 0;
      return aY - bY;
    });
    
    // Información simplificada de nodos
    const simpleNodes = orderedNodes.map(node => ({
      id: node.id,
      type: node.type,
      data: {
        label: node.data?.label,
        message: node.data?.message || node.data?.messageText,
        question: node.data?.question || node.data?.prompt,
        waitForResponse: node.data?.waitForResponse
      }
    }));
    
    // Crear mapa de conexiones
    const connectionMap: Record<string, string[]> = {};
    
    for (const edge of edges) {
      if (!connectionMap[edge.source]) {
        connectionMap[edge.source] = [];
      }
      connectionMap[edge.source].push(`${edge.sourceHandle || 'next'} → ${edge.target}`);
    }
    
    // Reconstruir el flujo esperado
    const expectedFlow: string[] = [];
    let currentNodeId = null;
    
    // Buscar el nodo start-node
    const startNode = nodes.find(n => n.id === 'start-node' || n.type === 'startNode');
    if (startNode) {
      currentNodeId = startNode.id;
      expectedFlow.push(currentNodeId);
      
      // Seguir las conexiones hasta 10 saltos
      for (let i = 0; i < 10; i++) {
        if (!currentNodeId || !connectionMap[currentNodeId]) break;
        
        const nextConn = connectionMap[currentNodeId].find(c => c.startsWith('next'));
        if (!nextConn) break;
        
        const nextNodeId = nextConn.split('→')[1].trim();
        if (!nextNodeId) break;
        
        expectedFlow.push(nextNodeId);
        currentNodeId = nextNodeId;
      }
    }

    return NextResponse.json({
      templateInfo: {
        id: template.id,
        name: template.name
      },
      nodeCount: nodes.length,
      edgeCount: edges.length,
      orderedNodes: simpleNodes,
      connectionMap,
      expectedFlow
    });
  } catch (err) {
    console.error('Error en endpoint de diagnóstico:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}