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
 */
export async function executeNode(
  nodeConfig: any, 
  context: ExecutionContext
): Promise<ExecutionResult> {
  const { type, data } = nodeConfig;
  const { tenantId, sessionId, stateData } = context;

  try {
    console.log(`Ejecutando nodo ${nodeConfig.id} de tipo ${type}`);

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
        return {
          nextNodeId: 'next',
          responseMessage: data.message,
          metadata: { nodeType: 'text' }
        };
        
      case ChatbotNodeType.INPUT:
        return {
          nextNodeId: null, // Esperar input del usuario
          responseMessage: data.prompt,
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
        // Nodo inicial, simplemente continuar
        return {
          nextNodeId: 'next',
          metadata: { nodeType: 'start' }
        };
        
      default:
        console.warn(`Tipo de nodo desconocido: ${type}`);
        return {
          nextNodeId: 'next',
          responseMessage: 'Disculpa, no puedo procesar esta solicitud en este momento.',
          metadata: { nodeType: 'unknown', error: `Tipo de nodo no soportado: ${type}` }
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