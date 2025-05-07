/**
 * frontend/src/app/(protected-pages)/modules/chatbot/demo/page.tsx
 * Página de demostración para el Voice Bot con integración de configuración de colores
 * @version 2.0.0
 * @updated 2025-04-28 - Refactorizado en componentes modulares para mejor mantenimiento
 */

'use client'

import React, { useState, useCallback } from 'react'
import { useTranslation } from '@/utils/hooks/useTranslation'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import { Card } from '@/components/ui'
import VoiceChat from '@/components/view/ChatBox/components/VoiceChat'
import ClientOnly from '@/components/shared/ClientOnly'

// Importar componentes modulares
import VoiceBotConfig from './_components/VoiceBotConfig'
import VoiceBotInstructions from './_components/VoiceBotInstructions'
import VoiceBotHandler from './_components/VoiceBotHandler'

const DemoPage = () => {
    const t = useTranslation('nav')

    // --- State for Configuration UI (Visual Only) ---
    const [config, setConfig] = useState({
        botName: 'Customer Service Agent',
        welcomeMessage: 'Por favor, envía un mensaje de voz...', // Initial visual message
        primaryColor: '#262626',
        secondaryColor: '#F4F4F5',
        textColor: '#FFFFFF',
        buttonColor: '#22e40b',
        position: 'bottom-right',
        autoOpen: false,
    })

    // --- State for Functional VoiceChat ---
    const [isOpen, setIsOpen] = useState(true) // Keep widget open by default
    const [minimized, setMinimized] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [message, setMessage] = useState<string | object>(
        config.welcomeMessage,
    ) // Initialize functional message, allow object
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined)
    const [isRecording, setIsRecording] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null) // Estado para el flowId

    // --- Event Handlers for UI Interactions ---
    const handleClose = () => setIsOpen(false)
    const handleMinimize = () => setMinimized(!minimized)
    const handlePlayPause = () => setPlaying(!playing)
    
    const handleConfigChange = useCallback(
        (key: string, value: string | number | boolean) => {
            setConfig((prev) => ({
                ...prev,
                [key]: value,
            }))
        },
        [],
    )

    // Función para aplicar los cambios de la configuración
    const handleApplyChanges = useCallback(() => {
        // Si el mensaje actual es el de bienvenida por defecto,
        // actualizarlo con el nuevo mensaje de bienvenida
        if (message === 'Por favor, envía un mensaje de voz...' && 
            config.welcomeMessage !== message
        ) {
            setMessage(config.welcomeMessage)
        }
        // Aquí podríamos aplicar otros cambios de configuración si fuera necesario
    }, [config.welcomeMessage, message, setMessage])

    return (
        <div>
            <HeaderBreadcrumbs
                heading="Demo de VoiceBot"
                links={[
                    { name: t('dashboard.dashboard') as string, href: '/home' },
                    { name: t('conceptsMenu') as string },
                    {
                        name: t('conceptsChatbot') as string,
                        href: '/modules/chatbot',
                    },
                    { name: 'Demo de Voice Bot' },
                ]}
            />

            {/* Layout Structure */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                {/* Configuration Card */}
                <Card className="lg:col-span-2">
                    <VoiceBotConfig
                        config={config}
                        onConfigChange={handleConfigChange}
                        onApplyChanges={handleApplyChanges}
                        message={message}
                        setMessage={setMessage}
                        setSelectedFlowId={setSelectedFlowId}
                        setIsLoading={setIsLoading}
                    />
                </Card>

                {/* Instructions Card */}
                <Card>
                    <VoiceBotInstructions />
                </Card>
            </div>

            {/* Render the functional VoiceChat component with custom colors from config */}
            <ClientOnly>
                <VoiceBotHandler
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    message={message}
                    setMessage={setMessage}
                    audioUrl={audioUrl}
                    setAudioUrl={setAudioUrl}
                    playing={playing}
                    setPlaying={setPlaying}
                >
                    <VoiceChat
                        isOpen={isOpen}
                        onClose={handleClose}
                        onMinimize={handleMinimize}
                        title={config.botName}
                        agentIcon="/img/logo/icon-logo.svg" // Use a valid icon path
                        agentName="Agente IA"
                        minimized={minimized}
                        message={message} // Functional message state
                        audioUrl={audioUrl} // Functional audio URL state
                        playing={playing} // Functional playing state
                        onPlayPause={handlePlayPause} // Functional handler
                        visualizationType={'waveform'} // Example visualization
                        uiStyle={'modern_blue'} // Example style
                        // Colores personalizados
                        primaryColor={config.primaryColor}
                        secondaryColor={config.secondaryColor}
                        textColor={config.textColor}
                        buttonColor={config.buttonColor}
                        isRecording={isRecording} // Functional state
                        isLoading={isLoading} // Functional state
                        flowId={selectedFlowId} // Pass the selected flow ID
                        // onSendVoice y onSendMessage se añaden desde VoiceBotHandler
                    />
                </VoiceBotHandler>
            </ClientOnly>
        </div>
    )
}

export default DemoPage
