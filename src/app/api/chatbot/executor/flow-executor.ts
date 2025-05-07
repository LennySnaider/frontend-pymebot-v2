/**
 * frontend/src/app/api/chatbot/executor/flow-executor.ts
 * Motor de ejecución del flujo del chatbot
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import { executeNode } from './node-executor';
import { ConversationManager } from '../conversation/conversation-manager';
import { SessionStatus, ContentType } from '../conversation/conversation-types';
import { supabase } from '@/services/supabase/SupabaseClient';

// Tiempo máximo de ejecución del flujo (para evitar bucles infinitos)
const MAX_EXECUTION_STEPS = 10;

/**
 * Procesa un mensaje entrante y ejecuta el flujo del chatbot
 */
export async function processMessage(
  tenantId: string,
  userChannelId: string,
  userMessage: string,
  channelType: string = 'whatsapp'
): Promise<{ 
  responses: string[],
  sessionId: string,
  sessionStatus: SessionStatus
}> {
  // Crear el gestor de conversaciones
  const conversationManager = new ConversationManager(supabase);
  
  try {
    // Buscar sesión activa para este usuario/tenant
    let session = await conversationManager.findActiveSession(
      userChannelId,
      channelType,
      tenantId
    );
    
    // Si no hay sesión, crear una nueva
    if (!session) {
      session = await conversationManager.createSession(
        userChannelId,
        channelType,
        tenantId
      );
      
      console.log(`Creada nueva sesión ${session.id} para usuario ${userChannelId}`);
    }
    
    // Registrar el mensaje del usuario
    await conversationManager.addMessage(
      session.id,
      userMessage,
      ContentType.TEXT,
      true
    );
    
    // Si la sesión estaba esperando input, actualizar los datos de estado
    // con la respuesta del usuario
    if (session.status === SessionStatus.WAITING_INPUT && session.state_data?.waitingFor) {
      const { waitingFor } = session.state_data;
      
      if (waitingFor.variableName) {
        // Guardar la respuesta en el estado
        session = await conversationManager.updateSession(session.id, {
          status: SessionStatus.ACTIVE, // Ya no está esperando
          state_updates: {
            waitingFor: null, // Ya no está esperando
            [waitingFor.variableName]: userMessage
          }
        });
      }
    }
    
    // Obtener la plantilla activa y su configuración
    const { data: activation, error: activationError } = await supabase
      .from('tenant_chatbot_activations')
      .select('template_id')
      .eq('id', session.active_chatbot_activation_id)
      .single();
    
    if (activationError || !activation) {
      throw new Error(`No se pudo obtener la configuración de la activación ${session.active_chatbot_activation_id}`);
    }
    
    const { data: template, error: templateError } = await supabase
      .from('chatbot_templates')
      .select('react_flow_json')
      .eq('id', activation.template_id)
      .single();
    
    if (templateError || !template?.react_flow_json) {
      throw new Error(`No se pudo obtener la plantilla ${activation.template_id}`);
    }
    
    // Extraer definición de nodos
    const flowJson = template.react_flow_json;
    const nodes = flowJson.nodes || [];
    const edges = flowJson.edges || [];
    
    // Crear un mapa de nodos para búsqueda rápida
    const nodeMap = nodes.reduce((map: Record<string, any>, node: any) => {
      map[node.id] = node;
      return map;
    }, {});
    
    // Crear un mapa de conexiones entre nodos
    const connectionMap: Record<string, Record<string, string>> = {};
    
    for (const edge of edges) {
      const { source, sourceHandle, target } = edge;
      
      if (!connectionMap[source]) {
        connectionMap[source] = {};
      }
      
      // El handle puede ser 'next', 'yes', 'no', etc.
      const handle = sourceHandle || 'next';
      connectionMap[source][handle] = target;
    }
    
    // Iniciar ejecución del flujo desde el nodo actual
    let currentNodeId = session.current_node_id || 'start';
    let stateData = session.state_data || {};
    let stepCount = 0;
    const responses: string[] = [];
    
    // Ejecutar nodos en secuencia hasta que se requiera input del usuario o se llegue al final
    while (currentNodeId && stepCount < MAX_EXECUTION_STEPS) {
      const currentNode = nodeMap[currentNodeId];
      
      if (!currentNode) {
        console.error(`Nodo ${currentNodeId} no encontrado en la plantilla`);
        break;
      }
      
      // Registrar la transición al nodo actual
      await conversationManager.logNodeTransition(
        session.id,
        stepCount === 0 ? null : nodeMap[currentNodeId]?.id,
        currentNodeId,
        'system'
      );
      
      // Ejecutar el nodo actual
      const executionContext = {
        tenantId,
        sessionId: session.id,
        userId: userChannelId,
        nodeId: currentNodeId,
        stateData
      };
      
      const result = await executeNode(currentNode, executionContext);
      
      // Actualizar el estado con los resultados de la ejecución
      if (result.updatedStateData) {
        stateData = result.updatedStateData;
      }
      
      // Si hay un mensaje de respuesta, registrarlo
      if (result.responseMessage) {
        responses.push(result.responseMessage);
        
        await conversationManager.addMessage(
          session.id,
          result.responseMessage,
          ContentType.TEXT,
          false,
          currentNodeId,
          result.metadata
        );
      }
      
      // Determinar el siguiente nodo
      if (!result.nextNodeId) {
        // El nodo está esperando input del usuario
        await conversationManager.updateSession(session.id, {
          status: SessionStatus.WAITING_INPUT,
          current_node_id: currentNodeId,
          state_data: stateData
        });
        
        // Finalizar ejecución, esperando respuesta del usuario
        break;
      }
      
      // Buscar el siguiente nodo según las conexiones
      const connections = connectionMap[currentNodeId] || {};
      const nextNodeId = connections[result.nextNodeId];
      
      if (!nextNodeId) {
        console.warn(`No se encontró conexión desde ${currentNodeId} con handle ${result.nextNodeId}`);
        break;
      }
      
      // Avanzar al siguiente nodo
      currentNodeId = nextNodeId;
      stepCount++;
    }
    
    // Actualizamos la sesión con el nuevo estado
    await conversationManager.updateSession(session.id, {
      current_node_id: currentNodeId,
      state_data: stateData
    });
    
    // Si se alcanzó el límite de pasos, registrar advertencia
    if (stepCount >= MAX_EXECUTION_STEPS) {
      console.warn(`Se alcanzó el límite de pasos (${MAX_EXECUTION_STEPS}) en la sesión ${session.id}`);
      
      // Añadir mensaje de error para el usuario
      const errorMessage = "Lo siento, hubo un problema al procesar tu solicitud. Por favor, intenta con una consulta diferente.";
      responses.push(errorMessage);
      
      await conversationManager.addMessage(
        session.id,
        errorMessage,
        ContentType.TEXT,
        false,
        currentNodeId,
        { error: "max_steps_exceeded" }
      );
    }
    
    return {
      responses,
      sessionId: session.id,
      sessionStatus: session.status
    };
  } catch (error) {
    console.error('Error al procesar mensaje:', error);
    
    // Intentar obtener la sesión para responder con el ID correcto
    let sessionId;
    try {
      const session = await conversationManager.findActiveSession(
        userChannelId,
        channelType,
        tenantId
      );
      sessionId = session?.id;
    } catch (e) {
      // Ignorar errores al intentar obtener la sesión en caso de fallo
    }
    
    return {
      responses: ["Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde."],
      sessionId: sessionId || 'error',
      sessionStatus: SessionStatus.FAILED
    };
  }
}