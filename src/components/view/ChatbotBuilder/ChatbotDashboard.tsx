/**
 * frontend/src/components/view/ChatbotBuilder/ChatbotDashboard.tsx
 * Componente principal para la gestión de chatbots por parte del tenant
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect } from 'react'
import { Tabs, Card, Button } from '@/components/ui'
import { PiPlusBold, PiRobotDuotone, PiChartLineDuotone, PiChatDuotone } from 'react-icons/pi'
import ChatbotActivationsList from './ChatbotActivationsList'
import ChatbotActivationWizard from './ChatbotActivationWizard'
import SimplifiedChatbotConfig from './SimplifiedChatbotConfig'
import ChatbotChannelManager from './ChatbotChannelManager'
import ChatbotMonitoring from './ChatbotMonitoring'

interface ChatbotDashboardProps {
    tenantId: string
}

const ChatbotDashboard: React.FC<ChatbotDashboardProps> = ({ tenantId }) => {
    // Estados
    const [activeTab, setActiveTab] = useState('activations')
    const [showActivationWizard, setShowActivationWizard] = useState(false)
    const [showConfigPanel, setShowConfigPanel] = useState(false)
    const [selectedActivationId, setSelectedActivationId] = useState<string | undefined>(undefined)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    
    // Manejar la activación de una nueva plantilla
    const handleActivateNew = () => {
        setShowActivationWizard(true)
    }
    
    // Manejar la finalización del asistente de activación
    const handleActivationFinish = (activationId?: string) => {
        setShowActivationWizard(false)
        setRefreshTrigger(prev => prev + 1)
        
        // Si se proporciona un ID de activación, abrir el panel de configuración
        if (activationId) {
            setSelectedActivationId(activationId)
            setShowConfigPanel(true)
        }
    }
    
    // Manejar la configuración de una activación
    const handleConfigureActivation = (activationId: string) => {
        setSelectedActivationId(activationId)
        setShowConfigPanel(true)
    }
    
    // Manejar el guardado de la configuración
    const handleConfigSave = () => {
        setShowConfigPanel(false)
        setRefreshTrigger(prev => prev + 1)
    }
    
    // Renderizar el contenido principal según el estado
    const renderMainContent = () => {
        if (showActivationWizard) {
            return (
                <ChatbotActivationWizard
                    tenantId={tenantId}
                    onFinish={handleActivationFinish}
                    onCancel={() => setShowActivationWizard(false)}
                />
            )
        }
        
        if (showConfigPanel && selectedActivationId) {
            return (
                <SimplifiedChatbotConfig
                    activationId={selectedActivationId}
                    onSave={handleConfigSave}
                    onCancel={() => setShowConfigPanel(false)}
                />
            )
        }
        
        return (
            <Tabs value={activeTab} onChange={(val) => setActiveTab(val as string)}>
                <div className="flex border-b border-gray-200">
                    <Tabs.TabNav value="activations" className="flex-1 text-center">
                        <div className="flex items-center justify-center">
                            <PiRobotDuotone className="mr-2" />
                            <span>Mis Chatbots</span>
                        </div>
                    </Tabs.TabNav>
                    <Tabs.TabNav value="channels" className="flex-1 text-center">
                        <div className="flex items-center justify-center">
                            <PiChatDuotone className="mr-2" />
                            <span>Canales</span>
                        </div>
                    </Tabs.TabNav>
                    <Tabs.TabNav value="monitoring" className="flex-1 text-center">
                        <div className="flex items-center justify-center">
                            <PiChartLineDuotone className="mr-2" />
                            <span>Monitoreo</span>
                        </div>
                    </Tabs.TabNav>
                </div>
                
                <div className="p-4">
                    <Tabs.TabContent value="activations">
                        <div className="mb-4">
                            <ChatbotActivationsList
                                tenantId={tenantId}
                                onActivate={handleActivateNew}
                                onConfigure={handleConfigureActivation}
                                key={`activation-list-${refreshTrigger}`}
                            />
                        </div>
                    </Tabs.TabContent>
                    
                    <Tabs.TabContent value="channels">
                        <div className="mb-4">
                            <ChatbotChannelManager
                                tenantId={tenantId}
                                key={`channel-manager-${refreshTrigger}`}
                            />
                        </div>
                    </Tabs.TabContent>
                    
                    <Tabs.TabContent value="monitoring">
                        <div className="mb-4">
                            <ChatbotMonitoring
                                tenantId={tenantId}
                                key={`monitoring-${refreshTrigger}`}
                            />
                        </div>
                    </Tabs.TabContent>
                </div>
            </Tabs>
        )
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Chatbots</h1>
                    <p className="text-gray-500 mt-1">
                        Administra tus asistentes virtuales y canales de comunicación
                    </p>
                </div>
                
                {!showActivationWizard && !showConfigPanel && (
                    <Button
                        variant="solid"
                        color="primary"
                        icon={<PiPlusBold />}
                        onClick={handleActivateNew}
                    >
                        Activar nueva plantilla
                    </Button>
                )}
            </div>
            
            {renderMainContent()}
        </div>
    )
}

export default ChatbotDashboard