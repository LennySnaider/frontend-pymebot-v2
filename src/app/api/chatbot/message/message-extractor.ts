/**
 * frontend/src/app/api/chatbot/message/message-extractor.ts
 * Utilidad para extraer mensajes de plantillas de chatbot
 * @version 1.1.0
 * @updated 2025-05-11
 */

interface MessageNode {
  id: string;
  type?: string;
  data?: any;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

interface FlowData {
  nodes?: MessageNode[];
  edges?: FlowEdge[];
}

/**
 * Extrae el mensaje de un nodo según diferentes estructuras posibles
 * @param node Nodo de mensaje
 * @returns Mensaje extraído o null si no se encontró
 */
export function extractMessageFromNode(node: MessageNode): { message: string | null, source: string } {
  if (!node || !node.data) {
    return { message: null, source: 'node_without_data' };
  }

  // Buscar en propiedades comunes
  if (node.data.message) {
    return { message: node.data.message, source: 'data.message' };
  }
  
  if (node.data.messageText) {
    return { message: node.data.messageText, source: 'data.messageText' };
  }
  
  if (node.data.content) {
    return { message: node.data.content, source: 'data.content' };
  }
  
  if (node.data.text) {
    return { message: node.data.text, source: 'data.text' };
  }

  // Buscar en propiedades anidadas (por ejemplo data.data.message)
  if (node.data.data) {
    if (typeof node.data.data === 'object') {
      if (node.data.data.message) {
        return { message: node.data.data.message, source: 'data.data.message' };
      }
      if (node.data.data.messageText) {
        return { message: node.data.data.messageText, source: 'data.data.messageText' };
      }
      if (node.data.data.content) {
        return { message: node.data.data.content, source: 'data.data.content' };
      }
      if (node.data.data.text) {
        return { message: node.data.data.text, source: 'data.data.text' };
      }
    }
  }

  // Buscar cualquier propiedad que podría contener un mensaje (textos largos)
  const textProperties = Object.entries(node.data)
    .filter(([key, value]) => 
      typeof value === 'string' && 
      value.length > 10 && 
      !key.includes('id') && 
      !key.includes('type')
    );

  if (textProperties.length > 0) {
    const [propName, propValue] = textProperties[0];
    return { message: propValue as string, source: `data.${propName}` };
  }

  // No se encontró un mensaje
  return { message: null, source: 'no_message_found' };
}

/**
 * Encuentra nodos de inicio en un flujo
 * @param nodes Lista de nodos
 * @returns Array de nodos de inicio encontrados
 */
export function findStartNodes(nodes: MessageNode[]): MessageNode[] {
  if (!nodes || !Array.isArray(nodes)) {
    return [];
  }

  return nodes.filter(node => {
    // Verificar tipo directo del nodo
    if (node.type && typeof node.type === 'string' && node.type.toLowerCase().includes('start')) {
      return true;
    }

    // Verificar en data.type o data.nodeType
    if (node.data) {
      if (node.data.type && typeof node.data.type === 'string' && node.data.type.toLowerCase().includes('start')) {
        return true;
      }
      if (node.data.nodeType && typeof node.data.nodeType === 'string' && node.data.nodeType.toLowerCase().includes('start')) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Encuentra nodos de mensaje en un flujo
 * @param nodes Lista de nodos
 * @returns Array de nodos de mensaje encontrados
 */
export function findMessageNodes(nodes: MessageNode[]): MessageNode[] {
  if (!nodes || !Array.isArray(nodes)) {
    return [];
  }

  return nodes.filter(node => {
    // Verificar tipo directo del nodo
    if (node.type && typeof node.type === 'string' && 
        (node.type === 'messageNode' || node.type.toLowerCase().includes('message'))) {
      return true;
    }

    // Verificar en data.type o data.nodeType
    if (node.data) {
      if (node.data.type && typeof node.data.type === 'string' && 
          (node.data.type === 'messageNode' || node.data.type.toLowerCase().includes('message'))) {
        return true;
      }
      if (node.data.nodeType && typeof node.data.nodeType === 'string' && 
          (node.data.nodeType === 'messageNode' || node.data.nodeType.toLowerCase().includes('message'))) {
        return true;
      }
    }

    // Verificar si tiene propiedades que sugieren que es un nodo de mensaje
    if (node.data && (
      node.data.message || 
      node.data.messageText || 
      node.data.content || 
      (node.data.text && typeof node.data.text === 'string' && node.data.text.length > 10)
    )) {
      return true;
    }

    return false;
  });
}

/**
 * Encuentra el primer mensaje de un flujo siguiendo las conexiones desde el nodo inicial
 * @param flowData Datos del flujo (nodos y conexiones)
 * @returns Mensaje encontrado o null
 */
export function findInitialMessage(flowData: FlowData): { message: string | null, diagnostics: any } {
  const diagnostics: any = {
    hasNodes: !!flowData.nodes && Array.isArray(flowData.nodes),
    nodesCount: flowData.nodes?.length || 0,
    hasEdges: !!flowData.edges && Array.isArray(flowData.edges),
    edgesCount: flowData.edges?.length || 0,
    startNodesFound: 0,
    messageNodesFound: 0,
    messageSource: null
  };

  // Verificar estructura básica
  if (!flowData.nodes || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0) {
    return { message: null, diagnostics: { ...diagnostics, error: 'No hay nodos en el flujo' } };
  }

  // Buscar nodos de inicio
  const startNodes = findStartNodes(flowData.nodes);
  diagnostics.startNodesFound = startNodes.length;

  if (startNodes.length === 0) {
    // Si no hay nodos de inicio, buscar nodos de mensaje directamente
    const messageNodes = findMessageNodes(flowData.nodes);
    diagnostics.messageNodesFound = messageNodes.length;

    if (messageNodes.length > 0) {
      // Usar el primer nodo de mensaje encontrado
      const extractedMessage = extractMessageFromNode(messageNodes[0]);
      diagnostics.messageSource = extractedMessage.source;
      return { 
        message: extractedMessage.message, 
        diagnostics: { ...diagnostics, fallbackToFirstMessageNode: true }
      };
    }

    return { message: null, diagnostics: { ...diagnostics, error: 'No hay nodos de mensaje en el flujo' } };
  }

  // Si hay nodos de inicio, seguir las conexiones para encontrar el primer mensaje
  const startNode = startNodes[0]; // Usar el primer nodo de inicio
  diagnostics.startNodeId = startNode.id;

  // Si no hay conexiones, verificar si el nodo inicial ya tiene un mensaje
  if (!flowData.edges || !Array.isArray(flowData.edges) || flowData.edges.length === 0) {
    const startNodeMessage = extractMessageFromNode(startNode);
    diagnostics.messageSource = startNodeMessage.source;
    
    if (startNodeMessage.message) {
      return { 
        message: startNodeMessage.message, 
        diagnostics: { ...diagnostics, messageFromStartNode: true }
      };
    }

    // Si no hay mensaje en el nodo inicial, buscar cualquier nodo de mensaje
    const messageNodes = findMessageNodes(flowData.nodes);
    diagnostics.messageNodesFound = messageNodes.length;
    
    if (messageNodes.length > 0) {
      const extractedMessage = extractMessageFromNode(messageNodes[0]);
      diagnostics.messageSource = extractedMessage.source;
      return { 
        message: extractedMessage.message, 
        diagnostics: { ...diagnostics, fallbackToMessageNodeWithoutEdges: true }
      };
    }

    return { message: null, diagnostics: { ...diagnostics, error: 'No hay conexiones ni mensajes' } };
  }

  // Buscar conexiones desde el nodo inicial
  const startEdges = flowData.edges.filter(edge => edge.source === startNode.id);
  diagnostics.startNodeEdgesCount = startEdges.length;

  if (startEdges.length === 0) {
    // No hay conexiones desde el nodo inicial, verificar si el propio nodo tiene un mensaje
    const startNodeMessage = extractMessageFromNode(startNode);
    diagnostics.messageSource = startNodeMessage.source;
    
    if (startNodeMessage.message) {
      return { 
        message: startNodeMessage.message, 
        diagnostics: { ...diagnostics, messageFromStartNodeWithoutEdges: true }
      };
    }

    // Buscar cualquier nodo de mensaje
    const messageNodes = findMessageNodes(flowData.nodes);
    diagnostics.messageNodesFound = messageNodes.length;
    
    if (messageNodes.length > 0) {
      const extractedMessage = extractMessageFromNode(messageNodes[0]);
      diagnostics.messageSource = extractedMessage.source;
      return { 
        message: extractedMessage.message, 
        diagnostics: { ...diagnostics, fallbackToMessageNodeWithNoStartEdges: true }
      };
    }

    return { message: null, diagnostics: { ...diagnostics, error: 'Nodo inicial sin conexiones ni mensajes' } };
  }

  // Seguir la primera conexión desde el nodo inicial
  const firstEdge = startEdges[0];
  diagnostics.firstEdgeTarget = firstEdge.target;

  // Buscar el nodo destino
  const targetNode = flowData.nodes.find(node => node.id === firstEdge.target);
  
  if (!targetNode) {
    return { message: null, diagnostics: { ...diagnostics, error: 'Nodo destino no encontrado' } };
  }

  diagnostics.targetNodeType = targetNode.type || (targetNode.data?.type || targetNode.data?.nodeType || 'unknown');
  
  // Extraer mensaje del nodo destino
  const extractedMessage = extractMessageFromNode(targetNode);
  diagnostics.messageSource = extractedMessage.source;

  if (extractedMessage.message) {
    return { 
      message: extractedMessage.message, 
      diagnostics: { ...diagnostics, messageFromTargetNode: true }
    };
  }

  // Si no hay mensaje en el nodo destino, buscar cualquier nodo de mensaje
  const messageNodes = findMessageNodes(flowData.nodes);
  diagnostics.messageNodesFound = messageNodes.length;
  
  if (messageNodes.length > 0) {
    const messageNodeExtract = extractMessageFromNode(messageNodes[0]);
    diagnostics.messageSource = messageNodeExtract.source;
    return { 
      message: messageNodeExtract.message, 
      diagnostics: { ...diagnostics, fallbackToMessageNodeAfterTargetFailure: true }
    };
  }

  // No se encontró ningún mensaje en el flujo
  return { message: null, diagnostics: { ...diagnostics, error: 'No se encontró ningún mensaje en el flujo' } };
}

/**
 * Extrae un mensaje de bienvenida desde una plantilla de chatbot, sin depender del flujo.
 * Busca cualquier mensaje en la plantilla que pueda servir como saludo.
 *
 * @param templateId ID de la plantilla
 * @param tenantId ID del tenant (opcional)
 * @param supabase Cliente de Supabase inicializado
 * @returns Mensaje de bienvenida y diagnósticos, o null si no se encuentra
 */
export async function extractWelcomeMessage(
  templateId: string,
  tenantId: string | null,
  supabase: any
): Promise<{ message: string | null, diagnostics: any }> {
  const diagnostics: any = {
    templateId,
    tenantId: tenantId || 'Sin tenant',
    searchMethod: 'none',
    error: null
  };

  try {
    // 1. Primero intentamos obtener la plantilla directamente
    diagnostics.searchMethod = 'direct_template';
    const { data: templateData, error: templateError } = await supabase
      .from('chatbot_templates')
      .select('id, name, react_flow_json')
      .eq('id', templateId)
      .single();

    if (templateError || !templateData) {
      diagnostics.error = `No se pudo obtener la plantilla: ${templateError?.message || 'No encontrada'}`;

      // 2. Si no encontramos por ID exacto, buscar por nombre similar
      if (templateId.includes('basico') || templateId.includes('lead')) {
        diagnostics.searchMethod = 'similar_name';
        const { data: similarTemplates } = await supabase
          .from('chatbot_templates')
          .select('id, name, react_flow_json')
          .ilike('name', '%basico%')
          .ilike('name', '%lead%')
          .limit(1);

        if (similarTemplates && similarTemplates.length > 0) {
          const template = similarTemplates[0];
          diagnostics.foundSimilarTemplate = template.name;

          // Extraer mensaje de esta plantilla
          if (template.react_flow_json) {
            const flowResult = findInitialMessage(template.react_flow_json);
            if (flowResult.message) {
              return {
                message: flowResult.message,
                diagnostics: {
                  ...diagnostics,
                  source: 'similar_template',
                  messageSource: flowResult.diagnostics.messageSource
                }
              };
            }
          }
        }
      }

      // 3. Si aún no encontramos, buscar cualquier plantilla de bienvenida
      diagnostics.searchMethod = 'any_template';
      const { data: anyTemplates } = await supabase
        .from('chatbot_templates')
        .select('id, name, react_flow_json')
        .limit(1);

      if (anyTemplates && anyTemplates.length > 0) {
        const template = anyTemplates[0];
        diagnostics.foundAnyTemplate = template.name;

        // Extraer mensaje de esta plantilla
        if (template.react_flow_json) {
          const flowResult = findInitialMessage(template.react_flow_json);
          if (flowResult.message) {
            return {
              message: flowResult.message,
              diagnostics: {
                ...diagnostics,
                source: 'any_template',
                messageSource: flowResult.diagnostics.messageSource
              }
            };
          }
        }
      }

      // 4. Si todo falla, devolver null para que el sistema use respuestas genéricas
      return { message: null, diagnostics };
    }

    // Si encontramos la plantilla directamente, extraer mensaje
    if (!templateData.react_flow_json) {
      diagnostics.error = 'La plantilla existe pero no tiene datos de flujo';
      return { message: null, diagnostics };
    }

    // Usar nuestro extractor para encontrar un mensaje
    const flowResult = findInitialMessage(templateData.react_flow_json);
    return {
      message: flowResult.message,
      diagnostics: {
        ...diagnostics,
        source: 'direct_template',
        messageSource: flowResult.diagnostics.messageSource
      }
    };
  } catch (error) {
    diagnostics.error = `Error al buscar mensaje de bienvenida: ${error.message}`;
    return { message: null, diagnostics };
  }
}