/**
 * frontend/src/app/api/chatbot/executor/node-executor.ts
 * Sistema de ejecución de nodos del chatbot
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import { ChatbotNodeType, ActionType } from '../conversation/conversation-types';
import { executeBusinessNode } from '../nodes/business-nodes';

interface ExecutionContext {
  tenantId: string;
  sessionId: string;
  userId: string;
  nodeId: string;
  stateData: Record<string, any>;
}

interface ExecutionResult {
  nextNodeId: string | null;
  responseMessage?: string;
  updatedStateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Ejecuta un nodo específico del chatbot
 * 
 * Las reglas de ejecución para los diferentes tipos de nodos son:
 * - Nodos de mensaje (messageNode): 
 *   - Si tienen waitForResponse=true, detienen el flujo y esperan respuesta del usuario
 *   - Si tienen waitForResponse=false o no lo especifican, continúan automáticamente al siguiente nodo
 * - Nodos de entrada (inputNode): 
 *   - Siempre detienen el flujo y esperan respuesta del usuario
 * - Nodos condicionales: 
 *   - Evalúan la condición y eligen el camino apropiado ('yes'/'no' o 'true'/'false')
 * - Nodos de inicio (startNode): 
 *   - Simplemente continúan al siguiente nodo
 * - Nodos de acción y router: 
 *   - Realizan su acción específica y normalmente continúan al siguiente nodo
 */
/**
 * Reemplaza variables en un texto con valores del estado de la conversación
 * y variables predeterminadas del sistema
 */
function replaceVariables(text: string, stateData: Record<string, any>): string {
  if (!text) return '';
  
  // Variables predeterminadas como fallback cuando no están en el stateData
  const defaultValues: Record<string, string> = {
    'nombre_usuario': stateData.nombre_usuario || 'Usuario',
    'user_name': stateData.user_name || 'Usuario',
    'nombre': stateData.nombre || 'Usuario',
    'nombre_lead': stateData.nombre_lead || 'Usuario',
    'email_usuario': stateData.email_usuario || 'correo@ejemplo.com',
    'telefono_usuario': stateData.telefono_usuario || '123456789',
    'company_name': stateData.company_name || 'PymeBot',
    'tenant_name': stateData.tenant_name || 'Empresa',
    'business_name': stateData.business_name || 'PymeBot'
  };
  
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    
    // Primero buscar en stateData, luego en defaultValues
    if (stateData[trimmedName] !== undefined) {
      return String(stateData[trimmedName]);
    } else if (defaultValues[trimmedName] !== undefined) {
      return defaultValues[trimmedName];
    } else {
      console.log(`Variable ${trimmedName} no encontrada, manteniendo sin cambios.`);
      return match; // Mantener {{variable}} si no hay valor disponible
    }
  });
}

export async function executeNode(
  nodeConfig: any, 
  context: ExecutionContext
): Promise<ExecutionResult> {
  const { type, data } = nodeConfig;
  const { tenantId, sessionId, stateData } = context;

  try {
    console.log(`Ejecutando nodo ${nodeConfig.id} de tipo ${type}`);
    
    // Resultado por defecto
    let result: ExecutionResult = {
      nextNodeId: 'next',
      updatedStateData: stateData
    };
    
    // Detectar condiciones de error que podrían causar bucles infinitos
    if (context.stateData?.__visitCount && context.stateData.__visitCount[nodeConfig.id]) {
      // Si hemos visitado este nodo más de 3 veces, hay un posible bucle
      if (context.stateData.__visitCount[nodeConfig.id] > 3) {
        console.error(`Posible bucle infinito detectado: Nodo ${nodeConfig.id} visitado ${context.stateData.__visitCount[nodeConfig.id]} veces`);
        // Forzar detención del flujo
        return {
          nextNodeId: null,
          responseMessage: 'Lo siento, hay un problema técnico con el flujo. Por favor, intenta nuevamente.',
          metadata: { error: 'possible_infinite_loop' }
        };
      }
      
      // Incrementar contador de visitas
      context.stateData.__visitCount[nodeConfig.id]++;
    } else {
      // Inicializar contador de visitas
      if (!context.stateData.__visitCount) {
        context.stateData.__visitCount = {};
      }
      context.stateData.__visitCount[nodeConfig.id] = 1;
    }
    
    // Manejar nodos de mensaje y detectar la propiedad waitForResponse
    if ((type === 'messageNode' || type === 'message') && data?.message) {
      console.log(`Nodo de mensaje: ${nodeConfig.id}, waitForResponse: ${data.waitForResponse}`);
      
      // IMPORTANTE: Tratamiento especial para el nodo de bienvenida
      let treatAsWelcomeNode = false;
      if (nodeConfig.id === 'messageNode-welcome' ||
          nodeConfig.id.toLowerCase().includes('welcome') ||
          nodeConfig.id.toLowerCase().includes('bienvenida') ||
          (data.label && (
            data.label.toLowerCase().includes('welcome') ||
            data.label.toLowerCase().includes('bienvenida')
          ))
      ) {
        treatAsWelcomeNode = true;
        console.log(`Detectado nodo de bienvenida: ${nodeConfig.id}`);
        
        // Si viene del contexto de ejecución una señal de _forced_welcome
        // entonces queremos que el nodo de bienvenida sí detenga el flujo
        if (context.stateData && context.stateData._forced_welcome === true) {
          console.log(`⭐⭐⭐ NODO DE BIENVENIDA FORZADO A PARAR EL FLUJO ⭐⭐⭐`);
          data.waitForResponse = true;
        }
        // Si no, que continúe automáticamente si no está especificado
        else if (data.waitForResponse === undefined) {
          data.waitForResponse = false;
        }
      }
      
      // Reemplazar variables en el mensaje - Mostrar debug de reemplazo
      const originalMessage = data.message;
      const processedMessage = replaceVariables(data.message, stateData);
      
      if (originalMessage !== processedMessage) {
        console.log(`Variables reemplazadas en mensaje: \nOriginal: ${originalMessage}\nProcesado: ${processedMessage}`);
      }
      
      result.responseMessage = processedMessage;
      
      // Si el nodo espera respuesta del usuario, detener el flujo
      if (data.waitForResponse === true) {
        console.log(`Nodo ${nodeConfig.id} tiene waitForResponse=true, deteniendo el flujo`);
        result.nextNodeId = null; // Esto detendrá el flujo
      } else {
        console.log(`Nodo ${nodeConfig.id} tiene auto-flow activado, continuando al siguiente nodo`);
        // Explícitamente establecemos nextNodeId='next' para indicar que debe continuar al siguiente nodo
        result.nextNodeId = 'next';
      }
      
      return result;
    }

    // Ejecutar lógica específica según el tipo de nodo
    switch (type) {
      // Integración con nodos de negocio (citas, leads)
      case 'check-availability':
      case 'check_availability':
      case 'book-appointment':
      case 'book_appointment':
      case 'lead-qualification':
      case 'lead_qualification': {
        const result = await executeBusinessNode(type, tenantId, stateData, data);
        
        if (!result) {
          throw new Error(`El nodo de tipo ${type} no pudo ser ejecutado`);
        }
        
        return {
          nextNodeId: result.nextNodeId,
          responseMessage: result.outputs.message,
          updatedStateData: result.outputs.context,
          metadata: { nodeType: type, executionTimestamp: new Date().toISOString() }
        };
      }
      
      // Otros tipos de nodos existentes se manejan aquí...
      case ChatbotNodeType.TEXT:
        // Los nodos de tipo TEXT deben seguir la misma lógica de waitForResponse que los messageNode
        return {
          nextNodeId: data.waitForResponse === true ? null : 'next',
          responseMessage: replaceVariables(data.message, stateData),
          metadata: { 
            nodeType: 'text',
            waitForResponse: data.waitForResponse === true
          }
        };
        
      case ChatbotNodeType.INPUT:
      case 'inputNode':
      case 'input':
        console.log(`Procesando nodo de tipo INPUT/inputNode con variable: ${data.variableName}`);
        return {
          nextNodeId: null, // Esperar input del usuario
          responseMessage: replaceVariables(data.prompt || data.question, stateData),
          metadata: {
            nodeType: 'input',
            variableName: data.variableName,
            inputType: data.inputType
          }
        };
        
      case ChatbotNodeType.CONDITIONAL:
        // Evaluar condición para determinar siguiente nodo
        try {
          // Crear un contexto seguro para evaluar la condición
          const evalContext = { stateData };
          const condition = data.condition || '';
          
          // Evitar eval usando Function para evaluar en un contexto limitado
          const evalFunction = new Function('stateData', `return ${condition};`);
          const result = evalFunction(stateData);
          
          return {
            nextNodeId: result ? 'yes' : 'no',
            metadata: { 
              nodeType: 'conditional',
              conditionResult: result
            }
          };
        } catch (evalError) {
          console.error('Error al evaluar condición:', evalError);
          return {
            nextNodeId: 'no', // Por defecto ir al camino negativo
            metadata: { 
              nodeType: 'conditional',
              error: 'Error al evaluar condición',
              conditionResult: false
            }
          };
        }
        
      case ChatbotNodeType.ACTION:
        // Por hacer: implementar acciones genéricas
        console.warn('Tipo de nodo ACTION no completamente implementado');
        return {
          nextNodeId: 'next',
          metadata: { nodeType: 'action' }
        };
        
      case ChatbotNodeType.ROUTER:
        // Por hacer: implementar router
        console.warn('Tipo de nodo ROUTER no completamente implementado');
        return {
          nextNodeId: 'next',
          metadata: { nodeType: 'router' }
        };
        
      case ChatbotNodeType.START:
      case 'startNode':
      case 'start':
        // Nodo inicial, simplemente continuar
        console.log('Procesando nodo de tipo START/startNode');
        return {
          nextNodeId: 'next',
          metadata: { nodeType: 'start' }
        };
        
      case 'messageNode': // Add explicit support for messageNode type
        console.log(`Procesando nodo de tipo messageNode: ${nodeConfig.id}`);
        return {
          nextNodeId: data.waitForResponse === true ? null : 'next',
          responseMessage: replaceVariables(data.message, stateData),
          metadata: { 
            nodeType: 'message',
            waitForResponse: data.waitForResponse === true
          }
        };

      case 'buttonsNode': // Add support for buttons node
        console.log(`Procesando nodo de tipo buttonsNode: ${nodeConfig.id}`);
        return {
          nextNodeId: null, // Esperar input del usuario para seleccionar botón
          responseMessage: replaceVariables(data.message || data.question || 'Por favor selecciona una opción:', stateData),
          metadata: { 
            nodeType: 'buttons',
            options: data.options || [],
            buttons: data.buttons || []
          }
        };

      case 'listNode': // Add support for list node
        console.log(`Procesando nodo de tipo listNode: ${nodeConfig.id}`);
        return {
          nextNodeId: null, // Detener flujo hasta que el usuario seleccione una opción
          responseMessage: replaceVariables(data.message || 'Por favor selecciona una opción:', stateData),
          metadata: { 
            nodeType: 'list',
            listItems: data.listItems || [],
            listTitle: data.listTitle,
            waitForResponse: data.waitForResponse !== false // Por defecto true para listas
          }
        };

      case 'endNode': // Add support for end node
        console.log(`Procesando nodo de tipo endNode: ${nodeConfig.id}`);
        return {
          nextNodeId: null, // El flujo termina aquí
          responseMessage: replaceVariables(data.message || 'Gracias por usar nuestro servicio.', stateData),
          metadata: { nodeType: 'end' }
        };
        
      default:
        console.warn(`Tipo de nodo desconocido: ${type}`);
        // Intento de manejo genérico para cualquier tipo de nodo desconocido
        // Si hay un mensaje o respuesta en los datos, usarla como respuesta
        const genericMessage = data?.message || data?.response || data?.text || data?.prompt || data?.question;
        return {
          nextNodeId: 'next', // Por defecto continuar
          responseMessage: genericMessage ? replaceVariables(genericMessage, stateData) : 'Disculpa, no puedo procesar esta solicitud en este momento.',
          metadata: { nodeType: 'unknown', originalType: type }
        };
    }
  } catch (error) {
    console.error(`Error al ejecutar nodo ${nodeConfig.id}:`, error);
    
    return {
      nextNodeId: 'error',
      responseMessage: 'Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.',
      metadata: { 
        nodeType: type,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    };
  }
}