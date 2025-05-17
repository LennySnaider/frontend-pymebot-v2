'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/ChatbotActivationWizard.tsx
 * Componente de asistente para activar nuevas plantillas de chatbot
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect } from 'react'
import { toast, Card, Button, Notification, Steps } from '@/components/ui'
import type { Toast } from '@/components/ui/toast/toast'
import {
    PiArrowRightBold,
    PiArrowLeftBold,
    PiCheckBold,
    PiXBold,
} from 'react-icons/pi'
import chatbotTemplateService, {
    ChatbotTemplate,
} from '@/services/chatbot/chatbotTemplateService'
import { PiMagnifyingGlassBold, PiRobotBold, PiCalendarBold, PiInfoBold, PiCheckCircleBold } from 'react-icons/pi'
import { supabase } from '@/services/supabase/SupabaseClient'

interface ChatbotActivationWizardProps {
    tenantId: string
    onFinish: (activationId?: string) => void
    onCancel: () => void
}

const ChatbotActivationWizard: React.FC<ChatbotActivationWizardProps> = ({
    tenantId,
    onFinish,
    onCancel,
}) => {
    // Estados
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [templates, setTemplates] = useState<ChatbotTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] =
        useState<ChatbotTemplate | null>(null)
    const [activating, setActivating] = useState(false)
    const [filter, setFilter] = useState('')
    const [success, setSuccess] = useState(false)
    const [activationId, setActivationId] = useState<string | undefined>(
        undefined,
    )

    // Cargar plantillas disponibles
    useEffect(() => {
        loadTemplates()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
    
    // Función helper para mostrar notificaciones
    const showNotification = (message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info', title?: string) => {
        try {
            // Verificar que toast.push existe y es una función
            if (typeof toast?.push === 'function') {
                toast.push(
                    <Notification title={title || (type === 'danger' ? 'Error' : type === 'success' ? 'Éxito' : 'Información')} type={type}>
                        {message}
                    </Notification>
                )
            } else {
                // Fallback si toast.push no está disponible
                console.error('Error en toast:', message)
            }
        } catch (err) {
            console.error('Error al mostrar notificación:', err)
        }
    }

    const loadTemplates = async () => {
        try {
            setLoading(true)
            console.log('Iniciando carga de plantillas para tenant:', tenantId)
            
            // Verificar la validez del ID de tenant
            if (!tenantId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
                console.error('ID de tenant inválido:', tenantId)
                showNotification('ID de tenant inválido. Por favor, verifique sus credenciales.', 'danger')
                setLoading(false)
                return
            }
            
            // Enfoque alternativo: consultar directamente Supabase
            try {
                console.log('Consultando templates directamente...')
                const { data: directData, error } = await supabase
                    .from('chatbot_templates')
                    .select('*')
                    .eq('status', 'published')
                    .eq('is_deleted', false)
                
                if (error) {
                    console.error('Error directo de Supabase:', error)
                    throw error
                }
                
                console.log('Datos recibidos directamente:', directData?.length || 0, 'plantillas')
                
                if (Array.isArray(directData) && directData.length > 0) {
                    setTemplates(directData)
                    return
                }
            } catch (directError) {
                console.warn('Error al consultar directamente, intentando con el servicio:', directError)
            }
            
            // Usar el servicio como fallback
            const data = await chatbotTemplateService.getPublishedTemplates()
            console.log('Datos recibidos del servicio:', data?.length || 0, 'plantillas')
            
            if (Array.isArray(data) && data.length > 0) {
                console.log(`Se encontraron ${data.length} plantillas publicadas`)
                setTemplates(data)
            } else {
                console.warn('No se encontraron plantillas publicadas')
                setTemplates([])
                // Mostrar notificación informativa en vez de error
                showNotification('No hay plantillas publicadas disponibles en este momento. Por favor, publique algunas plantillas desde el editor de plantillas.', 'warning', 'Información')
            }
        } catch (error) {
            console.error('Error al cargar plantillas:', error)
            showNotification('Error al cargar las plantillas disponibles. Por favor, intente nuevamente.', 'danger')
            setTemplates([]) // Asegurar que templates no sea undefined/null
        } finally {
            setLoading(false)
        }
    }

    // Filtrar plantillas según búsqueda
    const filteredTemplates = templates.filter(
        (template) =>
            template.name.toLowerCase().includes(filter.toLowerCase()) ||
            template.description.toLowerCase().includes(filter.toLowerCase()),
    )

    // Activar la plantilla seleccionada
    const activateTemplate = async () => {
        if (!selectedTemplate) {
            showNotification('Selecciona una plantilla primero', 'danger')
            return
        }

        try {
            setActivating(true)

            const result = await chatbotTemplateService.activateTemplate(
                tenantId,
                selectedTemplate.id,
            )

            if (result.success) {
                setSuccess(true)
                setActivationId(result.activationId)
                // Avanzar al siguiente paso (éxito)
                setCurrentStep(2)
            } else {
                showNotification('Error al activar la plantilla', 'danger')
            }
        } catch (error) {
            console.error('Error al activar plantilla:', error)
            showNotification('Error al activar la plantilla', 'danger')
        } finally {
            setActivating(false)
        }
    }

    // Renderizado condicional según el paso actual
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Selección de plantilla
                return (
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-4">
                            Selecciona una plantilla
                        </h2>
                        <p className="text-gray-500 mb-4">
                            Escoge una de las plantillas disponibles para
                            activar en tu cuenta. Podrás personalizarla
                            posteriormente.
                        </p>

                        <div className="mb-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <PiMagnifyingGlassBold className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Buscar plantillas..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-10 px-4 text-center">
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 w-64 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <PiRobotBold className="h-12 w-12 text-gray-400 mx-auto" />
                                <p className="mt-3 text-sm text-gray-500">
                                    No se encontraron plantillas
                                </p>
                                {filter && (
                                    <Button
                                        className="mt-4"
                                        variant="default"
                                        size="sm"
                                        onClick={() => setFilter('')}
                                    >
                                        Limpiar filtro
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredTemplates.map((template) => (
                                    <Card
                                        key={template.id}
                                        className={`cursor-pointer transition-all ${
                                            selectedTemplate?.id === template.id
                                                ? 'ring-2 ring-primary'
                                                : 'hover:shadow-md'
                                        }`}
                                        onClick={() =>
                                            setSelectedTemplate(template)
                                        }
                                    >
                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {template.name}
                                                </h3>
                                                {selectedTemplate?.id ===
                                                    template.id && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Seleccionada
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500">
                                                {template.description}
                                            </p>

                                            <div className="mt-4 flex items-center space-x-2">
                                                <PiCalendarBold className="text-gray-400" />
                                                <span className="text-xs text-gray-500">
                                                    Actualizada:{' '}
                                                    {new Date(
                                                        template.updated_at ||
                                                            '',
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )

            case 1: // Confirmación
                return (
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-4">
                            Confirmar selección
                        </h2>

                        {selectedTemplate ? (
                            <div className="mb-6">
                                <Card className="mb-4">
                                    <div className="p-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {selectedTemplate.name}
                                        </h3>
                                        <p className="mt-2 text-sm text-gray-500">
                                            {selectedTemplate.description}
                                        </p>
                                    </div>
                                </Card>

                                <p className="text-gray-500 mb-4">
                                    Estás a punto de activar esta plantilla para
                                    tu cuenta. Una vez activada, podrás
                                    configurarla y asignarla a los canales de
                                    comunicación.
                                </p>

                                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <PiInfoBold className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">
                                                Información
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p>
                                                    La activación es inmediata y
                                                    no consume créditos
                                                    adicionales. Puedes tener
                                                    múltiples plantillas activas
                                                    simultáneamente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 px-4 text-center">
                                <PiRobotBold className="h-12 w-12 text-gray-400 mx-auto" />
                                <p className="mt-3 text-sm text-gray-500">
                                    No has seleccionado ninguna plantilla
                                </p>
                                <Button
                                    className="mt-4"
                                    variant="default"
                                    size="sm"
                                    onClick={() => setCurrentStep(0)}
                                >
                                    Volver a selección
                                </Button>
                            </div>
                        )}
                    </div>
                )

            case 2: // Éxito
                return (
                    <div className="p-4 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PiCheckCircleBold className="h-8 w-8 text-green-600" />
                        </div>

                        <h2 className="text-lg font-semibold mb-2">
                            ¡Plantilla activada con éxito!
                        </h2>
                        <p className="text-gray-500 mb-6">
                            La plantilla ha sido activada correctamente. Ahora
                            puedes configurarla y asignarla a tus canales de
                            comunicación.
                        </p>

                        <div className="flex justify-center space-x-4">
                            <Button
                                variant="default"
                                color="gray"
                                onClick={() => onFinish()}
                            >
                                Ver mis plantillas
                            </Button>
                            <Button
                                variant="solid"
                                color="primary"
                                onClick={() =>
                                    activationId
                                        ? onFinish(activationId)
                                        : onFinish()
                                }
                            >
                                Configurar ahora
                            </Button>
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="bg-white rounded-lg shadow max-w-4xl mx-auto">
            <div className="border-b border-gray-200 p-4">
                <h1 className="text-xl font-bold text-gray-800">
                    Activar nueva plantilla de chatbot
                </h1>
            </div>

            <div className="p-6">
                <Steps current={currentStep}>
                    <Steps.Item
                        title="Selección"
                        description="Elegir plantilla"
                    />
                    <Steps.Item
                        title="Confirmación"
                        description="Revisar selección"
                    />
                    <Steps.Item
                        title="Finalización"
                        description="Activación completada"
                    />
                </Steps>
            </div>

            <div className="border-t border-gray-200">
                {renderStepContent()}
            </div>

            <div className="border-t border-gray-200 p-4 flex justify-between">
                {currentStep > 0 && currentStep < 2 ? (
                    <Button
                        variant="default"
                        color="gray"
                        icon={<PiArrowLeftBold />}
                        onClick={() => setCurrentStep(currentStep - 1)}
                    >
                        Anterior
                    </Button>
                ) : (
                    <Button
                        variant="default"
                        color="gray"
                        icon={<PiXBold />}
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                )}

                {currentStep < 1 ? (
                    <Button
                        variant="default"
                        color="primary"
                        icon={<PiArrowRightBold />}
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!selectedTemplate}
                    >
                        Siguiente
                    </Button>
                ) : currentStep === 1 ? (
                    <Button
                        variant="solid"
                        color="primary"
                        icon={<PiCheckBold />}
                        onClick={activateTemplate}
                        loading={activating}
                        disabled={!selectedTemplate}
                    >
                        Activar plantilla
                    </Button>
                ) : (
                    <div></div> // Espacio vacío para mantener la justificación
                )}
            </div>
        </div>
    )
}

export default ChatbotActivationWizard
