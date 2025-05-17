/**
 * frontend/src/app/api/chatbot/executor/flow-executor.ts
 * Motor de ejecución del flujo del chatbot
 * 
 * @version 1.0.0
 * @updated 2025-07-14
 */

import { executeNode } from './node-executor';
import { ConversationManager } from '../conversation/conversation-manager';
import { SessionStatus, ContentType } from '../conversation/conversation-types';
import { supabase } from '@/services/supabase/SupabaseClient';

// Tiempo máximo de ejecución del flujo (para evitar bucles infinitos)
const MAX_EXECUTION_STEPS = 5; // Reducido a 5 para evitar bucles infinitos

/**
 * Encuentra el ID de nodo más similar a un ID dado
 * Útil para recuperación cuando hay problemas de coincidencia de IDs
 */
function findMostSimilarNodeId(targetId: string, nodeIds: string[]): string | null {
  if (!targetId || nodeIds.length === 0) return null;
  
  // Si hay una coincidencia exacta, devolverla inmediatamente
  if (nodeIds.includes(targetId)) return targetId;
  
  // Normalizar el targetId para comparaciones
  const normalizedTarget = targetId.toLowerCase().replace(/[-_\s]/g, '');
  
  // Buscar coincidencias por prefijo/sufijo
  for (const id of nodeIds) {
    // Normalizar para comparación
    const normalizedId = id.toLowerCase().replace(/[-_\s]/g, '');
    
    // Verificar si uno contiene al otro
    if (normalizedId.includes(normalizedTarget) || normalizedTarget.includes(normalizedId)) {
      return id;
    }
  }
  
  // Si no encontramos coincidencias parciales, tratar de encontrar palabras clave comunes
  const keywords = ['start', 'welcome', 'bienvenida', 'inicio', 'message'];
  
  // Si el targetId contiene alguna de estas palabras clave, buscar IDs que también las contengan
  for (const keyword of keywords) {
    if (targetId.toLowerCase().includes(keyword)) {
      for (const id of nodeIds) {
        if (id.toLowerCase().includes(keyword)) {
          return id;
        }
      }
    }
  }
  
  // Si todo falla, devolver null
  return null;
}

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
  sessionStatus: SessionStatus,
  isNewConversation?: boolean
}> {
  // Crear el gestor de conversaciones
  const conversationManager = new ConversationManager(supabase);
  
  // Establecer un límite de tiempo total de ejecución (30 segundos)
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 30000; // 30 segundos
  
  try {
    // Buscar sesión activa para este usuario/tenant
    let session = await conversationManager.findActiveSession(
      userChannelId,
      channelType,
      tenantId
    );
    
    // Variable para rastrear si es una nueva conversación
    let isNewConversation = false;
    
    // Si no hay sesión, crear una nueva
    if (!session) {
      session = await conversationManager.createSession(
        userChannelId,
        channelType,
        tenantId
      );
      
      isNewConversation = true; // Marcar como nueva conversación
      console.log(`Creada nueva sesión ${session.id} para usuario ${userChannelId}`);
    } else {
      // Si la sesión no tiene mensajes, también considerarla como nueva
      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('id')
        .eq('session_id', session.id)
        .limit(1);
      
      if (!messages || messages.length === 0) {
        isNewConversation = true;
        console.log(`Sesión existente pero sin mensajes, considerando como nueva: ${session.id}`);
      }
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
    let templateId;
    
    // Si tenemos una activación, buscar su plantilla asociada
    if (session.active_chatbot_activation_id) {
      const { data: activation, error: activationError } = await supabase
        .from('tenant_chatbot_activations')
        .select('template_id')
        .eq('id', session.active_chatbot_activation_id)
        .single();
      
      if (activation) {
        templateId = activation.template_id;
      } else {
        console.warn(`No se encontró la activación ${session.active_chatbot_activation_id}, buscando plantilla directamente`);
        
        // Intentar cargar la plantilla directamente (pudo haberse activado dinámicamente)
        const { data: templates } = await supabase
          .from('chatbot_templates')
          .select('id, name')
          .eq('status', 'published')
          .eq('is_deleted', false)
          .limit(1);
          
        if (templates && templates.length > 0) {
          templateId = templates[0].id;
          console.log(`Usando plantilla alternativa: ${templates[0].name} (${templateId})`);
        }
      }
    }
    
    if (!templateId) {
      throw new Error(`No se pudo determinar una activación válida para el tenant: No existe una plantilla activa`);
    }
    
    const { data: template, error: templateError } = await supabase
      .from('chatbot_templates')
      .select('react_flow_json')
      .eq('id', templateId)
      .single();
    
    if (templateError || !template?.react_flow_json) {
      throw new Error(`No se pudo determinar una activación válida para el tenant: La plantilla ${templateId} no existe o está incompleta`);
    }
    
    // Extraer definición de nodos
    const flowJson = template.react_flow_json;
    const nodes = flowJson.nodes || [];
    const edges = flowJson.edges || [];
    
    // Verificar que la plantilla tenga nodos
    if (nodes.length === 0) {
      console.warn(`La plantilla ${templateId} no contiene nodos. Generando respuesta predeterminada.`);
      return {
        responses: ['Hola, ¿en qué puedo ayudarte? (respuesta generada por plantilla sin nodos)'],
        sessionId: session.id,
        sessionStatus: SessionStatus.ACTIVE
      };
    }
    
    // Crear mapas de nodos y conexiones PRIMERO, para usarlos después
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
    
    // ESTRATEGIA SIMPLIFICADA: Buscar el nodo 'Inicio'/'start-node' y usar su primer nodo conectado
    // 1. Buscar el nodo de inicio (seguro que existe en todos los flujos)
    const startNode = nodes.find(n => {
      // Verificar por ID exacto primero
      if (n.id === 'start-node' || n.id === 'Inicio') {
        return true;
      }
      
      // Luego por ID similar
      if (n.id?.toLowerCase().includes('start') || 
          n.id?.toLowerCase().includes('inicio')) {
        return true;
      }
      
      // Finalmente por tipo
      if (n.type === 'startNode' || n.type === 'start') {
        return true;
      }
      
      return false;
    });
    
    // Si encontramos el nodo de inicio, vamos a identificar el primer nodo conectado
    let firstConnectedNode = null;
    let firstConnectedNodeId = null;
    
    if (startNode) {
      console.log(`Nodo de inicio encontrado: ${startNode.id}`);      
      
      // Buscar conexiones salientes desde el nodo de inicio
      const connections = connectionMap[startNode.id] || {};
      console.log(`Conexiones desde nodo de inicio ${startNode.id}:`, connections);
      
      // Intentar encontrar la conexión 'next' primero, luego cualquier otra
      firstConnectedNodeId = connections['next'] || Object.values(connections)[0];
      
      if (firstConnectedNodeId) {
        firstConnectedNode = nodeMap[firstConnectedNodeId];
        console.log(`Primer nodo conectado: ${firstConnectedNodeId}`);        
        
        // Verificar que el nodo encontrado sea 'messageNode-welcome'
        if (firstConnectedNodeId !== 'messageNode-welcome') {
          console.warn(`El primer nodo conectado (${firstConnectedNodeId}) no es messageNode-welcome. Buscando explícitamente el nodo de bienvenida.`);
          
          // Intentar encontrar explícitamente el nodo de bienvenida
          const welcomeNode = nodes.find(n => n.id === 'messageNode-welcome');
          if (welcomeNode) {
            console.log(`Encontrado nodo de bienvenida explícitamente: ${welcomeNode.id}`);
            firstConnectedNode = welcomeNode;
            firstConnectedNodeId = welcomeNode.id;
          }
        }
        
        // Si es un nodo de mensaje, asegurarnos de que tenga waitForResponse configurado
        if (firstConnectedNode && 
            (firstConnectedNode.type === 'messageNode' || firstConnectedNode.type === 'message')) {
          
          if (firstConnectedNode.data.waitForResponse === undefined) {
            console.log(`Configurando waitForResponse=false para primer nodo: ${firstConnectedNode.id}`);            
            firstConnectedNode.data.waitForResponse = false; // Auto-flow por defecto para el primer nodo
          }
        }
      } else {
        console.warn(`⚠️ El nodo de inicio ${startNode.id} no tiene conexiones salientes`);        
      }
    } else {
      console.warn('⚠️ No se encontró nodo de inicio (Inicio/start-node) en la plantilla');      
    }
    
    // Iniciar ejecución del flujo desde el nodo actual
    let currentNodeId = session.current_node_id;
    let stateData = session.state_data || {};
    let stepCount = 0;
    const responses: string[] = [];
    
    // ESTRATEGIA SIMPLIFICADA DE SELECCIÓN DE NODO INICIAL:
    // Si no tenemos un nodo actual asignado y no estamos esperando respuesta,
    // usar el primer nodo conectado al nodo de inicio (Inicio/start-node)
    
    if (!currentNodeId && session.status !== SessionStatus.WAITING_INPUT) {
      // CASO 1: Tenemos un nodo conectado al nodo de inicio - usar ese como inicio del flujo
      if (firstConnectedNodeId) {
        currentNodeId = firstConnectedNodeId;
        console.log(`Usando el primer nodo conectado al nodo de inicio: ${currentNodeId}`);
      }
      // CASO 2: Tenemos el nodo de inicio pero no tiene conexiones - usar ese directamente
      else if (startNode) {
        currentNodeId = startNode.id;
        console.log(`Usando nodo de inicio directamente (sin conexiones): ${currentNodeId}`);
      }
      // CASO 3: No encontramos nodo de inicio - buscar cualquier nodo como fallback
      else {
        // Intentar encontrar cualquier nodo de mensaje como fallback
        const messageNode = nodes.find(n => n.type === 'messageNode' || n.type === 'message');
        if (messageNode) {
          currentNodeId = messageNode.id;
          console.log(`Fallback: usando nodo de mensaje encontrado: ${currentNodeId}`);
          
          // Configurar para auto-flow por defecto
          if (messageNode.data.waitForResponse === undefined) {
            messageNode.data.waitForResponse = false;
          }
        }
        // Como último recurso, usar cualquier nodo
        else if (nodes.length > 0) {
          currentNodeId = nodes[0].id;
          console.log(`Último recurso: usando primer nodo disponible: ${currentNodeId}`);
        }
      }
    }
    
    // =====================================================================
    // FUERZA LA SECUENCIA CORRECTA DEL FLUJO PARA NUEVAS CONVERSACIONES
    // Esto es crítico para la experiencia del usuario
    // =====================================================================
    
    // Si es una conversación nueva (no hay currentNodeId y no estamos esperando entrada)
    // Debemos forzar la secuencia correcta
    if (!currentNodeId && session.status !== SessionStatus.WAITING_INPUT) {
      const welcomeNodeId = 'messageNode-welcome';
      const calificacionNodeId = 'messageNode-calificacion-intro';
      const welcomeNode = nodeMap[welcomeNodeId];
      
      // Forzar el orden correcto: messageNode-welcome -> inputNode-nombre -> etc
      console.log(`⭐⭐⭐ FORZANDO SECUENCIA CORRECTA PARA NUEVA CONVERSACIÓN ⭐⭐⭐`);
      
      if (welcomeNode) {
        console.log(`VERIFICACIÓN DE CALIDAD: Forzando inicio desde nodo de bienvenida: ${welcomeNodeId}`);
        currentNodeId = welcomeNodeId;
        
        // IMPORTANTE: La bienvenida DEBE mostrarse, nunca debe ser skipped
        welcomeNode.data.waitForResponse = true; // Forzamos a que muestre este mensaje primero
        
        // Actualizamos la sesión para guardar el estado
        await conversationManager.updateSession(session.id, {
          current_node_id: welcomeNodeId,
          status: SessionStatus.ACTIVE,
          state_updates: { "_forced_welcome": true }
        });
        
        try {
          // Registrar mensaje de log para depuración
          await conversationManager.addMessage(
            session.id,
            "[SISTEMA] Forzando inicio desde nodo de bienvenida",
            ContentType.SYSTEM,
            false,
            "system",
            { action: "force_welcome" }
          );
        } catch (e) {
          console.log("Error al registrar mensaje de sistema:", e);
        }
      } else {
        console.warn("⚠️ No se encontró nodo de bienvenida. Secuencia de flujo podría ser incorrecta.");
      }
    }
    
    // Si aún no tenemos un nodo actual, debemos encontrar uno (esto sería raro a estas alturas)
    if (!currentNodeId) {
      // Imprimir todos los nodos para debug de forma más detallada
      console.log('ReactFlow JSON:', JSON.stringify(flowJson));
      
      // Imprimir una lista simple de IDs para diagnosticar problema
      const nodeIds = nodes.map(n => n.id).join(', ');
      console.log(`Lista simple de IDs de nodos: ${nodeIds}`);
      
      // PLAN DE RESCATE: usar cualquier nodo como inicio
      console.log('No se pudo identificar un nodo inicial usando los métodos estándar, buscando alternativas.');
      
      // ALTERNATIVA 1: Buscar nodo de bienvenida explícitamente por convención de nombres
      const welcomeAlternative = nodes.find(n => 
        n.id.toLowerCase().includes('welcome') || 
        n.id.toLowerCase().includes('bienvenida') ||
        (n.data?.label && (n.data.label.toLowerCase().includes('welcome') || n.data.label.toLowerCase().includes('bienvenida')))
      );
      
      if (welcomeAlternative) {
        currentNodeId = welcomeAlternative.id;
        console.log(`Usando nodo de bienvenida alternativo: ${currentNodeId}`);
      }
      // ALTERNATIVA 2: Buscar cualquier nodo con conexiones salientes
      else if (Object.keys(connectionMap).length > 0) {
        const nodeWithConnections = Object.keys(connectionMap)[0];
        currentNodeId = nodeWithConnections;
        console.log(`Usando nodo con conexiones como fallback: ${currentNodeId}`);
      }
      // ALTERNATIVA 3: Simplemente usar el primer nodo (ordenado por posición Y)
      else if (nodes.length > 0) {
        // Ordenar nodos por posición Y (de arriba hacia abajo)
        const sortedNodes = [...nodes].sort((a, b) => {
          const aY = a.position?.y || 0;
          const bY = b.position?.y || 0;
          return aY - bY;
        });
        
        currentNodeId = sortedNodes[0].id;
        console.log(`Último recurso: usando el nodo más alto en el diagrama: ${currentNodeId}`);
      }
    }
    
    // Mantener un registro de nodos visitados para detectar bucles
    const visitedNodes = new Set<string>();
    
    // Ejecutar nodos en secuencia hasta que se requiera input del usuario o se llegue al final
    while (currentNodeId && stepCount < MAX_EXECUTION_STEPS) {
      // Detectar bucles - si ya visitamos este nodo, parar la ejecución
      if (visitedNodes.has(currentNodeId)) {
        console.error(`⚠️ BUCLE DETECTADO: El nodo ${currentNodeId} ya ha sido visitado. Deteniendo ejecución.`);
        // Añadir un mensaje informativo al usuario final y parar
        responses.push("Lo siento, hay un problema con el flujo de conversación. Por favor, contacta al administrador.");
        break;
      }
      
      // Marcar este nodo como visitado
      visitedNodes.add(currentNodeId);
      let currentNode = nodeMap[currentNodeId];
      
      if (!currentNode) {
        console.error(`Nodo ${currentNodeId} no encontrado en la plantilla`);
        
        // Lista de IDs de todos los nodos disponibles para debug
        const availableNodeIds = nodes.map(n => n.id).join(', ');
        console.error(`Nodos disponibles: ${availableNodeIds}`);
        
        // Intento de recuperación: buscar el nodo más similar por ID
        const similarNodeId = findMostSimilarNodeId(currentNodeId, nodes.map(n => n.id));
        if (similarNodeId) {
          console.log(`Intento de recuperación: usando nodo con ID similar: ${similarNodeId}`);
          currentNodeId = similarNodeId;
          // No reasignar currentNode directamente, mejor comprobar en la siguiente iteración
          // Continuar con el siguiente ciclo del bucle para que se busque el nuevo nodo en el mapa
          continue;
        }
        
        // Si es el primer paso y no se encuentra el nodo (ni su similar), agregar una respuesta predeterminada
        if (stepCount === 0 && responses.length === 0) {
          // Intentar recuperar la plantilla correcta directamente
          try {
            const { data: templates } = await supabase
              .from('chatbot_templates')
              .select('id, name, react_flow_json')
              .eq('status', 'published')
              .eq('is_deleted', false)
              .limit(1);
              
            if (templates?.length > 0) {
              const template = templates[0];
              const nodes = template.react_flow_json?.nodes || [];
              if (nodes.length > 0) {
                // Encontrar un nodo de bienvenida
                const welcomeNode = nodes.find(n => {
                  const label = n.data?.label?.toLowerCase() || '';
                  return label.includes('bienvenida') || label.includes('welcome');
                });
                
                if (welcomeNode && welcomeNode.data?.messageText) {
                  const welcomeMessage = welcomeNode.data.messageText;
                  responses.push(welcomeMessage);
                  await conversationManager.addMessage(
                    session.id,
                    welcomeMessage,
                    ContentType.TEXT,
                    false,
                    'recovery_welcome',
                    { recovery: true }
                  );
                  break;
                }
              }
            }
          } catch (err) {
            console.error('Error al intentar recuperación:', err);
          }
          
          // Si la recuperación falla, usar mensaje de bienvenida
          // Mensaje más amigable sin mostrar detalles técnicos al usuario final
          const defaultResponse = `Hola, bienvenido. ¿En qué puedo ayudarte hoy?`;
          responses.push(defaultResponse);
          
          // Log interno del error para dar más detalles de lo que pasó
          console.error(`Error técnico: No se pudo encontrar el nodo ${currentNodeId} o está mal configurado`);
          
          await conversationManager.addMessage(
            session.id,
            defaultResponse,
            ContentType.TEXT,
            false,
            'default',
            { error: "node_not_found", available_nodes: availableNodeIds }
          );
        }
        
        break;
      }
      
      // Intentar registrar la transición al nodo actual, pero no fallar si hay error
      try {
        await conversationManager.logNodeTransition(
          session.id,
          stepCount === 0 ? null : currentNodeId,
          currentNodeId,
          'system'
        );
      } catch (transitionError) {
        console.log('Aviso: No se pudo registrar la transición de nodo. Continuando ejecución.');
      }
      
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
      
      // Comprobar si hemos excedido el tiempo máximo de ejecución
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.error(`⚠️ TIMEOUT: La ejecución ha excedido el tiempo máximo permitido (${MAX_EXECUTION_TIME / 1000}s).`);
        responses.push("Lo siento, la operación está tomando demasiado tiempo. Por favor, intenta nuevamente más tarde.");
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
    
    // Comprobaciones finales y manejo de estados especiales
    
    // Si se alcanzó el límite de pasos, registrar advertencia
    if (stepCount >= MAX_EXECUTION_STEPS) {
      console.warn(`Se alcanzó el límite de pasos (${MAX_EXECUTION_STEPS}) en la sesión ${session.id}`);
      
      // Añadir mensaje de error para el usuario solo si no hay otras respuestas
      if (responses.length === 0) {
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
    }
    
    // Si no tenemos respuestas tras toda la ejecución, dar una respuesta por defecto
    if (responses.length === 0) {
      const defaultResponse = "Hola, ¿en qué puedo ayudarte hoy?";
      responses.push(defaultResponse);
      
      await conversationManager.addMessage(
        session.id,
        defaultResponse,
        ContentType.TEXT,
        false,
        'default_response',
        { generated: true }
      );
    }
    
    return {
      responses,
      sessionId: session.id,
      sessionStatus: session.status,
      isNewConversation
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