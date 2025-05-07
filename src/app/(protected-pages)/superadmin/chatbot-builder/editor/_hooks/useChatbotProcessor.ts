/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_hooks/useChatbotProcessor.ts
 * Hook personalizado para procesar los nodos del chatbot
 * @version 1.1.0
 * @updated 2025-04-14 - Integración mejorada con el procesador de IA
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Node, Edge } from 'reactflow'
import { MessageType, ChatbotContext } from '../_components/chatbot-preview/types'
import { replaceVariables } from '@/services/SystemVariablesService'
import { useSpeechSynthesis } from './useSpeechSynthesis'
import { useAIProcessor } from './useAIProcessor'

interface UseChatbotProcessorProps {
  nodes: Node[]
  edges: Edge[]
  isVoiceBot: boolean
  ttsEnabled: boolean
  onStartVoiceInput: () => void
  onRequestUserInput: () => void
}

interface UseChatbotProcessorResult {
  messages: MessageType[]
  context: ChatbotContext
  lastMessageWithAudio: MessageType | null
  currentPrompt: string
  isExpectingInput: boolean
  isExpectingVoiceInput: boolean
  speechSynthesis: ReturnType<typeof useSpeechSynthesis>
  aiProcessor: ReturnType<typeof useAIProcessor>
  isProcessingAI: boolean
  addMessage: (message: MessageType) => void
  handleUserResponse: (userInput: string) => void
  moveToNextNode: (currentNodeId: string, handleId?: string) => void
  resetConversation: () => void
}

export const useChatbotProcessor = ({
  nodes,
  edges,
  isVoiceBot,
  ttsEnabled,
  onStartVoiceInput,
  onRequestUserInput,
}: UseChatbotProcessorProps): UseChatbotProcessorResult => {
  // Estados básicos
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isExpectingInput, setIsExpectingInput] = useState(false)
  const [isExpectingVoiceInput, setIsExpectingVoiceInput] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [lastMessageWithAudio, setLastMessageWithAudio] = useState<MessageType | null>(null)
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false)
  
  // Estado del contexto del chatbot
  const [context, setContext] = useState<ChatbotContext>({
    variables: {},
    currentNodeId: null,
    processedNodes: new Set(),
  })

  // Referencias para debugging y control
  const nodesRef = useRef<Node[]>(nodes)
  const edgesRef = useRef<Edge[]>(edges)
  const startTimeRef = useRef<number>(Date.now())
  const debugRef = useRef<boolean>(true)

  // Actualizar referencias cuando cambien los props
  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [nodes, edges])

  // Función de log para debugging
  const log = useCallback((message: string, data?: unknown) => {
    if (debugRef.current) {
      const timeSinceStart = Date.now() - startTimeRef.current
      console.log(`[${timeSinceStart}ms] ${message}`, data || '')
    }
  }, [])

  // Hook de síntesis de voz
  const speechSynthesis = useSpeechSynthesis({
    onSpeechStart: () => {
      log('Síntesis iniciada')
    },
    onSpeechEnd: () => {
      log('Síntesis finalizada')
      // Si hay un nodo actual, avanzar al siguiente después de reproducir el audio
      if (context.currentNodeId) {
        log(`Avanzando desde nodo ${context.currentNodeId} después de finalizar síntesis`)
        moveToNextNode(context.currentNodeId)
      }
    },
    onSpeechError: (err) => {
      console.error('Error en la síntesis de voz:', err)
      
      // Si hay un nodo actual, avanzar al siguiente a pesar del error
      if (context.currentNodeId) {
        log(`Avanzando desde nodo ${context.currentNodeId} tras error de síntesis`)
        moveToNextNode(context.currentNodeId)
      }
    },
    preferredLang: 'es'
  })
  
  // Hook de procesamiento de IA
  const aiProcessor = useAIProcessor({
    mockResponses: false, // NUNCA CAMBIAR A TRUE - Se debe usar la API real siempre
    defaultDelay: 500, // Delay reducido para mejorar experiencia
    onProcessingStart: () => {
      log('Iniciando procesamiento IA')
      setIsProcessingAI(true)
    },
    onProcessingEnd: (response) => {
      log(`Procesamiento IA finalizado: ${response.substring(0, 30)}...`)
      setIsProcessingAI(false)
    }
  })

  // Función para añadir un mensaje a la conversación
  const addMessage = useCallback((message: MessageType) => {
    log(`Añadiendo mensaje: ${message.content.substring(0, 30)}...`)
    
    // Reemplazar variables en el contenido del mensaje
    if (message.senderId === 'agent' || message.senderId === 'system') {
      const processedContent = replaceVariables(
        message.content,
        context.variables,
      )
      message.content = processedContent
    }

    setMessages((prev) => [...prev, message])
  }, [context.variables, log])

  // Función para encontrar y moverse al siguiente nodo
  const moveToNextNode = useCallback((currentNodeId: string, handleId?: string) => {
    log(`Buscando siguiente nodo desde: ${currentNodeId}, handle: ${handleId || 'default'}`)
    
    // Encontrar todas las conexiones que salen del nodo actual
    const outgoingEdges = edges.filter(
      (edge) => edge.source === currentNodeId,
    )
    
    log(`Conexiones salientes encontradas: ${outgoingEdges.length}`, outgoingEdges)

    // Si hay un handleId específico, filtrar por él
    const relevantEdges = handleId
      ? outgoingEdges.filter(
          (edge) =>
            edge.sourceHandle === handleId ||
            edge.sourceHandle === null,
        )
      : outgoingEdges
    
    log(`Conexiones relevantes: ${relevantEdges.length}`)

    // Si hay conexiones, seguir al primer destino
    if (relevantEdges.length > 0) {
      const nextNodeId = relevantEdges[0].target
      const nextNode = nodes.find(node => node.id === nextNodeId)
      
      log(`Siguiente nodo: ${nextNodeId}, tipo: ${nextNode?.type}`)

      // Actualizar el nodo actual en el contexto
      setContext((prev) => {
        // Solo actualizar si realmente cambia
        if (prev.currentNodeId === nextNodeId) {
          log('El nodo actual ya está configurado correctamente')
          return prev
        }
        
        log(`Actualizando currentNodeId de ${prev.currentNodeId} a ${nextNodeId}`)
        return {
          ...prev,
          currentNodeId: nextNodeId,
        }
      })
    } else {
      // Si no hay conexiones salientes, la conversación termina
      log('No hay más nodos a seguir, fin de la conversación')
      
      if (currentNodeId !== null) {
        addMessage({
          content:
            'Fin del flujo: Este nodo no tiene conexiones hacia otros nodos.',
          senderId: 'system',
          timestamp: new Date().toISOString(),
        })

        setContext((prev) => {
          if (prev.currentNodeId === null) return prev
          
          return {
            ...prev,
            currentNodeId: null,
          }
        })
      }
    }
  }, [edges, nodes, addMessage, log])

  // Función para procesar un nodo según su tipo
  const processNode = useCallback(async (node: Node) => {
    if (!node) {
      log('Error: Intentando procesar un nodo nulo')
      return
    }
    
    // Mostrar información detallada del nodo para diagnóstico
    log(`Procesando nodo tipo ${node.type} (id: ${node.id})`)
    log(`Información completa del nodo:`, { 
      id: node.id, 
      type: node.type, 
      label: node.data?.label,
      dataKeys: Object.keys(node.data || {})
    })
    
    // Marcar este nodo como procesado
    setContext((prev) => {
      if (prev.processedNodes.has(node.id)) {
        log(`Nodo ${node.id} ya procesado, omitiendo`)
        return prev
      }
      
      const newProcessedNodes = new Set([...prev.processedNodes, node.id])
      log(`Marcando nodo ${node.id} como procesado. Total procesados: ${newProcessedNodes.size}`)
      
      return {
        ...prev,
        processedNodes: newProcessedNodes,
      }
    })

    switch (node.type) {
      // Detectar tipos de nodos de voz de manera más flexible
      case 'aiVoiceAgentNode':
      case 'ai-voice-agent':
      case 'ai_voice_agent':
      case 'agenteVozIA':
      case 'AgenteVozIA':
      case 'agente-voz-ia': {
        // Nodo combinado: ejecuta IA y sintetiza la respuesta
        log('Procesando nodo AI Voice Agent (IA + Voz)')
        const aiPrompt = node.data?.prompt || 'Prompt sin configurar'
        addMessage({
          content: "Pensando...",
          senderId: 'system',
          timestamp: new Date().toISOString(),
        })
        try {
        setIsProcessingAI(true)
        const aiResponse = await aiProcessor.processPrompt(aiPrompt, {
        model: node.data?.model || 'gpt-3.5-turbo',
        temperature: node.data?.temperature || 0.7,
        provider: node.data?.provider || 'openai',
        variables: context.variables
        })
        setMessages(prev => prev.filter(msg => msg.content !== "Pensando..."))
        // Guardar la variable si está configurada
        if (node.data?.responseVariableName) {
        const varName = node.data.responseVariableName
        const cleanVarName = varName.startsWith('$')
        ? varName.substring(1)
        : varName
        setContext((prev) => ({
        ...prev,
        variables: {
        ...prev.variables,
        [cleanVarName]: aiResponse,
        },
        }))
        log(`Variable guardada: ${cleanVarName}`)
        }
        // Sintetizar la respuesta de IA
        if (isVoiceBot && ttsEnabled) {
        try {
        log('Sintetizando voz (AI Voice Agent)')
        // Añadir mensaje con la respuesta, mostrando texto según la configuración
        const responseMode = node.data?.responseMode || 'voice_and_text';
        
        addMessage({
        content: responseMode !== 'voice_only' ? aiResponse : '', // Mostrar texto según config
        senderId: 'agent',
          timestamp: new Date().toISOString(),
          hasAudio: true,
            voiceStatusText: responseMode === 'voice_only' ? 'Respuesta del asistente de voz' : '',
                })
                // Reproducir audio con la voz configurada
                // Usar la voz configurada en el nodo o una voz española por defecto
                const voiceOption = node.data?.voice || 'Spanish_Kind-heartedGirl';
                const speed = node.data?.speed || 1.0;
                console.log(`AIVoiceAgent: Usando voz configurada: ${voiceOption}, velocidad: ${speed}`);
                
                // Imprimir el texto antes de enviarlo para verificar si tiene caracteres españoles
                console.log(`Texto a sintetizar (primeros 100 chars): ${aiResponse.substring(0, 100)}`);
                
                speechSynthesis.speak(aiResponse, {
                  voice: voiceOption,
                  rate: speed // Usar speed en lugar de rate para ser consistente
                })
                // El avance al siguiente nodo se maneja en onSpeechEnd
              } catch (error) {
        console.error('Error al iniciar síntesis:', error)
          moveToNextNode(node.id)
          }
        } else {
        // Solo en caso de que TTS esté desactivado, mostrar como texto
        addMessage({
        content: aiResponse,
        senderId: 'agent',
          timestamp: new Date().toISOString(),
        })
          moveToNextNode(node.id)
            }
        } catch (error) {
          setMessages(prev => prev.filter(msg => msg.content !== "Pensando..."))
          addMessage({
            content: "Lo siento, hubo un problema al generar la respuesta. Por favor, intenta nuevamente.",
            senderId: 'system',
            timestamp: new Date().toISOString(),
          })
          moveToNextNode(node.id)
        } finally {
          setIsProcessingAI(false)
        }
        break
      }
      case 'startNode':
      case 'start':
        log('Procesando nodo inicio, avanzando al siguiente')
        moveToNextNode(node.id)
        break

      case 'messageNode':
      case 'text':
      case 'message':
        const message = node.data?.message || 'Mensaje sin configurar'
        log(`Nodo mensaje: "${message.substring(0, 30)}..."`)
        
        addMessage({
          content: message,
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })
        moveToNextNode(node.id)
        break

      case 'aiNode':
      case 'ai':
      case 'ai_response':
        const aiPrompt = node.data?.prompt || 'Prompt sin configurar';
        log(`Nodo IA con prompt: "${aiPrompt.substring(0, 30)}..."`)
        
        // Añadir un mensaje de procesamiento temporal
        addMessage({
          content: "Pensando...",
          senderId: 'system',
          timestamp: new Date().toISOString(),
        });
        
        // Procesar el prompt con el procesador de IA
        try {
          setIsProcessingAI(true);
          
          const aiResponse = await aiProcessor.processPrompt(aiPrompt, {
            model: node.data?.model || 'gpt-3.5-turbo',
            temperature: node.data?.temperature || 0.7,
            provider: node.data?.provider || 'openai',
            variables: context.variables
          });
          
          // Eliminar el mensaje de "pensando"
          setMessages(prev => prev.filter(msg => msg.content !== "Pensando..."));
          
          // --- Inicio: Verificar si el siguiente nodo es TTS ---
          let nextNodeIsTTS = false;
          const outgoingEdge = edges.find(edge => edge.source === node.id); // Asumimos una sola salida por ahora
          if (outgoingEdge) {
            const nextNode = nodes.find(n => n.id === outgoingEdge.target);
            if (nextNode && ['tts', 'ttsNode', 'text-to-speech'].includes(nextNode.type || '')) {
              nextNodeIsTTS = true;
              log(`Nodo AI (${node.id}): El siguiente nodo (${nextNode.id}) es TTS. No se mostrará el mensaje de IA en el chat.`);
            }
          }
          // --- Fin: Verificar si el siguiente nodo es TTS ---

          // Añadir la respuesta real de la IA solo si el siguiente nodo NO es TTS
          if (!nextNodeIsTTS) {
             addMessage({
               content: aiResponse,
               senderId: 'agent',
               timestamp: new Date().toISOString(),
             });
          }
          
          // Guardar la variable si está configurada (siempre se guarda, se muestre o no)
          if (node.data?.responseVariableName) {
            const varName = node.data.responseVariableName;
            const cleanVarName = varName.startsWith('$')
              ? varName.substring(1)
              : varName;

            setContext((prev) => ({
              ...prev,
              variables: {
                ...prev.variables,
                [cleanVarName]: aiResponse,
              },
            }));
            
            log(`Variable guardada: ${cleanVarName}`)
          }
          
        } catch (error) {
          console.error('Error al procesar prompt de IA:', error);
          
          // Eliminar el mensaje de "pensando"
          setMessages(prev => prev.filter(msg => msg.content !== "Pensando..."));
          
          // Mostrar mensaje de error
          addMessage({
            content: "Lo siento, hubo un problema al generar la respuesta. Por favor, intenta nuevamente.",
            senderId: 'system',
            timestamp: new Date().toISOString(),
          });
        } finally {
          setIsProcessingAI(false);
        }

        moveToNextNode(node.id)
        break

      case 'inputNode':
      case 'input':
      case 'capture':
        const question = node.data?.question || '¿Qué quieres preguntar?'
        log(`Nodo input con pregunta: "${question}"`)
        
        addMessage({
          content: question,
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })

        setIsExpectingInput(true)
        onRequestUserInput()
        break

      case 'conditionNode':
      case 'conditional':
      case 'condition':
        const options = node.data?.options || []
        let targetHandleId = 'true'

        if (options.length > 0) {
          log(`Nodo condición con ${options.length} opciones. Seleccionando primera: ${options[0]?.label}`)
          
          addMessage({
            content: `[Condición] ${node.data?.condition || 'Condición sin configurar'} → ${options[0].label || 'Opción 1'}`,
            senderId: 'system',
            timestamp: new Date().toISOString(),
          })

          targetHandleId = options[0].value || 'handle-0'
        } else {
          log('Nodo condición sin opciones, usando handle predeterminado "true"')
        }

        moveToNextNode(node.id)
        break

      case 'tts':
      case 'ttsNode':
      case 'text-to-speech':
        log('Procesando nodo de texto a voz (TTS)')
        
        let textToSynthesize = ''
        let usedAiResponse = false

        // --- Inicio: Lógica para detectar nodo AI previo ---
        const incomingEdge = edges.find(edge => edge.target === node.id)
        if (incomingEdge) {
          const previousNode = nodes.find(n => n.id === incomingEdge.source)
          if (previousNode && ['aiNode', 'ai', 'ai_response'].includes(previousNode.type || '')) {
            const aiVarName = previousNode.data?.responseVariableName
            const cleanAiVarName = aiVarName?.startsWith('$') ? aiVarName.substring(1) : aiVarName
            
            if (cleanAiVarName && context.variables[cleanAiVarName]) {
              textToSynthesize = String(context.variables[cleanAiVarName])
              log(`Detectado nodo AI previo (${previousNode.id}). Usando respuesta de variable ${cleanAiVarName}: "${textToSynthesize.substring(0, 30)}..."`)
              usedAiResponse = true
            } else {
               log(`Nodo AI previo (${previousNode.id}) encontrado, pero sin variable de respuesta configurada o sin valor en contexto.`)
            }
          }
        }
        // --- Fin: Lógica para detectar nodo AI previo ---

        // Si no se usó la respuesta de IA, usar la lógica original
        if (!usedAiResponse) {
           if (
             node.data?.textVariableName &&
             context.variables[node.data.textVariableName]
           ) {
             textToSynthesize = String(
               context.variables[node.data.textVariableName],
             )
             log(`Usando texto de variable TTS ${node.data.textVariableName}: "${textToSynthesize.substring(0, 30)}..."`)
           } else {
             textToSynthesize = replaceVariables(
               node.data?.text || '',
               context.variables,
             )
             log(`Usando texto directo TTS: "${textToSynthesize.substring(0, 30)}..."`)
           }
        }

        if (!textToSynthesize) {
          textToSynthesize = 'No hay texto para sintetizar.'
          log('No se encontró texto, usando mensaje por defecto')
        }

        // Añadir mensaje con indicador de audio
        const messageWithAudio = {
          content: '', // Cambiado para no mostrar texto
          senderId: 'agent' as const,
          timestamp: new Date().toISOString(),
          hasAudio: true,
          voiceStatusText: 'Mensaje de voz'
        };
        
        addMessage(messageWithAudio);
        setLastMessageWithAudio(messageWithAudio);

        // Reproducir audio si es un voicebot y TTS está habilitado
        if (isVoiceBot && ttsEnabled) {
          try {
            log('Sintetizando voz')
            // Sintetizar el texto directamente con voz y velocidad configuradas
            const voiceOption = node.data?.voice || 'Spanish_Kind-heartedGirl';
            log(`TTS Node: Usando voz configurada: ${voiceOption}`);
            
            speechSynthesis.speak(textToSynthesize, {
              voice: voiceOption,
              rate: node.data?.speed || 1.0, // Usar speed en lugar de rate para ser consistente
            });
            // El avance al siguiente nodo se manejará en el callback onSpeechEnd
          } catch (error) {
            console.error('Error al iniciar síntesis:', error);
            // En caso de error, avanzamos igual
            moveToNextNode(node.id);
          }
        } else {
          log('TTS no habilitado, avanzando inmediatamente')
          moveToNextNode(node.id);
        }
        break;

      case 'stt':
      case 'sttNode':
      case 'speech-to-text':
        // Guardar el prompt para contexto
        const prompt = node.data?.prompt || 'Por favor, envía un mensaje de voz...';
        log(`Procesando nodo de voz a texto (STT) con prompt: "${prompt}"`)
        
        setCurrentPrompt(prompt);
        
        addMessage({
          content: prompt,
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })

        if (isVoiceBot) {
          log('Esperando entrada de voz')
          setIsExpectingVoiceInput(true)
          onStartVoiceInput()
        } else {
          log('Voicebot no habilitado, esperando entrada de texto')
          setIsExpectingInput(true)
          onRequestUserInput()
        }
        break

      case 'endNode':
      case 'end':
        const endMessage = node.data?.message || 'Fin de la conversación'
        log(`Procesando nodo fin con mensaje: "${endMessage}"`)
        
        addMessage({
          content: endMessage,
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })

        // No hay nodo siguiente, la conversación termina
        log('Fin de la conversación')
        setContext((prev) => ({
          ...prev,
          currentNodeId: null,
        }))
        break

      case 'routerNode':
      case 'router':
        const routerMessage = node.data?.message || 'Cambiando a otro flujo...'
        log(`Procesando nodo router con mensaje: "${routerMessage}"`)
        
        addMessage({
          content: routerMessage,
          senderId: 'system',
          timestamp: new Date().toISOString(),
        })
        
        // Aquí iría la lógica para cambiar a otro flujo
        moveToNextNode(node.id)
        break

      case 'actionNode':
      case 'action':
        const actionType = node.data?.actionType || 'default_action'
        log(`Procesando nodo acción: "${actionType}"`)
        
        addMessage({
          content: `[Acción] Ejecutando ${actionType}...`,
          senderId: 'system',
          timestamp: new Date().toISOString(),
        })
        
        // Aquí iría la lógica para ejecutar la acción
        moveToNextNode(node.id)
        break

      default:
        log(`Nodo de tipo desconocido: ${node.type || 'sin tipo'} (ID: ${node.id}). Datos del nodo:`, node.data)
        // Si es un caso especial para AIVoiceAgentNode pero con variación en el nombre
        if (node.type?.toLowerCase().includes('voice') && node.type?.toLowerCase().includes('ai')) {
          log('Detectado posible nodo AI Voice Agent con nombre variante, intentando procesar como AIVoiceAgentNode')
          // Intentar procesar como AIVoiceAgentNode 
          const aiPrompt = node.data?.prompt || 'Prompt sin configurar'
          addMessage({
            content: "Pensando...",
            senderId: 'system',
            timestamp: new Date().toISOString(),
          })
          
          try {
            setIsProcessingAI(true)
            aiProcessor.processPrompt(aiPrompt, {
              model: node.data?.model || 'gpt-3.5-turbo',
              temperature: node.data?.temperature || 0.7,
              provider: node.data?.provider || 'openai',
              variables: context.variables
            }).then(aiResponse => {
              setMessages(prev => prev.filter(msg => msg.content !== "Pensando..."))
              
              if (isVoiceBot && ttsEnabled) {
                try {
                  log(`Sintetizando voz desde handler alternativo (${node.type})`)
                  addMessage({
                    content: aiResponse,
                    senderId: 'agent',
                    timestamp: new Date().toISOString(),
                  })
                  // Usar la voz configurada en el nodo o una voz española por defecto
                  const voiceOption = node.data?.voice || 'Spanish_Kind-heartedGirl';
                  log(`Nodo alternativo: Usando voz configurada: ${voiceOption}`);
                  
                  speechSynthesis.speak(aiResponse, {
                    voice: voiceOption,
                    rate: node.data?.speed || 1.0, // Usar speed en lugar de rate para ser consistente
                  })
                } catch (error) {
                  console.error('Error al iniciar síntesis:', error)
                  moveToNextNode(node.id)
                }
              } else {
                addMessage({
                  content: aiResponse,
                  senderId: 'agent',
                  timestamp: new Date().toISOString(),
                })
                moveToNextNode(node.id)
              }
            }).catch(error => {
              setMessages(prev => prev.filter(msg => msg.content !== "Pensando..."))
              addMessage({
                content: "Error procesando la IA: " + error,
                senderId: 'system',
                timestamp: new Date().toISOString(),
              })
              moveToNextNode(node.id)
            }).finally(() => {
              setIsProcessingAI(false)
            })
          } catch (error) {
            console.error('Error general procesando nodo AI Voice:', error)
            setIsProcessingAI(false)
            moveToNextNode(node.id)
          }
        } else {
          // Comportamiento estándar para otros tipos de nodos desconocidos
          log('Avanzando al siguiente nodo')
          moveToNextNode(node.id)
        }
    }
  }, [addMessage, context.variables, isVoiceBot, ttsEnabled, onStartVoiceInput, onRequestUserInput, moveToNextNode, speechSynthesis, aiProcessor, log])

  // Procesar la respuesta del usuario (texto o voz)
  const handleUserResponse = useCallback((userInput: string) => {
    log(`Procesando respuesta del usuario: "${userInput.substring(0, 30)}..."`)
    
    // Actualizar el contexto con la respuesta del usuario
    const currentNode = nodes.find(
      (node) => node.id === context.currentNodeId,
    )
    
    if (currentNode) {
      let variableName = ''
      
      // Determinar la variable según el tipo de nodo
      if (currentNode.type === 'inputNode' && currentNode.data?.variableName) {
        variableName = currentNode.data.variableName
      } else if (
        (currentNode.type === 'stt' || 
         currentNode.type === 'sttNode' || 
         currentNode.type === 'speech-to-text') && 
        currentNode.data?.variableName
      ) {
        variableName = currentNode.data.variableName
      }
      
      if (variableName) {
        // Eliminar el símbolo $ si está presente
        const cleanVarName = variableName.startsWith('$')
          ? variableName.substring(1)
          : variableName

        // Actualizar el contexto con la variable
        setContext((prev) => {
          const updatedVariables = {
            ...prev.variables,
            [cleanVarName]: userInput,
          }

          log(`Variable guardada: ${cleanVarName} = ${userInput.substring(0, 30)}...`)

          return {
            ...prev,
            variables: updatedVariables,
          }
        })
      }
    }

    // Reiniciar los estados de entrada
    setIsExpectingInput(false)
    setIsExpectingVoiceInput(false)

    // Continuar con el siguiente nodo
        setTimeout(() => {
          if (context.currentNodeId) {
            log(`Continuando flujo después de respuesta del usuario, desde nodo ${context.currentNodeId}`)
            moveToNextNode(context.currentNodeId)
          } else {
            log('No hay nodo actual para continuar después de la respuesta del usuario')
          }
        }, 100)
      }, [context.currentNodeId, nodes, moveToNextNode, log])

  // Inicializar el chatbot con el nodo inicial
  useEffect(() => {
    startTimeRef.current = Date.now()
    log('Inicializando chatbot')
    
    // Buscar el nodo inicial
    const startNode = nodes.find((node) => node.type === 'startNode' || node.type === 'start')
    if (startNode) {
      log(`Nodo inicial encontrado: ${startNode.id}`)
      
      setContext(prev => {
        // Evitar actualización innecesaria
        if (prev.currentNodeId === startNode.id && 
            prev.processedNodes.size === 0 && 
            Object.keys(prev.variables).length === 0) {
          return prev
        }
        
        return {
          variables: {},
          currentNodeId: startNode.id,
          processedNodes: new Set(),
        }
      })
    } else {
      log('ERROR: No se encontró nodo inicial (startNode) en el flujo')
    }
  }, [nodes, log])

  // Efecto para procesar el nodo actual cuando cambia
  useEffect(() => {
    if (context.currentNodeId && !context.processedNodes.has(context.currentNodeId)) {
      log(`Detectado cambio a nodo no procesado: ${context.currentNodeId}`)
      
      const currentNode = nodes.find(
        (node) => node.id === context.currentNodeId,
      )
      
      if (currentNode) {
        // Añadir un pequeño retraso para simular la respuesta
        const delay = currentNode.data?.delay || 700
        log(`Procesando nodo ${context.currentNodeId} en ${delay}ms`)
        
        const timer = setTimeout(() => {
          processNode(currentNode)
        }, delay)

        return () => {
          log(`Cancelando timer para nodo ${context.currentNodeId}`)
          clearTimeout(timer)
        }
      } else {
        log(`ERROR: No se encontró el nodo con ID ${context.currentNodeId}`)
      }
    }
  }, [context.currentNodeId, context.processedNodes, nodes, processNode, log])

  // Función para resetear la conversación
  const resetConversation = useCallback(() => {
    log('Reseteando conversación')
    
    setMessages([])
    setIsExpectingInput(false)
    setIsExpectingVoiceInput(false)
    
    // Cancelar cualquier síntesis de voz en curso
    speechSynthesis.cancel()
    
    // Buscar el nodo inicial y comenzar de nuevo
    const startNode = nodes.find((node) => node.type === 'startNode' || node.type === 'start')
    if (startNode) {
      log(`Reiniciando con nodo inicial: ${startNode.id}`)
      
      setContext({
        variables: {},
        currentNodeId: startNode.id,
        processedNodes: new Set(),
      })
    } else {
      log('ERROR: No se encontró nodo inicial para reiniciar')
    }
  }, [nodes, speechSynthesis, log])

  return {
    messages,
    context,
    lastMessageWithAudio,
    currentPrompt,
    isExpectingInput,
    isExpectingVoiceInput,
    speechSynthesis,
    aiProcessor,
    isProcessingAI,
    addMessage,
    handleUserResponse,
    moveToNextNode,
    resetConversation
  }
}
