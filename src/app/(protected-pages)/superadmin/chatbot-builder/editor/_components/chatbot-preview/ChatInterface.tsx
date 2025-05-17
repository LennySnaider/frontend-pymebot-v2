'use client'

/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/chatbot-preview/ChatInterface.tsx
 * Componente moderno para la interfaz de chat inspirado en asistentes de voz modernos
 * @version 2.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect, useRef } from 'react'
import {
    Mic,
    MicOff,
    Send,
    StopCircle,
    ArrowUp,
    ShoppingCart,
    Camera,
    Phone,
} from 'lucide-react'
import { MessageType } from './types'

interface ChatInterfaceProps {
    messages: MessageType[]
    isVoiceBot: boolean
    isExpectingInput: boolean
    isExpectingVoiceInput: boolean
    inputValue: string
    setInputValue: (value: string) => void
    handleSendMessage: () => void
    isRecording: boolean
    recordingDuration: number
    startRecording: () => void
    stopRecording: () => void
    micPermissionGranted: boolean
    isSpeaking: boolean
    processingAudio: boolean
}

/**
 * Renderiza una interfaz de asistente de voz moderna similar a las de las apps actuales
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    isVoiceBot,
    isExpectingInput,
    isExpectingVoiceInput,
    inputValue,
    setInputValue,
    handleSendMessage,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    micPermissionGranted,
    isSpeaking,
    processingAudio,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [showInputArea, setShowInputArea] = useState(true)
    const [showChoices, setShowChoices] = useState(false)
    const [quickReplies, setQuickReplies] = useState<string[]>([])

    // Auto-scroll cuando llegan nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Determinar si mostrar opciones rápidas basadas en el último mensaje
    useEffect(() => {
        if (
            messages.length > 0 &&
            messages[messages.length - 1].senderId === 'agent'
        ) {
            const lastMessage =
                messages[messages.length - 1].content.toLowerCase()

            // Detectar si el mensaje parece una pregunta o solicitud que espera opciones
            if (
                lastMessage.includes('?') ||
                lastMessage.includes('opciones') ||
                lastMessage.includes('elija') ||
                lastMessage.includes('selecciona')
            ) {
                // Determinar opciones basadas en el contexto del mensaje
                if (
                    lastMessage.includes('ayudar') ||
                    lastMessage.includes('asistir')
                ) {
                    setQuickReplies([
                        'Información de productos',
                        'Hacer una compra',
                        'Soporte técnico',
                    ])
                    setShowChoices(true)
                } else if (
                    lastMessage.includes('negocio') ||
                    lastMessage.includes('información')
                ) {
                    setQuickReplies([
                        'Horarios',
                        'Ubicación',
                        'Productos/Servicios',
                        'Contacto',
                    ])
                    setShowChoices(true)
                } else if (
                    lastMessage.includes('servicio') ||
                    lastMessage.includes('producto')
                ) {
                    setQuickReplies([
                        'Precios',
                        'Disponibilidad',
                        'Características',
                        'Promociones',
                    ])
                    setShowChoices(true)
                } else {
                    setShowChoices(false)
                }
            } else {
                setShowChoices(false)
            }
        }
    }, [messages])

    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim()) {
            handleSendMessage()
        }
    }

    // Manejar selección de respuesta rápida
    const handleQuickReply = (reply: string) => {
        setInputValue(reply)
        // Pequeño delay para mostrar la selección antes de enviar
        setTimeout(() => {
            handleSendMessage()
            setShowChoices(false)
        }, 100)
    }

    // Manejar click en botón de grabación
    const handleRecordingClick = () => {
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    // Formatear el tiempo de grabación
    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }

    // Renderizar el área de mensajes con diseño moderno
    const renderMessages = () => {
        return messages.map((message, index) => {
            // Agrupar mensajes del mismo remitente para mejorar la UI
            const isConsecutive =
                index > 0 && messages[index - 1].senderId === message.senderId
            const isLast = index === messages.length - 1

            return (
                <div
                    key={index}
                    className={`message-container ${message.senderId === 'user' ? 'flex justify-end' : 'flex justify-start'} ${
                        isConsecutive ? 'mt-1' : 'mt-4'
                    } ${message.senderId === 'system' ? 'flex justify-center' : ''}`}
                >
                    {message.senderId === 'agent' && !isConsecutive && (
                        <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center mr-2 mt-1">
                            <span className="text-white text-sm">🤖</span>
                        </div>
                    )}

                    <div
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            message.senderId === 'user'
                                ? 'bg-slate-500 text-white rounded-tr-full'
                                : message.senderId === 'system'
                                  ? 'bg-gray-200 text-gray-800 py-1 px-3 text-xs rounded-full'
                                  : 'bg-white border border-gray-200 shadow-sm text-gray-800 rounded-tl-none'
                        } ${
                            isConsecutive && message.senderId === 'user'
                                ? 'rounded-tr-lg'
                                : ''
                        } ${
                            isConsecutive && message.senderId === 'agent'
                                ? 'rounded-tl-lg ml-10'
                                : ''
                        }`}
                    >
                        {/* Contenido del mensaje con formato diferente según el tipo */}
                        {message.senderId === 'system' &&
                        message.content === 'Procesando audio...' ? (
                            <div className="flex items-center space-x-2">
                                <div className="animate-pulse flex space-x-1">
                                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                </div>
                                <p>{message.content}</p>
                            </div>
                        ) : message.hasAudio ||
                          (isVoiceBot &&
                              message.senderId === 'agent' &&
                              !message.content) ? (
                            // Mensajes con audio (explícitamente marcados con hasAudio o en mensajes vacíos de agente en voicebot)
                            <div className="flex items-center space-x-2 py-1">
                                <div className="flex items-center justify-center p-1 rounded-full bg-slate-100">
                                    <svg
                                        className="h-4 w-4 text-green-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 2a8 8 0 100 16 8 8 0 000-16zm4.293 4.293a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8 12.586l6.293-6.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {message.voiceStatusText ||
                                        'Mensaje de voz del asistente'}
                                </span>
                                {isSpeaking && isLast && (
                                    <div className="flex space-x-1 items-center ml-2">
                                        <div className="w-1 h-3 bg-slate-500 rounded-full animate-sound-wave-1"></div>
                                        <div className="w-1 h-5 bg-slate-500 rounded-full animate-sound-wave-2"></div>
                                        <div className="w-1 h-3 bg-slate-500 rounded-full animate-sound-wave-3"></div>
                                        <div className="w-1 h-6 bg-slate-500 rounded-full animate-sound-wave-4"></div>
                                        <div className="w-1 h-3 bg-slate-500 rounded-full animate-sound-wave-5"></div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap">
                                {message.content}
                            </div>
                        )}
                    </div>

                    {message.senderId === 'user' && !isConsecutive && (
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center ml-2 mt-1">
                            <span className="text-white text-sm">👤</span>
                        </div>
                    )}
                </div>
            )
        })
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            {/* Área de mensajes principal - Estilo de asistente de voz */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 flex flex-col items-center justify-center">
                {/* Visualización principal - sólo el mensaje actual o último */}
                {messages.length > 0 && !isRecording && !isSpeaking && (
                    <div className="w-full flex flex-col items-center text-center">
                        {/* Onda de audio estática o pulsante según estado */}
                        <div className="mb-6 w-3/4 h-16 flex items-center justify-center">
                            <div className="w-full flex items-center justify-center space-x-1">
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-${Math.max(2, Math.min(12, 6 + Math.round(Math.sin(i / 2) * 6)))} w-1 bg-slate-300 rounded-full ${processingAudio ? 'animate-pulse' : ''}`}
                                        style={{
                                            height: `${Math.max(8, Math.min(48, 20 + Math.round(Math.sin(i / 2) * 20)))}px`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Mensaje actual */}
                        {messages[messages.length - 1].senderId === 'agent' && (
                            <p className="text-xl font-medium">
                                {messages[messages.length - 1].content ||
                                    'Mensaje de voz del asistente'}
                            </p>
                        )}
                    </div>
                )}

                {/* Si hay productos o elementos para mostrar */}
                {messages.length > 0 &&
                    messages[messages.length - 1].content.includes('cart') && (
                        <div className="w-full mt-4 space-y-3">
                            {/* Item 1 */}
                            <div className="bg-white rounded-xl p-3 text-emerald-800 flex items-center">
                                <div className="bg-gray-200 h-14 w-14 rounded-md overflow-hidden flex-shrink-0">
                                    <div className="bg-slate-100 h-full w-full flex items-center justify-center">
                                        <ShoppingCart className="h-8 w-8 text-emerald-700" />
                                    </div>
                                </div>
                                <div className="ml-3 flex-grow">
                                    <p className="font-medium">
                                        Bloom Booster Potting Mix
                                    </p>
                                    <p className="text-emerald-700 font-semibold">
                                        $15.99
                                    </p>
                                </div>
                                <div>
                                    <ArrowUp className="h-5 w-5 text-emerald-700 transform rotate-45" />
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div className="bg-white rounded-xl p-3 text-emerald-800 flex items-center">
                                <div className="bg-gray-200 h-14 w-14 rounded-md overflow-hidden flex-shrink-0">
                                    <div className="bg-slate-100 h-full w-full flex items-center justify-center">
                                        <ShoppingCart className="h-8 w-8 text-emerald-700" />
                                    </div>
                                </div>
                                <div className="ml-3 flex-grow">
                                    <p className="font-medium">
                                        Flower Power Fertilizer
                                    </p>
                                    <p className="text-emerald-700 font-semibold">
                                        $22.98
                                    </p>
                                </div>
                                <div>
                                    <ArrowUp className="h-5 w-5 text-emerald-700 transform rotate-45" />
                                </div>
                            </div>
                        </div>
                    )}

                {/* En caso de mensaje de permiso de cámara */}
                {messages.length > 0 &&
                    messages[messages.length - 1].content.includes(
                        'camera',
                    ) && (
                        <div className="w-full mt-4 flex flex-col items-center">
                            <div className="h-16 w-16 bg-gray-800/30 rounded-full flex items-center justify-center mb-3">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-center text-lg mb-4">
                                Would like to access your camera for video call?
                            </p>
                        </div>
                    )}

                {/* Visualización de grabación */}
                {isRecording && (
                    <div className="w-full flex flex-col items-center">
                        <div className="h-24 w-24 rounded-full border-2 border-green-400 flex items-center justify-center mb-5 relative">
                            <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-75"></div>
                            <div className="flex space-x-1 items-center">
                                <div className="w-1 h-8 bg-slate-400 rounded-full animate-sound-wave-1"></div>
                                <div className="w-1 h-12 bg-slate-400 rounded-full animate-sound-wave-2"></div>
                                <div className="w-1 h-8 bg-slate-400 rounded-full animate-sound-wave-3"></div>
                                <div className="w-1 h-16 bg-slate-400 rounded-full animate-sound-wave-4"></div>
                                <div className="w-1 h-8 bg-slate-400 rounded-full animate-sound-wave-5"></div>
                            </div>
                        </div>
                        <p className="text-lg text-green-300 mb-2">
                            Escuchando...
                        </p>
                        <p className="text-sm text-gray-300">
                            {formatRecordingTime(recordingDuration)}
                        </p>
                    </div>
                )}

                {/* Reproducción de audio */}
                {isSpeaking && (
                    <div className="w-full flex flex-col items-center">
                        <div className="h-24 w-24 rounded-full border-2 border-green-300 flex items-center justify-center relative mb-5">
                            <div className="flex space-x-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 bg-slate-300 rounded-full animate-soundwave-${(i % 5) + 1}`}
                                        style={{
                                            height: `${16 + (i % 3) * 8}px`,
                                            animationDelay: `${i * 0.1}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-lg text-green-300">Hablando...</p>
                    </div>
                )}

                {/* Procesando audio */}
                {processingAudio && !isSpeaking && (
                    <div className="w-full flex flex-col items-center">
                        <div className="h-24 w-24 rounded-full border-2 border-blue-300 flex items-center justify-center mb-5">
                            <div className="animate-pulse flex space-x-1">
                                <div className="h-3 w-3 bg-blue-300 rounded-full"></div>
                                <div className="h-3 w-3 bg-blue-300 rounded-full"></div>
                                <div className="h-3 w-3 bg-blue-300 rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-lg text-blue-300">Procesando...</p>
                    </div>
                )}

                {/* Elemento para scroll automático */}
                <div ref={messagesEndRef} />
            </div>

            {/* Área de botones y entradas */}
            <div className="p-4">
                {/* Botones de acción - Sólo aparecen si es relevante para el último mensaje */}
                {messages.length > 0 &&
                    (messages[messages.length - 1].content.includes('?') ||
                        messages[messages.length - 1].content.includes(
                            'cart',
                        ) ||
                        messages[messages.length - 1].content.includes(
                            'camera',
                        )) && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button className="py-3 px-5 bg-transparent border border-white/30 rounded-full text-white font-medium">
                                No
                            </button>
                            <button className="py-3 px-5 bg-slate-400 rounded-full text-emerald-900 font-medium">
                                Yes
                            </button>
                        </div>
                    )}

                {/* Barra de herramientas inferior */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    {/* Botón de chat */}
                    <button className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>

                    {/* Indicador de status */}
                    <div className="flex items-center space-x-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-1 w-1 rounded-full bg-gray-400"
                            ></div>
                        ))}
                    </div>

                    {/* Botón de micrófono */}
                    <button
                        className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!micPermissionGranted || isSpeaking}
                    >
                        {isRecording ? (
                            <StopCircle size={20} />
                        ) : (
                            <Mic size={20} />
                        )}
                    </button>

                    {/* Botón de llamada */}
                    <button className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                        <Phone size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChatInterface
