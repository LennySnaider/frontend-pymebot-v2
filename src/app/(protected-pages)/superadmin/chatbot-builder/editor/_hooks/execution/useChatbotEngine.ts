'use client'

/**
 * Hook para manejar la ejecución del motor del chatbot
 * @version 1.0.0
 * @updated 2025-04-14
 */

import { useState, useEffect, useCallback } from 'react'
import { Node, Edge } from 'reactflow'
import { replaceVariables } from '@/services/SystemVariablesService'
import { MessageType } from '../../_components/ChatMessage'

// Interfaces
export interface ChatbotContext {
  variables: Record<string, string | number | boolean>
  currentNodeId: string | null
  processedNodes: Set<string>
  activeNodeType?: 'buttonsNode' | 'listNode' | string
  activeNodeId?: string
  activeNodeButtons?: Array<{ text: string, value?: string }>
  activeNodeListItems?: Array<{ text: string, description?: string, value?: string }>
}

interface UseChatbotEngineOptions {
  nodes: Node[]
  edges: Edge[]
  onMessage: (message: MessageType) => void
  onSynthesizeSpeech: (text: string) => void
  isVoiceBot: boolean
  onStartVoiceInput: () => void
  onStartTextInput: () => void
}

interface NodeProcessorProps {
  node: Node
  context: ChatbotContext
  onAddMessage: (message: MessageType) => void
  onSynthesizeSpeech: (text: string) => void
  isVoiceBot: boolean
  moveToNextNode: (currentNodeId: string, handleId?: string) => void
  updateContext: (updater: (prev: ChatbotContext) => ChatbotContext) => void
  onStartVoiceInput: () => void
  onStartTextInput: () => void
}

export function useChatbotEngine({
  nodes,
  edges,
  onMessage,
  onSynthesizeSpeech,
  isVoiceBot,
  onStartVoiceInput,
  onStartTextInput
}: UseChatbotEngineOptions) {
  // Estado del chatbot (contexto)
  const [context, setContext] = useState<ChatbotContext>({
    variables: {},
    currentNodeId: null,
    processedNodes: new Set(),
  })
  
  // Estado para almacenar el prompt actual (para STT)
  const [currentPrompt, setCurrentPrompt] = useState("")
  
  // Función para añadir un mensaje a la conversación
  const addMessage = useCallback((message: MessageType) => {
    // Reemplazar variables en el contenido del mensaje
    if (message.senderId === 'agent' || message.senderId === 'system') {
      const processedContent = replaceVariables(
        message.content,
        context.variables
      )
      message.content = processedContent
    }

    onMessage(message)
  }, [context.variables, onMessage])
  
  // Función para encontrar y moverse al siguiente nodo
  const moveToNextNode = useCallback((currentNodeId: string, handleId?: string) => {
    // Encontrar todas las conexiones que salen del nodo actual
    const outgoingEdges = edges.filter(
      (edge) => edge.source === currentNodeId,
    )

    // Si hay un handleId específico, filtrar por él
    const relevantEdges = handleId
      ? outgoingEdges.filter(
          (edge) =>
            edge.sourceHandle === handleId ||
            edge.sourceHandle === null,
        )
      : outgoingEdges

    // Si hay conexiones, seguir al primer destino
    if (relevantEdges.length > 0) {
      const nextNodeId = relevantEdges[0].target

      // Actualizar el nodo actual en el contexto
      setContext((prev) => ({
        ...prev,
        currentNodeId: nextNodeId,
      }))
    } else {
      // Si no hay conexiones salientes, la conversación termina
      console.log('No hay más nodos a seguir')
      if (context.currentNodeId !== null) {
        addMessage({
          content:
            'Fin del flujo: Este nodo no tiene conexiones hacia otros nodos.',
          senderId: 'system',
          timestamp: new Date().toISOString(),
        })

        setContext((prev) => ({
          ...prev,
          currentNodeId: null,
        }))
      }
    }
  }, [edges, context.currentNodeId, addMessage])
  
  // Procesador de cada tipo de nodo
  const processNode = useCallback(({
    node,
    context,
    onAddMessage,
    onSynthesizeSpeech,
    isVoiceBot,
    moveToNextNode,
    updateContext,
    onStartVoiceInput,
    onStartTextInput
  }: NodeProcessorProps) => {
    console.log(`Procesando nodo tipo ${node.type}:`, node)
    
    switch (node.type) {
      case 'startNode':
        moveToNextNode(node.id)
        break

      case 'messageNode':
        const message = node.data?.message || 'Mensaje sin configurar'
        onAddMessage({
          content: message,
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })

        // Si el mensaje tiene la propiedad waitForResponse o espera, esperar input del usuario
        if (node.data?.waitForResponse) {
          console.log('Mensaje configurado para esperar respuesta del usuario')
          onStartTextInput()
        } else {
          moveToNextNode(node.id)
        }
        break

      case 'aiNode':
        onAddMessage({
          content: node.data?.prompt
            ? `[Respuesta IA] Simulación de respuesta basada en: "${node.data.prompt}"`
            : 'Respuesta IA sin configurar',
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })

        if (node.data?.responseVariableName) {
          const varName = node.data.responseVariableName
          const cleanVarName = varName.startsWith('$')
            ? varName.substring(1)
            : varName

          updateContext((prev) => ({
            ...prev,
            variables: {
              ...prev.variables,
              [cleanVarName]: `Respuesta simulada para ${node.data.prompt}`,
            },
          }))
        }

        moveToNextNode(node.id)
        break

      case 'inputNode':
        onAddMessage({
          content: node.data?.question || '¿Qué quieres preguntar?',
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })

        onStartTextInput()
        break

      case 'buttonsNode':
        // Preparar mensaje con botones
        const messageWithButtons = {
          content: node.data?.message || 'Selecciona una opción:',
          senderId: 'agent',
          timestamp: new Date().toISOString(),
          buttons: Array.isArray(node.data?.buttons) ? node.data.buttons : []
        }

        onAddMessage(messageWithButtons)

        // Si está configurado para esperar respuesta
        if (node.data?.waitForResponse) {
          console.log('Nodo de botones configurado para esperar respuesta del usuario')

          // Almacenar información adicional en el contexto para el manejo de la respuesta
          updateContext(prev => ({
            ...prev,
            activeNodeType: 'buttonsNode',
            activeNodeId: node.id,
            activeNodeButtons: messageWithButtons.buttons
          }))

          onStartTextInput() // Simular la selección de botón con input de texto en el preview
        } else {
          moveToNextNode(node.id)
        }
        break

      case 'listNode':
        // Preparar mensaje con lista
        const messageWithList = {
          content: node.data?.message || 'Selecciona una opción de la lista:',
          senderId: 'agent',
          timestamp: new Date().toISOString(),
          listTitle: node.data?.listTitle,
          listItems: Array.isArray(node.data?.listItems) ? node.data.listItems : [],
          buttonText: node.data?.buttonText || 'Ver opciones'
        }

        onAddMessage(messageWithList)

        // Si está configurado para esperar respuesta
        if (node.data?.waitForResponse) {
          console.log('Nodo de lista configurado para esperar respuesta del usuario')

          // Almacenar información adicional en el contexto para el manejo de la respuesta
          updateContext(prev => ({
            ...prev,
            activeNodeType: 'listNode',
            activeNodeId: node.id,
            activeNodeListItems: messageWithList.listItems
          }))

          onStartTextInput() // Simular la selección de lista con input de texto en el preview
        } else {
          moveToNextNode(node.id)
        }
        break

      case 'conditionNode':
        const options = node.data?.options || []
        let targetHandleId = 'true'

        if (options.length > 0) {
          onAddMessage({
            content: `[Condición] ${node.data?.condition || 'Condición sin configurar'} → ${options[0].label || 'Opción 1'}`,
            senderId: 'system',
            timestamp: new Date().toISOString(),
          })

          targetHandleId = options[0].value || 'handle-0'
        }

        moveToNextNode(node.id, targetHandleId)
        break

      case 'tts':
      case 'ttsNode':
      case 'text-to-speech':
        let textToSynthesize = ''
        if (
          node.data?.textVariableName &&
          context.variables[node.data.textVariableName]
        ) {
          textToSynthesize = String(
            context.variables[node.data.textVariableName],
          )
        } else {
          textToSynthesize = replaceVariables(
            node.data?.text || '',
            context.variables,
          )
        }

        if (!textToSynthesize) {
          textToSynthesize = 'No hay texto para sintetizar.'
        }

        // Añadir mensaje con indicador de audio
        onAddMessage({
          content: textToSynthesize,
          senderId: 'agent',
          timestamp: new Date().toISOString(),
          hasAudio: true,
        })

        // Reproducir audio si es un voicebot
        if (isVoiceBot) {
          // Usa el servicio de síntesis
          console.log('Sintetizando voz para:', textToSynthesize);
          onSynthesizeSpeech(textToSynthesize);
          
          // No avanzar aquí - esperamos a que termine el audio para avanzar
          // La lógica de avanzar después del audio se maneja fuera de esta función
        } else {
          moveToNextNode(node.id);
        }
        break

      case 'stt':
      case 'sttNode':
      case 'speech-to-text':
        // Guardar el prompt para contexto
        const prompt = node.data?.prompt || 'Por favor, envía un mensaje de voz...';
        setCurrentPrompt(prompt);
        
        onAddMessage({
          content: prompt,
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })

        if (isVoiceBot) {
          onStartVoiceInput()
        } else {
          onStartTextInput()
        }
        break

      case 'endNode':
        onAddMessage({
          content: node.data?.message || 'Fin de la conversación',
          senderId: 'agent',
          timestamp: new Date().toISOString(),
        })

        // No hay nodo siguiente, la conversación termina
        updateContext((prev) => ({
          ...prev,
          currentNodeId: null,
        }))
        break

      default:
        moveToNextNode(node.id)
    }
  }, [])
  
  // Efecto para inicializar el chatbot con el nodo inicial
  useEffect(() => {
    // Buscar el nodo inicial
    const startNode = nodes.find((node) => node.type === 'startNode')
    if (startNode) {
      setContext((prev) => ({
        ...prev,
        currentNodeId: startNode.id,
      }))

      // Pequeño retraso antes de comenzar la conversación
      setTimeout(() => {
        // Marcar el nodo como procesado y procesarlo
        setContext((prev) => ({
          ...prev,
          processedNodes: new Set([...prev.processedNodes, startNode.id]),
        }))
        
        processNode({
          node: startNode,
          context,
          onAddMessage: addMessage,
          onSynthesizeSpeech,
          isVoiceBot,
          moveToNextNode,
          updateContext: setContext,
          onStartVoiceInput,
          onStartTextInput
        })
      }, 500)
    }
  }, [nodes, addMessage, context, moveToNextNode, onSynthesizeSpeech, isVoiceBot, onStartVoiceInput, onStartTextInput, processNode])

  // Efecto para procesar el nodo actual cuando cambia
  useEffect(() => {
    if (
      context.currentNodeId &&
      !context.processedNodes.has(context.currentNodeId)
    ) {
      const currentNode = nodes.find(
        (node) => node.id === context.currentNodeId,
      )
      if (currentNode) {
        // Añadir un pequeño retraso para simular la respuesta
        const delay = currentNode.data?.delay || 700
        const timer = setTimeout(() => {
          // Marcar este nodo como procesado
          setContext((prev) => ({
            ...prev,
            processedNodes: new Set([...prev.processedNodes, currentNode.id]),
          }))
          
          processNode({
            node: currentNode,
            context,
            onAddMessage: addMessage,
            onSynthesizeSpeech,
            isVoiceBot,
            moveToNextNode,
            updateContext: setContext,
            onStartVoiceInput,
            onStartTextInput
          })
        }, delay)

        return () => clearTimeout(timer)
      }
    }
  }, [context, nodes, addMessage, moveToNextNode, onSynthesizeSpeech, isVoiceBot, onStartVoiceInput, onStartTextInput, processNode])
  
  // Función para manejar la respuesta del usuario
  const handleUserResponse = useCallback((userInput: string) => {
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

          console.log('Variable guardada:', cleanVarName, '=', userInput)

          return {
            ...prev,
            variables: updatedVariables,
          }
        })
      }
    }

    // Determinar el siguiente nodo basado en el tipo de nodo activo y la respuesta del usuario
    setTimeout(() => {
      if (context.currentNodeId) {
        // Si tenemos un nodo de botones activo
        if (context.activeNodeType === 'buttonsNode' && Array.isArray(context.activeNodeButtons)) {
          // Tratar de buscar el botón que coincide con la entrada del usuario
          const buttonIndex = context.activeNodeButtons.findIndex(button =>
            button.text.toLowerCase() === userInput.toLowerCase() ||
            (button.value && button.value.toLowerCase() === userInput.toLowerCase())
          );

          // Si encontramos un botón que coincide y tenemos suficientes handles
          if (buttonIndex >= 0) {
            // Usar el handle correspondiente al botón
            moveToNextNode(context.currentNodeId, `handle-${buttonIndex}`);
            return;
          }

          // Si no encontramos coincidencia pero tenemos botones, usar el primero por defecto
          if (context.activeNodeButtons.length > 0) {
            console.log('No se encontró coincidencia exacta con botones, usando la primera opción por defecto');
            moveToNextNode(context.currentNodeId, 'handle-0');
            return;
          }
        }
        // Si tenemos un nodo de lista activo
        else if (context.activeNodeType === 'listNode' && Array.isArray(context.activeNodeListItems)) {
          // Tratar de buscar el item que coincide con la entrada del usuario
          const itemIndex = context.activeNodeListItems.findIndex(item =>
            item.text.toLowerCase() === userInput.toLowerCase() ||
            (item.value && item.value.toLowerCase() === userInput.toLowerCase())
          );

          // Si encontramos un item que coincide y está dentro de los 5 primeros (los que tienen handles)
          if (itemIndex >= 0 && itemIndex < 5) {
            // Usar el handle correspondiente al item
            moveToNextNode(context.currentNodeId, `handle-${itemIndex}`);
            return;
          }

          // Si no encontramos coincidencia pero tenemos items, usar el primero por defecto
          if (context.activeNodeListItems.length > 0) {
            console.log('No se encontró coincidencia exacta con items de lista, usando la primera opción por defecto');
            moveToNextNode(context.currentNodeId, 'handle-0');
            return;
          }
        }

        // En caso de no tener un tipo específico o no encontrar coincidencias, usar comportamiento estándar
        moveToNextNode(context.currentNodeId)
      }
    }, 100)
  }, [context.currentNodeId, moveToNextNode, nodes])
  
  // Función para procesar voz a texto
  const processSpeechToText = useCallback((text: string) => {
    // Añadir mensaje con la transcripción
    addMessage({
      content: text,
      senderId: 'user',
      timestamp: new Date().toISOString(),
    })
    
    // Procesar la respuesta
    handleUserResponse(text)
  }, [addMessage, handleUserResponse])
  
  // Función para procesar audio a texto (simulación)
  const generateSpeechToTextResponse = useCallback(() => {
    // En un sistema real, obtenemos la transcripción desde la API
    // Aquí simulamos una respuesta relacionada con el contexto actual
    let response = "";
    
    // Busca el nodo actual
    const currentNode = nodes.find(node => node.id === context.currentNodeId);
    
    if (currentNode?.type === 'stt' || currentNode?.type === 'sttNode' || currentNode?.type === 'speech-to-text') {
      // Buscamos posibles continuaciones desde este nodo
      const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
      
      if (outgoingEdges.length > 0) {
        // Identificar el tipo de nodo conectado para generar una respuesta coherente
        const nextNodeId = outgoingEdges[0].target;
        const nextNode = nodes.find(node => node.id === nextNodeId);
        
        if (nextNode) {
          // Generamos respuestas basadas en el tipo de nodo siguiente
          if (nextNode.type === 'inputNode' && nextNode.data?.question) {
            if (nextNode.data.question.toLowerCase().includes('horario')) {
              response = "¿Cuál es el horario de atención?";
            } else if (nextNode.data.question.toLowerCase().includes('cita')) {
              response = "Me gustaría agendar una cita.";
            } else {
              response = "¿Qué servicios ofrecen?";
            }
          }
          // Si el siguiente nodo es de condición
          else if (nextNode.type === 'conditionNode') {
            response = "Quisiera más información sobre sus servicios.";
          }
          // Si es un nodo TTS
          else if (nextNode.type === 'tts' || nextNode.type === 'ttsNode') {
            response = "Gracias, espero su respuesta.";
          }
        }
      }
      
      // Si no pudimos determinar una respuesta contextual, usamos el prompt como guía
      if (!response) {
        if (currentPrompt.toLowerCase().includes('horario')) {
          response = "¿Cuál es el horario de atención?";
        } else if (currentPrompt.toLowerCase().includes('cita')) {
          response = "Me gustaría agendar una cita.";
        } else {
          response = "¿Qué servicios ofrecen?";
        }
      }
    }
    
    return response || "¿Puede darme más información?";
  }, [context.currentNodeId, currentPrompt, edges, nodes])
  
  return {
    context,
    setContext,
    moveToNextNode,
    addMessage,
    handleUserResponse,
    processSpeechToText,
    generateSpeechToTextResponse,
    currentPrompt
  }
}
