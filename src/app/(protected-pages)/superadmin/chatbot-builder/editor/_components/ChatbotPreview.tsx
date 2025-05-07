/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/ChatbotPreview.tsx
 * Componente para previsualizar y probar la funcionalidad real de un chatbot o voicebot
 * @version 3.3.0
 * @updated 2025-04-14
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Node, Edge } from 'reactflow'

// Componentes y tipos extraídos
// import { MessageType } from './chatbot-preview/types' // No usado directamente aquí
// import ChatMessage from './ChatMessage' // No usado directamente aquí
import ChatbotHeader from './chatbot-preview/ChatbotHeader'
import ChatInterface from './chatbot-preview/ChatInterface'

// Hooks personalizados
import { useAudioRecording } from '../_hooks/useAudioRecording'
import { useChatbotProcessor } from '../_hooks/useChatbotProcessor'

// Props del componente
interface ChatbotPreviewProps {
    nodes: Node[]
    edges: Edge[]
    onClose: () => void
}

const ChatbotPreview: React.FC<ChatbotPreviewProps> = ({
    nodes,
    edges,
    onClose,
}) => {
    console.log(
        'Renderizando ChatbotPreview con',
        nodes.length,
        'nodos y',
        edges.length,
        'conexiones',
    )

    // Referencias y estados básicos
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const maxRecordingDurationRef = useRef<number>(30) // 30 segundos por defecto
    const [inputValue, setInputValue] = useState('')
    const [, setErrorMessage] = useState<string | null>(null) // Marcar como no usado si solo se setea
    const [isVoiceBot, setIsVoiceBot] = useState(false)
    const [ttsEnabled, setTtsEnabled] = useState(true)

    // Hook de audio
    const audioRecording = useAudioRecording({
        maxDurationSeconds: maxRecordingDurationRef.current,
        onRecordingComplete: async (audioBlob, audioUrl) => {
            // Procesar la grabación completada
            processSpeechToText(audioBlob, audioUrl)
        },
    })

    // Detectar si el flujo es un voicebot (contiene nodos TTS, STT o AIVoice)
    useEffect(() => {
        console.log('Verificando nodos para voicebot...', nodes)

        // Lista más exhaustiva de posibles nombres de nodos de voz
        const voiceNodeTypes = [
            'ttsNode',
            'sttNode',
            'tts',
            'stt',
            'text-to-speech',
            'speech-to-text',
            'voice',
            'aiVoiceAgentNode',
            'ai-voice-agent',
            'ai_voice_agent',
            'agenteVozIA',
            'agente-voz-ia',
            'agente_voz_ia',
            'voiceAgent',
            'voice-agent',
            'voice_agent',
        ]

        // Función auxiliar para detectar nodos de voz incluso si el tipo no coincide exactamente
        const isVoiceNode = (node: Node) => {
            // Por tipo exacto
            if (voiceNodeTypes.includes(node.type || '')) return true

            // Por nombre o etiqueta que contenga palabras clave
            const keywords = ['voz', 'voice', 'audio', 'tts', 'stt', 'speech']
            const nodeLabel = String(node.data?.label || '').toLowerCase()
            if (keywords.some((keyword) => nodeLabel.includes(keyword)))
                return true

            // Por contenido de datos que indiquen capacidades de voz
            if (
                node.data?.voice ||
                node.data?.voiceProvider ||
                node.data?.tts ||
                node.data?.audio ||
                node.data?.duration
            )
                return true

            return false
        }

        const containsVoiceNodes = nodes.some(isVoiceNode)

        console.log(
            'Detección de tipo de bot:',
            containsVoiceNodes ? 'voicebot' : 'chatbot',
            'Nodos detectados con capacidades de voz:',
            nodes
                .filter(isVoiceNode)
                .map((n) => ({ id: n.id, type: n.type, label: n.data?.label })),
        )
        setIsVoiceBot(containsVoiceNodes)

        // Buscar configuración de duración máxima en nodos STT
        nodes.forEach((node) => {
            if (
                ['stt', 'sttNode', 'speech-to-text'].includes(node.type || '')
            ) {
                if (node.data?.duration && !isNaN(Number(node.data.duration))) {
                    maxRecordingDurationRef.current = Number(node.data.duration)
                    console.log(
                        'Duración máxima de grabación configurada:',
                        maxRecordingDurationRef.current,
                        'segundos',
                    )
                }
            }
        })
    }, [nodes])

    // Hook de procesamiento del chatbot
    const chatbotProcessor = useChatbotProcessor({
        nodes,
        edges,
        isVoiceBot,
        ttsEnabled,
        onStartVoiceInput: () => {
            // Acciones cuando se solicita entrada de voz
            console.log('Esperando entrada de voz...')
            // Si no hay permisos, poner en modo entrada de texto
            if (!audioRecording.micPermissionGranted) {
                setErrorMessage(
                    'No se han concedido permisos de micrófono. Puedes escribir en su lugar.',
                )
            }
        },
        onRequestUserInput: () => {
            // Acciones cuando se solicita entrada de texto
            console.log('Esperando entrada de texto...')
        },
    })

    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatbotProcessor.messages])

    // Función para procesar audio a texto (simulada para vista previa)
    const processSpeechToText = async (_audioBlob: Blob, _audioUrl: string) => {
        console.log('Procesando audio grabado...')

        // Mostrar mensaje de procesamiento
        chatbotProcessor.addMessage({
            content: 'Procesando audio...',
            senderId: 'system',
            timestamp: new Date().toISOString(),
        })

        try {
            // Simulamos un pequeño retraso para replicar la latencia de la API
            await new Promise((resolve) => setTimeout(resolve, 1500))

            // Simulación de transcripción con texto en español con acentos
            // (en un entorno real, vendría de la API)
            const transcripcionSimulada = '¿Qué propiedades tienen disponibles en el área céntrica?'

            // Añadimos el mensaje del usuario con la transcripción simulada
            chatbotProcessor.addMessage({
                content: transcripcionSimulada,
                senderId: 'user',
                timestamp: new Date().toISOString(),
            })

            // Procesamos la respuesta del usuario
            chatbotProcessor.handleUserResponse(transcripcionSimulada)
        } catch (error) {
            console.error('Error al procesar audio:', error)

            // A pesar del error, intentamos continuar el flujo
            if (chatbotProcessor.context.currentNodeId) {
                chatbotProcessor.moveToNextNode(
                    chatbotProcessor.context.currentNodeId,
                )
            }
        }
    }

    // Manejar el envío de mensajes del usuario
    const handleSendMessage = () => {
        if (
            !inputValue.trim() ||
            (!chatbotProcessor.isExpectingInput &&
                !chatbotProcessor.isExpectingVoiceInput)
        )
            return

        console.log('Enviando mensaje del usuario:', inputValue)

        // Añadir el mensaje del usuario
        chatbotProcessor.addMessage({
            content: inputValue,
            senderId: 'user',
            timestamp: new Date().toISOString(),
        })

        // Procesar la respuesta del usuario
        chatbotProcessor.handleUserResponse(inputValue)

        // Limpiar el campo de entrada
        setInputValue('')
    }

    // Alternar TTS para debug
    const toggleTTS = () => {
        console.log(`TTS ${!ttsEnabled ? 'activado' : 'desactivado'}`)
        setTtsEnabled(!ttsEnabled)

        // Cancelar cualquier síntesis en curso si se desactiva
        if (ttsEnabled) {
            chatbotProcessor.speechSynthesis.cancel()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-auto h-[80vh] flex flex-col">
                {/* Header */}
                <ChatbotHeader
                    isVoiceBot={isVoiceBot}
                    ttsEnabled={ttsEnabled}
                    toggleTTS={toggleTTS}
                    onClose={onClose}
                />

                {/* Interfaz principal de chat moderno */}
                <ChatInterface
                    messages={chatbotProcessor.messages}
                    isVoiceBot={isVoiceBot}
                    isExpectingInput={chatbotProcessor.isExpectingInput}
                    isExpectingVoiceInput={
                        chatbotProcessor.isExpectingVoiceInput
                    }
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleSendMessage={handleSendMessage}
                    isRecording={audioRecording.isRecording}
                    recordingDuration={audioRecording.recordingDuration}
                    startRecording={audioRecording.startRecording}
                    stopRecording={audioRecording.stopRecording}
                    micPermissionGranted={audioRecording.micPermissionGranted}
                    isSpeaking={chatbotProcessor.speechSynthesis.isSpeaking}
                    processingAudio={chatbotProcessor.isProcessingAI}
                />
            </div>
        </div>
    )
}

export default ChatbotPreview
