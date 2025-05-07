/**
 * frontend/src/app/(protected-pages)/modules/chatbot/page.tsx
 * Página principal para la gestión de chatbots por parte del tenant
 * Incluye control de acceso basado en el plan de suscripción
 * @version 2.0.0
 * @updated 2025-06-05
 */

'use client'

import React, { useState, useEffect } from 'react'
import useTranslation from '@/utils/hooks/useTranslation'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import { Card, Tabs, Button, toast, Notification } from '@/components/ui'
import ChatbotDashboard from '@/components/view/ChatbotBuilder/ChatbotDashboard'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import { LimitChecker, ResourceLimit, FeatureLimit } from '@/components/core/permissions'
import {
    PiRobotDuotone,
    PiSpeakerHighDuotone,
    PiChatDuotone,
    PiInfoBold,
    PiCrownSimple,
} from 'react-icons/pi'

const ChatbotPage = () => {
    const t = useTranslation('nav')
    const { session } = useCurrentSession()
    const [activeTab, setActiveTab] = useState('management') // 'management' por defecto

    // El ID del tenant debe venir del contexto de autenticación
    const tenantId = session?.user?.tenant_id || 'current-tenant'

    // Mostrar información de desarrollo si estamos usando current-tenant
    useEffect(() => {
        if (tenantId === 'current-tenant') {
            try {
                toast.push(
                    <Notification type="info" title="Modo desarrollo" closable>
                        Estás utilizando un tenant temporal para desarrollo.
                        Algunas funcionalidades pueden estar limitadas.
                    </Notification>,
                )
            } catch (error) {
                console.warn(
                    'Error al mostrar notificación de desarrollo:',
                    error,
                )
            }
        }
    }, [tenantId])

    // Manejo de cambio de pestaña con verificación de límites
    const handleTabChange = (val: string) => {
        setActiveTab(val as string)
    }

    return (
        <div>
            <HeaderBreadcrumbs
                heading={t('conceptsMarketing.chatbot')}
                links={[
                    { name: t('dashboard.dashboard'), href: '/home' },
                    { name: t('conceptsMenu') },
                    { name: t('conceptsMarketing.marketing') },
                    { name: t('conceptsMarketing.chatbot') },
                ]}
            />

            {tenantId === 'current-tenant' && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <PiInfoBold className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Información para desarrolladores
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>
                                    Estás utilizando un ID de tenant temporal
                                    ("current-tenant") que es redirigido
                                    internamente a un tenant de prueba.
                                    Asegúrate de crear previamente un tenant con
                                    el UUID:
                                    11111111-1111-1111-1111-111111111111 en la
                                    base de datos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mostrar uso de chatbots */}
            <div className="mb-4">
                <ResourceLimit 
                    verticalCode="marketing"
                    moduleCode="chat"
                    resourceType="templates"
                    labels={{
                        title: "Chatbots activos",
                        description: "Número de chatbots que puedes crear según tu plan"
                    }}
                />
            </div>

            <Card className="mb-8">
                <div className="p-6">
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                    >
                        <div className="flex border-b border-gray-200 mb-6">
                            <Tabs.TabNav
                                value="chat"
                                className="flex-1 text-center"
                            >
                                <div className="flex items-center justify-center">
                                    <PiChatDuotone className="mr-2" />
                                    <span>Chat de Atención</span>
                                </div>
                            </Tabs.TabNav>
                            <Tabs.TabNav
                                value="management"
                                className="flex-1 text-center"
                            >
                                <div className="flex items-center justify-center">
                                    <PiRobotDuotone className="mr-2" />
                                    <span>Gestión de Chatbots</span>
                                </div>
                            </Tabs.TabNav>
                            
                            {/* Tab de Voice con verificación de características premium */}
                            <FeatureLimit
                                verticalCode="marketing"
                                moduleCode="chat"
                                featureName="voice_bot"
                                showDisabled={true}
                            >
                                <Tabs.TabNav
                                    value="voice"
                                    className="flex-1 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <PiSpeakerHighDuotone className="mr-2" />
                                        <span>Configuración Voice Bot</span>
                                        <div className="ml-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <PiCrownSimple className="mr-1" />
                                                Premium
                                            </span>
                                        </div>
                                    </div>
                                </Tabs.TabNav>
                            </FeatureLimit>
                        </div>

                        <Tabs.TabContent value="chat">
                            <div className="p-4 border border-gray-200 rounded">
                                <p className="text-gray-600">El módulo de Chat está en desarrollo.</p>
                            </div>
                        </Tabs.TabContent>

                        <Tabs.TabContent value="management">
                            <ChatbotDashboard tenantId={tenantId} />
                        </Tabs.TabContent>

                        <Tabs.TabContent value="voice">
                            <FeatureLimit
                                verticalCode="marketing"
                                moduleCode="chat"
                                featureName="voice_bot"
                                indicatorStyle="overlay"
                                lockedMessage="La funcionalidad de Voice Bot está disponible en planes Premium y superiores."
                            >
                                <div className="p-4 border border-gray-200 rounded">
                                    <p className="text-gray-600">Configuración de Voice Bot disponible en este plan.</p>
                                </div>
                            </FeatureLimit>
                        </Tabs.TabContent>
                    </Tabs>
                </div>
            </Card>
        </div>
    )
}

export default ChatbotPage
