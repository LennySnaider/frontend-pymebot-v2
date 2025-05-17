'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/VoicePreview.tsx
 * Componente de previsualización para chatbots con capacidades de voz
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { 
    PiXBold, 
    PiArrowsOutSimpleBold, 
    PiArrowsInSimpleBold,
    PiDeviceTabletSpeakerBold,
    PiDeviceMobileSpeakerBold
} from 'react-icons/pi'
import VoiceChatUI from './VoiceChatUI'

interface VoicePreviewProps {
    config?: {
        botName?: string
        welcomeMessage?: string
        primaryColor?: string
        secondaryColor?: string
        textColor?: string
    }
    onClose?: () => void
}

const VoicePreview: React.FC<VoicePreviewProps> = ({
    config = {},
    onClose
}) => {
    // Estados
    const [viewMode, setViewMode] = useState<'mobile' | 'tablet'>('mobile')
    const [isFullscreen, setIsFullscreen] = useState(false)
    
    const {
        botName = 'Customer Service Agent',
        welcomeMessage = 'Por favor, envía un mensaje de voz...',
        primaryColor = '#1e6f50',
        secondaryColor = '#2a8868',
        textColor = '#ffffff'
    } = config
    
    // Efecto para manejar el modo de pantalla completa
    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false)
            }
        }
        
        window.addEventListener('keydown', handleEscKey)
        
        return () => {
            window.removeEventListener('keydown', handleEscKey)
        }
    }, [isFullscreen])
    
    // Contenedores con diferentes dimensiones según modo de visualización
    const getContainerDimensions = () => {
        if (isFullscreen) {
            return {
                width: '100%',
                height: '100%',
                maxWidth: '100vw',
                maxHeight: '100vh'
            }
        }
        
        switch (viewMode) {
            case 'mobile':
                return {
                    width: '350px',
                    height: '600px'
                }
            case 'tablet':
                return {
                    width: '500px',
                    height: '700px'
                }
        }
    }
    
    const containerDimensions = getContainerDimensions()
    
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                <Button
                    className="absolute top-4 right-4 z-10"
                    shape="circle"
                    variant="default"
                    color="gray"
                    size="sm"
                    icon={<PiXBold />}
                    onClick={() => setIsFullscreen(false)}
                />
                
                <VoiceChatUI
                    botName={botName}
                    initialMessage={welcomeMessage}
                    fullscreen={true}
                    theme={{
                        primaryColor,
                        secondaryColor,
                        textColor,
                        backgroundColor: primaryColor
                    }}
                    onClose={() => setIsFullscreen(false)}
                />
            </div>
        )
    }
    
    return (
        <Card className="relative p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Vista previa</h3>
                <div className="flex gap-2">
                    <Button
                        shape="circle"
                        variant="default"
                        color={viewMode === 'mobile' ? 'blue' : 'gray'}
                        size="sm"
                        icon={<PiDeviceMobileSpeakerBold />}
                        onClick={() => setViewMode('mobile')}
                    />
                    <Button
                        shape="circle"
                        variant="default"
                        color={viewMode === 'tablet' ? 'blue' : 'gray'}
                        size="sm"
                        icon={<PiDeviceTabletSpeakerBold />}
                        onClick={() => setViewMode('tablet')}
                    />
                    <Button
                        shape="circle"
                        variant="default"
                        color="gray"
                        size="sm"
                        icon={<PiArrowsOutSimpleBold />}
                        onClick={() => setIsFullscreen(true)}
                    />
                    {onClose && (
                        <Button
                            shape="circle"
                            variant="default"
                            color="gray"
                            size="sm"
                            icon={<PiXBold />}
                            onClick={onClose}
                        />
                    )}
                </div>
            </div>
            
            <div className="flex justify-center items-center">
                <div
                    className="rounded-lg overflow-hidden"
                    style={{
                        ...containerDimensions,
                        border: '12px solid #222',
                        borderRadius: '20px'
                    }}
                >
                    <VoiceChatUI
                        botName={botName}
                        initialMessage={welcomeMessage}
                        theme={{
                            primaryColor,
                            secondaryColor,
                            textColor,
                            backgroundColor: primaryColor
                        }}
                        containerClassName="h-full"
                    />
                </div>
            </div>
        </Card>
    )
}

export default VoicePreview