/**
 * frontend/src/components/view/ChatBox/components/VoiceChat.tsx
 * Componente para la interfaz de chat de voz con visualización de audio simplificada y robusta
 * @version 2.0.0
 * @updated 2025-04-28 - Refactorizado en componentes más pequeños y mejorado manejo de respuestas
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { IoClose, IoChevronDown } from 'react-icons/io5'
import { MdOutlineMic, MdOutlinePhone, MdOutlineChat } from 'react-icons/md'
import { BsCameraVideo } from 'react-icons/bs'
import classNames from '@/utils/classNames'

// Importar componentes modulares
import AudioVisualization from './VoiceChat/AudioVisualization'
import AnimationStyles from './VoiceChat/AnimationStyles'
import { useThemeManager } from './VoiceChat/ThemeManager'

// Tipos para el componente
export type VoiceChatProps = {
    isOpen?: boolean
    onClose?: () => void
    onMinimize?: () => void
    flowId?: string | null
    title?: string
    agentIcon?: string
    agentName?: string
    minimized?: boolean
    // Props para la UI de audio
    message?: string | { text: string } | any // Permitir string u objeto con propiedad text
    audioUrl?: string | undefined // Allow undefined
    playing?: boolean
    onPlayPause?: () => void
    // Props para la visualización
    visualizationType?: 'waveform' | 'equalizer' | 'circle_pulse' | 'none'
    uiStyle?: 'modern_green' | 'modern_blue' | 'classic' | 'minimal'
    // Props para customización de colores
    primaryColor?: string
    secondaryColor?: string
    textColor?: string
    buttonColor?: string
    // Props para interacción
    onSendVoice?: () => void
    onSendMessage?: (message: string) => void
    onVideoCall?: () => void
    isRecording?: boolean // Is the parent component recording?
    isLoading?: boolean // Is the parent component waiting for API?
    items?: Array<{
        id: string
        title: string
        subtitle?: string
        price?: string
        imageUrl?: string
        onClick?: () => void
    }>
    // Props para confirmar acciones
    confirmAction?: {
        message: string
        confirmText: string
        cancelText: string
        onConfirm: () => void
        onCancel: () => void
    }
    // Props para solicitar permisos
    permissionRequest?: {
        type: 'camera' | 'microphone'
        message: string
        onAllow: () => void
        onDeny: () => void
    }
    className?: string
}

const VoiceChat: React.FC<VoiceChatProps> = ({
    isOpen = true,
    onClose,
    onMinimize,
    title = 'Customer Service Agent',
    agentIcon = '/images/customer-service-avatar.svg',
    agentName = 'Agent',
    minimized = false,
    message,
    audioUrl,
    playing = false,
    onPlayPause,
    visualizationType = 'waveform',
    uiStyle = 'modern_green',
    // Colores personalizados
    primaryColor,
    secondaryColor,
    textColor,
    buttonColor,
    onSendVoice,
    onSendMessage,
    // onVideoCall,
    items,
    confirmAction,
    permissionRequest,
    className,
    // Destructure new props with defaults
    isRecording = false,
    isLoading = false,
}) => {
    const [inputText, setInputText] = useState('')
    const [showTextInput, setShowTextInput] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const [audioError, setAudioError] = useState<string | null>(null)

    // Obtener el tema con nuestro hook personalizado
    const theme = useThemeManager({
        primaryColor,
        secondaryColor,
        textColor,
        buttonColor,
        uiStyle
    })

    // Manejar reproducción de audio
    useEffect(() => {
        if (!audioRef.current || !audioUrl) return

        // Validar URL de audio con mejor manejo de errores
        let isValidUrl = false;
        try {
            // Verificamos si es una URL válida
            if (audioUrl.startsWith('blob:') || audioUrl.startsWith('http')) {
                new URL(audioUrl);
                isValidUrl = true;
            } else {
                console.error('URL de audio con formato inválido:', audioUrl);
                setAudioError('URL de audio con formato inválido');
            }
        } catch (error) {
            console.error('Error al validar URL de audio:', audioUrl, error);
            setAudioError('URL de audio inválida');
            return;
        }

        if (!isValidUrl) return;

        if (playing) {
            // Resetear cualquier error previo
            setAudioError(null);
            
            // Log para depuración
            console.log('Intentando reproducir audio desde URL:', audioUrl);
            
            // Asignar la URL y cargar
            audioRef.current.src = audioUrl;
            
            // Establecer tipos MIME para asegurar compatibilidad
            if (audioUrl.endsWith('.mp3') || audioUrl.includes('audio/mpeg')) {
                audioRef.current.type = 'audio/mpeg';
            } else if (audioUrl.endsWith('.wav') || audioUrl.includes('audio/wav')) {
                audioRef.current.type = 'audio/wav';
            } else if (audioUrl.endsWith('.ogg') || audioUrl.includes('audio/ogg')) {
                audioRef.current.type = 'audio/ogg';
            }
            
            // Cargar el audio
            audioRef.current.load();
            
            // Evento canplay para asegurar que el audio está listo
            const canPlayHandler = () => {
                console.log('Audio listo para reproducir');
                const playPromise = audioRef.current?.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch((error) => {
                        console.error('Error al reproducir audio:', error);
                        setAudioError(`No se pudo reproducir el audio: ${error.message}`);
                        
                        // Intentar de nuevo después de un breve retraso
                        setTimeout(() => {
                            if (audioRef.current) {
                                audioRef.current.play().catch((err) => {
                                    console.error('Error en segundo intento de reproducción:', err);
                                    setAudioError(`Error persistente al reproducir: ${err.message}`);
                                })
                            }
                        }, 300);
                    });
                }
            };
            
            // Evento para manejar errores
            const errorHandler = (e: Event) => {
                const errorMsg = (e.target as HTMLAudioElement).error?.message || 'Error desconocido';
                const errorCode = (e.target as HTMLAudioElement).error?.code;
                console.error(`Error en elemento de audio (código ${errorCode}):`, 
                             (e.target as HTMLAudioElement).error, 
                             'URL:', audioUrl);
                             
                // Error específico para fuente no soportada
                if (errorCode === 4) {
                    setAudioError('Formato de audio no soportado por el navegador');
                } else {
                    setAudioError(`Error en la reproducción: ${errorMsg}`);
                }
            };
            
            // Registrar eventos
            audioRef.current.addEventListener('canplay', canPlayHandler);
            audioRef.current.addEventListener('error', errorHandler);
            
            // Limpieza de eventos
            return () => {
                if (audioRef.current) {
                    audioRef.current.removeEventListener('canplay', canPlayHandler);
                    audioRef.current.removeEventListener('error', errorHandler);
                }
            };
        } else {
            // Pausar reproducción si está activa
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        }
    }, [playing, audioUrl])

    // Si está minimizado, mostrar solo el icono
    if (minimized) {
        return (
            <div
                className={classNames(
                    'fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg cursor-pointer z-50 flex items-center justify-center',
                    theme.bg,
                    className,
                )}
                style={
                    theme.customColors
                        ? { backgroundColor: theme.customColors.primary }
                        : {}
                }
                onClick={onMinimize}
            >
                <img
                    src={agentIcon}
                    alt={agentName}
                    className="w-8 h-8 rounded-full"
                />
            </div>
        )
    }

    // Si no está abierto, no mostrar nada
    if (!isOpen) return null

    // Manejador para alternar la entrada de texto
    const handleToggleTextInput = () => {
        setShowTextInput(!showTextInput)
        // Solo limpiamos el texto cuando ocultamos el input
        if (showTextInput) {
            setInputText('')
        }
    }

    // Manejador para enviar texto desde el campo de entrada
    const handleSubmitText = () => {
        if (onSendMessage && inputText.trim()) {
            onSendMessage(inputText.trim())
            setInputText('')
            setShowTextInput(false)
        }
    }

    return (
        <>
            <div
                className={classNames(
                    'fixed bottom-4 right-4 w-80 rounded-xl shadow-lg overflow-hidden flex flex-col z-50',
                    theme.bg,
                    className,
                )}
                style={
                    theme.customColors
                        ? { backgroundColor: theme.customColors.primary }
                        : {}
                }
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-3 border-b border-opacity-20"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                    <div className="flex items-center space-x-2">
                        <img
                            src={agentIcon}
                            alt={agentName}
                            className="w-8 h-8 rounded-full"
                        />
                        <span
                            className={classNames(
                                'font-medium',
                                theme.text,
                            )}
                            style={
                                theme.customColors
                                    ? { color: theme.customColors.text }
                                    : {}
                            }
                        >
                            {title}
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={onMinimize}
                            className="text-white p-1 rounded-full hover:bg-white/10"
                        >
                            <IoChevronDown size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white p-1 rounded-full hover:bg-white/10"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 flex flex-col items-center">
                    {/* Mostrar mensaje */}
                    {message && (
                        <div
                            className={classNames(
                                'text-center mb-4 w-full',
                                theme.text,
                            )}
                            style={
                                theme.customColors
                                    ? { color: theme.customColors.text }
                                    : {}
                            }
                        >
                            {/* Renderizar message.text si message es un objeto, o message si es string */}
                            <p>
                                {typeof message === 'object' &&
                                message !== null &&
                                message.text
                                    ? message.text
                                    : message}
                            </p>
                        </div>
                    )}

                    {/* Audio visualization */}
                    <div
                        className={classNames(
                            'w-full flex items-center justify-center py-2 px-4 rounded-full mb-4 border border-opacity-20',
                            theme.border,
                        )}
                        style={
                            theme.customColors
                                ? {
                                      borderColor: `${theme.customColors.secondary}40`,
                                  }
                                : {}
                        }
                    >
                        <AudioVisualization 
                            type={visualizationType}
                            isRecording={isRecording}
                            isPlaying={playing}
                            theme={theme}
                        />

                        {/* Audio element (hidden) */}
                        {audioUrl && (
                            <audio
                                ref={audioRef}
                                className="hidden"
                                preload="auto"
                                controls={false}
                                onEnded={() => onPlayPause && onPlayPause()}
                                onError={(e) => {
                                    console.error('Error en elemento de audio:', e.currentTarget.error)
                                    const errorCode = e.currentTarget.error?.code
                                    const errorType = [
                                        'MEDIA_ERR_ABORTED',
                                        'MEDIA_ERR_NETWORK',
                                        'MEDIA_ERR_DECODE',
                                        'MEDIA_ERR_SRC_NOT_SUPPORTED'
                                    ][errorCode || 0]
                                    
                                    setAudioError(
                                        `Error en la reproducción de audio: ${errorType || 'Desconocido'}`,
                                    )
                                }}
                            >
                                {/* Usar source element en lugar de atributo src */}
                                <source src={audioUrl} type="audio/mpeg" />
                                <source src={audioUrl} type="audio/ogg" />
                                <source src={audioUrl} type="audio/wav" />
                                Tu navegador no soporta el elemento de audio.
                            </audio>
                        )}
                    </div>

                    {/* Mensaje de error de audio */}
                    {audioError && (
                        <div className="text-center text-red-300 text-sm mb-4 w-full">
                            <p>{audioError}</p>
                        </div>
                    )}

                    {/* Lista de ítems (como productos) */}
                    {items && items.length > 0 && (
                        <div className="w-full space-y-2 mb-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={classNames(
                                        'flex items-center p-2 rounded-lg w-full hover:bg-white/10 cursor-pointer',
                                        'border border-opacity-15',
                                        theme.border,
                                    )}
                                    onClick={item.onClick}
                                >
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-12 h-12 rounded-md object-cover mr-3"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium text-sm">
                                            {item.title}
                                        </h4>
                                        {item.subtitle && (
                                            <p className="text-white/70 text-xs">
                                                {item.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    {item.price && (
                                        <div className="text-white font-medium">
                                            ${item.price}
                                        </div>
                                    )}
                                    <div className="text-white/70 ml-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M5 12h14"></path>
                                            <path d="m12 5 7 7-7 7"></path>
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Confirmación de acción */}
                    {confirmAction && (
                        <div className="w-full flex flex-col items-center mb-4">
                            <p className="text-white text-center mb-4">
                                {confirmAction.message}
                            </p>
                            <div className="flex space-x-4">
                                <button
                                    className={classNames(
                                        'px-6 py-2.5 rounded-full font-medium',
                                        theme.button.secondary,
                                        'text-white',
                                    )}
                                    onClick={confirmAction.onCancel}
                                >
                                    {confirmAction.cancelText}
                                </button>
                                <button
                                    className={classNames(
                                        'px-6 py-2.5 rounded-full font-medium',
                                        theme.button.primary,
                                        'text-white',
                                    )}
                                    onClick={confirmAction.onConfirm}
                                >
                                    {confirmAction.confirmText}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Solicitud de permisos */}
                    {permissionRequest && (
                        <div className="w-full flex flex-col items-center mb-4">
                            <div className="mb-4 p-4 rounded-full bg-gray-700/50 text-white">
                                {permissionRequest.type === 'camera' ? (
                                    <BsCameraVideo size={24} />
                                ) : (
                                    <MdOutlineMic size={24} />
                                )}
                            </div>
                            <p className="text-white text-center mb-4">
                                {permissionRequest.message}
                            </p>
                            <div className="flex space-x-4">
                                <button
                                    className={classNames(
                                        'px-6 py-2.5 rounded-full font-medium',
                                        theme.button.secondary,
                                        'text-white',
                                    )}
                                    onClick={permissionRequest.onDeny}
                                >
                                    No
                                </button>
                                <button
                                    className={classNames(
                                        'px-6 py-2.5 rounded-full font-medium',
                                        theme.button.primary,
                                        'text-white',
                                    )}
                                    onClick={permissionRequest.onAllow}
                                >
                                    Permitir
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Action Bar */}
                <div className="px-4 py-2 flex items-center justify-between">
                    <button
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600"
                        onClick={handleToggleTextInput}
                    >
                        <MdOutlineChat size={20} />
                    </button>

                    <div className="flex-grow mx-2">
                        {showTextInput ? (
                            <div className="border border-gray-500 rounded-full px-2 py-1">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSubmitText()
                                        }
                                    }}
                                    placeholder="Escribe un mensaje..."
                                    className="bg-transparent w-full text-white focus:outline-none"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                {/* Indicadores de estado visual */}
                                {isLoading ? (
                                    // Indicador de carga
                                    <div className="flex items-center">
                                        <div className="loader-dot bg-white/70 w-2 h-2 mx-1 rounded-full"></div>
                                        <div className="loader-dot bg-white/70 w-2 h-2 mx-1 rounded-full"></div>
                                        <div className="loader-dot bg-white/70 w-2 h-2 mx-1 rounded-full"></div>
                                    </div>
                                ) : (
                                    // Puntos de estado normal o reproducción
                                    <>
                                        <div
                                            className={classNames(
                                                'w-2 h-2 mx-1 rounded-full bg-white/70',
                                                playing ? 'dot-pulse' : '',
                                            )}
                                        ></div>
                                        <div
                                            className={classNames(
                                                'w-2 h-2 mx-1 rounded-full bg-white/70',
                                                playing
                                                    ? 'dot-pulse dot-delay-1'
                                                    : '',
                                            )}
                                        ></div>
                                        <div
                                            className={classNames(
                                                'w-2 h-2 mx-1 rounded-full bg-white/70',
                                                playing
                                                    ? 'dot-pulse dot-delay-2'
                                                    : '',
                                            )}
                                        ></div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        className={classNames(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            theme.customColors
                                ? ''
                                : isRecording
                                  ? 'bg-red-500 animate-pulse'
                                  : 'bg-red-600 hover:bg-red-500',
                            isLoading
                                ? 'opacity-50 cursor-not-allowed'
                                : 'opacity-100',
                        )}
                        style={
                            theme.customColors
                                ? {
                                      backgroundColor: isRecording
                                          ? '#f87171'
                                          : '#dc2626', // Colores equivalentes a red-500 y red-600
                                      ...(isRecording
                                          ? { animation: 'pulse 2s infinite' }
                                          : {}),
                                  }
                                : {}
                        }
                        onClick={onSendVoice}
                        disabled={isLoading}
                    >
                        {isRecording ? (
                            <MdOutlineMic size={20} className="text-white" />
                        ) : (
                            <MdOutlinePhone size={20} className="text-white" />
                        )}
                    </button>
                </div>

                {/* Estilos globales para las animaciones */}
                <AnimationStyles />
            </div>
        </>
    )
}

export default VoiceChat
