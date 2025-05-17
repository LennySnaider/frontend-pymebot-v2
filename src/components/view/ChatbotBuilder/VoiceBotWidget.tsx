'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/VoiceBotWidget.tsx
 * Widget independiente para implementar Voice Bot en cualquier página
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect, useRef } from 'react'
import { PiRobotDuotone, PiXBold } from 'react-icons/pi'
import VoiceChatUI from './VoiceChatUI'

interface VoiceBotWidgetProps {
    config?: {
        botName?: string
        welcomeMessage?: string
        primaryColor?: string
        secondaryColor?: string
        textColor?: string
        backgroundColor?: string
        buttonColor?: string
        buttonTextColor?: string
        position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
        autoOpen?: boolean
        delay?: number
    }
    tenantId?: string
    activationId?: string
}

const VoiceBotWidget: React.FC<VoiceBotWidgetProps> = ({
    config = {},
    tenantId,
    activationId,
}) => {
    // Configuración con valores por defecto
    const {
        botName = 'Customer Service Agent',
        welcomeMessage = 'Por favor, envía un mensaje de voz...',
        primaryColor = '#1e6f50',
        secondaryColor = '#F4F4F5',
        textColor = '#000000',
        backgroundColor = '#ece5dd',
        buttonColor = '#FA2B36',
        buttonTextColor = '#ffffff',
        position = 'bottom-right',
        autoOpen = false,
        delay = 3000,
    } = config

    // Estados
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // Referencia para el temporizador de auto-apertura
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Efecto para auto-apertura con retardo
    useEffect(() => {
        if (autoOpen && !isInitialized) {
            timerRef.current = setTimeout(() => {
                setIsOpen(true)
                setIsInitialized(true)
            }, delay)
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [autoOpen, delay, isInitialized])

    // Obtener la posición CSS basada en la configuración
    const getPositionStyle = () => {
        switch (position) {
            case 'bottom-left':
                return { bottom: '20px', left: '20px' }
            case 'top-right':
                return { top: '20px', right: '20px' }
            case 'top-left':
                return { top: '20px', left: '20px' }
            default: // bottom-right
                return { bottom: '20px', right: '20px' }
        }
    }

    // Manejar apertura/cierre del widget
    const toggleWidget = () => {
        if (isMinimized) {
            setIsMinimized(false)
        } else {
            setIsOpen(!isOpen)
            setIsInitialized(true)
        }
    }

    // Minimizar el widget
    const minimizeWidget = () => {
        setIsMinimized(true)
    }

    // Cerrar el widget
    const closeWidget = () => {
        setIsOpen(false)
    }

    return (
        <div
            className="fixed z-50 mb-6 flex flex-col-reverse items-end"
            style={{
                ...getPositionStyle(),
            }}
        >
            {/* Botón flotante */}
            {(!isOpen || isMinimized) && (
                <button
                    className="flex items-center justify-center rounded-full shadow-lg transition-all hover:shadow-xl"
                    style={{
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                        width: '60px',
                        height: '60px',
                    }}
                    onClick={toggleWidget}
                    aria-label="Abrir chat"
                >
                    <PiRobotDuotone className="text-2xl" />
                </button>
            )}

            {/* Mensaje flotante encima del botón (opcional) */}
            {!isOpen && !isInitialized && (
                <div
                    className="mb-2 p-3 rounded-lg shadow-md text-sm max-w-xs animate-bounce"
                    style={{
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                    }}
                >
                    ¿Necesitas ayuda? ¡Habla conmigo!
                    <div
                        className="absolute w-3 h-3 transform rotate-45"
                        style={{
                            backgroundColor: buttonColor,
                            bottom: '-6px',
                            right: position.includes('left') ? 'auto' : '28px',
                            left: position.includes('left') ? '28px' : 'auto',
                        }}
                    ></div>
                </div>
            )}

            {/* Ventana de chat */}
            {isOpen && !isMinimized && (
                <div
                    className="rounded-lg overflow-hidden shadow-xl transition-all mb-2"
                    style={{
                        width: '350px',
                        height: '600px',
                        maxHeight: '80vh',
                    }}
                >
                    <VoiceChatUI
                        botName={botName}
                        initialMessage={welcomeMessage}
                        theme={{
                            primaryColor,
                            secondaryColor,
                            textColor,
                            backgroundColor,
                        }}
                        onClose={closeWidget}
                        containerClassName="h-full"
                    />
                </div>
            )}
        </div>
    )
}

export default VoiceBotWidget
