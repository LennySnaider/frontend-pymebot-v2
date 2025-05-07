/**
 * frontend/src/components/view/ChatbotBuilder/VoiceChatUI.tsx
 * Componente de interfaz de usuario para chatbot con capacidades de voz
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect, useRef } from 'react'
import {
    PiMicrophoneBold,
    PiPhoneBold,
    PiXBold,
    PiChatCircleTextBold,
    PiPaperPlaneTiltBold,
} from 'react-icons/pi'

interface VoiceChatUIProps {
    botName?: string
    initialMessage?: string
    onClose?: () => void
    onSendMessage?: (message: string) => void
    onVoiceRecord?: () => void
    onVoiceStop?: () => void
    onCall?: () => void
    fullscreen?: boolean
    theme?: {
        primaryColor?: string
        textColor?: string
        backgroundColor?: string
        secondaryColor?: string
    }
    containerClassName?: string
}

const VoiceChatUI: React.FC<VoiceChatUIProps> = ({
    botName = 'Customer Service Agent',
    initialMessage = 'Por favor, envía un mensaje de voz...',
    onClose,
    onSendMessage,
    onVoiceRecord,
    onVoiceStop,
    onCall,
    fullscreen = false,
    theme = {
        primaryColor: '#1e6f50',
        textColor: '#ffffff',
        backgroundColor: '#1e6f50',
        secondaryColor: '#2a8868',
    },
    containerClassName,
}) => {
    // Estados
    const [messages, setMessages] = useState<
        Array<{
            id: string
            text: string
            sender: 'user' | 'bot'
            type: 'text' | 'voice' | 'thinking'
            timestamp: Date
        }>
    >([])
    const [inputText, setInputText] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [isThinking, setIsThinking] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isExpanded, setIsExpanded] = useState(fullscreen)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioLevels, setAudioLevels] = useState<number[]>([])

    // Referencias
    const messageListRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const recordingRef = useRef<MediaRecorder | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    // Efectos
    useEffect(() => {
        // Añadir mensaje inicial cuando se monta el componente
        setMessages([
            {
                id: 'initial',
                text: initialMessage,
                sender: 'bot',
                type: 'text',
                timestamp: new Date(),
            },
        ])

        // Limpiar temporizadores y grabaciones al desmontar
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }

            if (recordingRef.current) {
                recordingRef.current.stop()
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }

            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [initialMessage])

    // Efecto para hacer scroll al último mensaje
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop =
                messageListRef.current.scrollHeight
        }
    }, [messages])

    // Simulación de niveles de audio aleatorios para la visualización
    useEffect(() => {
        if (isRecording) {
            // Iniciar el contexto de audio
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext ||
                    (window as any).webkitAudioContext)()
                analyserRef.current = audioContextRef.current.createAnalyser()
                analyserRef.current.fftSize = 256

                // En un caso real, aquí se conectaría el micrófono
                // Esta es solo una simulación visual
                const simulateAudioLevels = () => {
                    const levels = []
                    // Generar entre 15-25 barras para la visualización
                    const numBars = Math.floor(Math.random() * 10) + 15

                    for (let i = 0; i < numBars; i++) {
                        // Valores más altos en el centro, más bajos en los extremos
                        const distanceFromCenter =
                            Math.abs(i - numBars / 2) / (numBars / 2)
                        const baseHeight = 0.7 - distanceFromCenter * 0.5

                        // Añadir aleatoriedad
                        const randomFactor = Math.random() * 0.5
                        levels.push(baseHeight + randomFactor)
                    }

                    setAudioLevels(levels)
                    animationFrameRef.current =
                        requestAnimationFrame(simulateAudioLevels)
                }

                simulateAudioLevels()
            }

            // Temporizador para el tiempo de grabación
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1)
            }, 1000)
        } else {
            // Detener visualización y temporizador
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }

            if (timerRef.current) {
                clearInterval(timerRef.current)
            }

            setRecordingTime(0)
            setAudioLevels([])
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isRecording])

    // Funciones auxiliares
    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false)
            if (onVoiceStop) onVoiceStop()

            // Simular respuesta de voz
            setIsThinking(true)

            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-${Date.now()}`,
                        text: '⏺️ Mensaje de voz enviado',
                        sender: 'user',
                        type: 'voice',
                        timestamp: new Date(),
                    },
                ])

                setIsThinking(true)

                // Simular "pensando..."
                setTimeout(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `msg-${Date.now()}`,
                            text: '¡Gracias por tu mensaje! ¿En qué puedo ayudarte hoy?',
                            sender: 'bot',
                            type: 'text',
                            timestamp: new Date(),
                        },
                    ])
                    setIsThinking(false)
                }, 2000)
            }, 1000)
        } else {
            setIsRecording(true)
            if (onVoiceRecord) onVoiceRecord()
        }
    }

    const handleSendMessage = () => {
        if (inputText.trim()) {
            // Añadir mensaje del usuario
            setMessages((prev) => [
                ...prev,
                {
                    id: `msg-${Date.now()}`,
                    text: inputText,
                    sender: 'user',
                    type: 'text',
                    timestamp: new Date(),
                },
            ])

            if (onSendMessage) onSendMessage(inputText)

            // Limpiar input
            setInputText('')

            // Simular respuesta
            setIsThinking(true)
            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-${Date.now()}`,
                        text: 'Gracias por tu mensaje. Estoy procesando tu solicitud.',
                        sender: 'bot',
                        type: 'text',
                        timestamp: new Date(),
                    },
                ])
                setIsThinking(false)
            }, 2000)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Estilos dinámicos
    const containerStyle = {
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column' as const,
        width: isExpanded ? '100%' : '350px',
        height: isExpanded ? '100%' : '600px',
        maxHeight: isExpanded ? '100vh' : '600px',
    }

    const headerStyle = {
        backgroundColor: theme.primaryColor,
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.secondaryColor}`,
    }

    const messageContainerStyle = {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    }

    const botMessageStyle = {
        alignSelf: 'flex-start' as const,
        backgroundColor: theme.primaryColor,
        color: theme.textColor,
        padding: '10px 14px',
        borderRadius: '18px 18px 18px 4px',
        maxWidth: '80%',
        wordBreak: 'break-word' as const,
    }

    const userMessageStyle = {
        alignSelf: 'flex-end' as const,
        backgroundColor: '#ffffff',
        color: '#333333',
        padding: '10px 14px',
        borderRadius: '18px 18px 4px 18px',
        maxWidth: '80%',
        wordBreak: 'break-word' as const,
    }

    const thinkingStyle = {
        alignSelf: 'flex-start' as const,
        backgroundColor: theme.primaryColor,
        color: theme.textColor,
        padding: '10px 14px',
        borderRadius: '18px 18px 18px 4px',
        opacity: 0.7,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    }

    const inputContainerStyle = {
        padding: '10px 14px',
        display: 'flex',
        gap: '8px',
        borderTop: `1px solid ${theme.secondaryColor}`,
        backgroundColor: theme.secondaryColor,
    }

    const buttonStyle = {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isRecording ? '#ff4a4a' : '#ffffff',
        color: isRecording ? '#ffffff' : '#1e6f50', // Color fijo más oscuro para mejor contraste
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', // Añadido sombra para mejor visibilidad
    }

    const iconButtonStyle = {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        color: theme.textColor,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }

    return (
        <div className={containerClassName} style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#34d399' }}
                    >
                        <PiChatCircleTextBold size={20} />
                    </div>
                    <span className="font-medium">{botName}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        style={iconButtonStyle}
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label={isExpanded ? 'Minimizar' : 'Maximizar'}
                    >
                        {isExpanded ? (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M1.5 10.5L6 6L10.5 10.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        ) : (
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M15 1H10M15 1V6M15 1L9 7"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M1 15H6M1 15V10M1 15L7 9"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </button>
                    <button
                        style={iconButtonStyle}
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <PiXBold size={18} />
                    </button>
                </div>
            </div>

            {/* Message Container */}
            <div ref={messageListRef} style={messageContainerStyle}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        style={
                            message.sender === 'bot'
                                ? botMessageStyle
                                : userMessageStyle
                        }
                    >
                        {message.text}
                    </div>
                ))}

                {isThinking && (
                    <div style={thinkingStyle}>
                        <span>Pensando</span>
                        <span className="flex gap-1">
                            <span className="animate-bounce">.</span>
                            <span
                                className="animate-bounce"
                                style={{ animationDelay: '0.2s' }}
                            >
                                .
                            </span>
                            <span
                                className="animate-bounce"
                                style={{ animationDelay: '0.4s' }}
                            >
                                .
                            </span>
                        </span>
                    </div>
                )}

                {isRecording && (
                    <div
                        className="self-center flex flex-col items-center mt-4 mb-4"
                        style={{ width: '80%' }}
                    >
                        <div className="flex items-end justify-center gap-[2px] h-20 w-full mb-4">
                            {audioLevels.map((level, index) => (
                                <div
                                    key={index}
                                    className="bg-white w-[8px] rounded-full"
                                    style={{
                                        height: `${level * 100}%`,
                                        opacity: 0.7 + level * 0.3,
                                        transition: 'height 0.1s ease',
                                    }}
                                />
                            ))}
                        </div>
                        <div className="text-white bg-black bg-opacity-20 px-4 py-1 rounded-full">
                            {formatTime(recordingTime)}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Container */}
            <div style={inputContainerStyle}>
                {isRecording ? (
                    <button
                        style={buttonStyle}
                        onClick={toggleRecording}
                        aria-label="Detener grabación"
                    >
                        <span className="w-3 h-3 bg-white rounded"></span>
                    </button>
                ) : (
                    <>
                        <input
                            type="text"
                            ref={inputRef}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSendMessage()
                            }
                            placeholder="Escribe un mensaje..."
                            className="flex-1 px-4 py-2 rounded-full focus:outline-none"
                            style={{ backgroundColor: '#ffffff' }}
                        />
                        <button
                            style={{
                                ...buttonStyle,
                                border: '2px solid #10b981', // Agregar borde verde para mayor visibilidad
                            }}
                            onClick={toggleRecording}
                            aria-label="Iniciar grabación de voz"
                        >
                            <PiMicrophoneBold size={24} className="text-green-700" />
                        </button>
                        {inputText.trim() && (
                            <button
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: theme.primaryColor,
                                    color: '#ffffff',
                                }}
                                onClick={handleSendMessage}
                                aria-label="Enviar mensaje"
                            >
                                <PiPaperPlaneTiltBold size={18} />
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Call Bar (opcional, solo visible en ciertos momentos) */}
            {false && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#16a34a', // Verde (llamada activa)
                        color: '#ffffff',
                    }}
                >
                    <div>Llamada en curso: 02:34</div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-full bg-white/20">
                            <PiMicrophoneBold size={20} />
                        </button>
                        <button className="p-2 rounded-full bg-red-500">
                            <PiPhoneBold size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VoiceChatUI
