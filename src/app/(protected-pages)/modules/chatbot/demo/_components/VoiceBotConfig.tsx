/**
 * frontend/src/app/(protected-pages)/modules/chatbot/demo/_components/VoiceBotConfig.tsx
 * Componente para la configuración del VoiceBot - Interfaz visual de ajustes
 * @version 1.0.0
 * @updated 2025-04-28
 */

'use client'

import React, { useCallback, useEffect } from 'react'
import { 
    Input, 
    FormContainer, 
    FormItem, 
    Button, 
    Select, 
    Switcher,
    Notification, 
    toast 
} from '@/components/ui'
import TemplateSelector from '@/app/(protected-pages)/modules/marketing/chat/_components/TemplateSelector'
import ClientOnly from '@/components/shared/ClientOnly'
import apiActivateFlow from '@/services/ChatService/apiActivateFlow'
import apiInstantiateTemplate from '@/services/ChatService/apiInstantiateTemplate'
import { useChatStore } from '@/app/(protected-pages)/modules/marketing/chat/_store/chatStore'

// Type for Select options
interface SelectOption {
    value: string
    label: string
}

// Tipo para las propiedades del componente
interface VoiceBotConfigProps {
    config: {
        botName: string
        welcomeMessage: string
        primaryColor: string
        secondaryColor: string
        textColor: string
        buttonColor: string
        position: string
        autoOpen: boolean
    }
    onConfigChange: (key: string, value: string | number | boolean) => void
    onApplyChanges: () => void
    message: string | object
    setMessage: (message: string | object) => void
    setSelectedFlowId: (flowId: string | null) => void
    setIsLoading: (isLoading: boolean) => void
}

const VoiceBotConfig: React.FC<VoiceBotConfigProps> = ({
    config,
    onConfigChange,
    onApplyChanges,
    message,
    setMessage,
    setSelectedFlowId,
    setIsLoading
}) => {
    // Opciones para la posición del widget
    const positionOptions: SelectOption[] = [
        { value: 'bottom-right', label: 'Inferior derecha' },
        { value: 'bottom-left', label: 'Inferior izquierda' },
        { value: 'top-right', label: 'Superior derecha' },
        { value: 'top-left', label: 'Superior izquierda' },
    ]

    // --- Obtener plantillas del store (necesario para el selector) ---
    const templates = useChatStore((state) => state.templates || [])
    const fetchTemplates = useChatStore((state) => state.fetchTemplates) 

    // Cargar plantillas al montar si no están cargadas
    useEffect(() => {
        // Solo llamar a fetchTemplates si no hay plantillas
        if (templates.length === 0 && fetchTemplates) {
            fetchTemplates()
        }
    }, [fetchTemplates, templates.length])

    // --- Handler para cambio de plantilla ---
    const handleTemplateSelectionChange = useCallback(
        async (templateId: string) => {
            const selectedTemplate = templates.find((t) => t.id === templateId)
            if (selectedTemplate) {
                setIsLoading(true) // Mostrar indicador de carga
                let flowToActivate = selectedTemplate.flowId
                let activationSuccess = false

                try {
                    // Si no hay flowId, intentar instanciar la plantilla primero
                    if (!flowToActivate) {
                        toast.push(
                            <Notification
                                title="Instanciando Plantilla..."
                                type="info"
                                duration={2000}
                            >
                                Creando una instancia de &quot;
                                {selectedTemplate.name}&quot; para tu uso.
                            </Notification>,
                        )
                        const newFlowId = await apiInstantiateTemplate(
                            selectedTemplate.id,
                        )
                        if (newFlowId) {
                            flowToActivate = newFlowId
                            // Opcional: Recargar plantillas para obtener el nuevo flowId en el estado
                            // Esto asegura que la próxima vez que se seleccione, ya tenga el flowId
                            if (fetchTemplates) fetchTemplates()
                        } else {
                            // Si la instanciación falla, mostramos error y salimos
                            toast.push(
                                <Notification
                                    title="Error de Instanciación"
                                    type="danger"
                                >
                                    No se pudo crear una instancia para la
                                    plantilla &quot;{selectedTemplate.name}
                                    &quot;.
                                </Notification>,
                            )
                            setIsLoading(false)
                            return // Salir de la función si la instanciación falló
                        }
                    }

                    // Proceder a activar el flujo (existente o recién creado)
                    if (flowToActivate) {
                        activationSuccess =
                            await apiActivateFlow(flowToActivate)
                        if (activationSuccess) {
                            setSelectedFlowId(flowToActivate) // Actualizar estado local
                            toast.push(
                                <Notification
                                    title="Plantilla Activada"
                                    type="success"
                                >
                                    La plantilla &quot;{selectedTemplate.name}
                                    &quot; se ha activado correctamente.
                                </Notification>,
                            )
                        } else {
                            toast.push(
                                <Notification
                                    title="Error al Activar"
                                    type="danger"
                                >
                                    No se pudo activar la plantilla &quot;
                                    {selectedTemplate.name}&quot;.
                                </Notification>,
                            )
                        }
                    } else {
                        // Esto no debería ocurrir si la instanciación fue exitosa, pero por si acaso
                        toast.push(
                            <Notification title="Error" type="danger">
                                No se pudo obtener el ID del flujo para activar.
                            </Notification>,
                        )
                    }
                } catch (error) {
                    toast.push(
                        <Notification title="Error" type="danger">
                            Ocurrió un error al procesar la plantilla
                            seleccionada.
                        </Notification>,
                    )
                    console.error('Error handling template selection:', error)
                } finally {
                    setIsLoading(false)
                }
            } else {
                console.warn(
                    `Template with id ${templateId} not found in local state.`,
                )
                toast.push(
                    <Notification title="Error Interno" type="warning">
                        No se encontró la plantilla seleccionada localmente.
                    </Notification>,
                )
            }
        },
        [templates, setIsLoading, setSelectedFlowId, fetchTemplates],
    )

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">
                    Configuración del Voice Bot
                </h2>
                <div className="flex space-x-2">
                    <Button
                        variant="default"
                        color="green"
                        onClick={() => {
                            // Actualizar mensaje si se ha cambiado
                            if (
                                message === 'Por favor, envía un mensaje de voz...' &&
                                config.welcomeMessage !== message
                            ) {
                                setMessage(config.welcomeMessage)
                            }
                            
                            onApplyChanges()
                            
                            toast.push(
                                <Notification
                                    title="Configuración Aplicada"
                                    type="success"
                                >
                                    La configuración se ha aplicado
                                    al componente del chat
                                </Notification>,
                            )
                        }}
                    >
                        Aplicar Cambios
                    </Button>
                </div>
            </div>

            <FormContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        label="Nombre del bot"
                        labelClass="font-medium mb-1.5"
                    >
                        <Input
                            value={config.botName}
                            onChange={(e) =>
                                onConfigChange('botName', e.target.value)
                            }
                            placeholder="Customer Service Agent"
                        />
                    </FormItem>
                    <FormItem
                        label="Mensaje de bienvenida (Visual)"
                        labelClass="font-medium mb-1.5"
                    >
                        <Input
                            value={config.welcomeMessage}
                            onChange={(e) =>
                                onConfigChange('welcomeMessage', e.target.value)
                            }
                            placeholder="Por favor, envía un mensaje de voz..."
                        />
                    </FormItem>
                    {/* Añadir Selector de Plantilla */}
                    <FormItem
                        label="Plantilla Activa"
                        labelClass="font-medium mb-1.5"
                    >
                        <ClientOnly>
                            <TemplateSelector
                                onTemplateChange={handleTemplateSelectionChange}
                            />
                        </ClientOnly>
                    </FormItem>
                </div>

                {/* Ajustar grid para colores y opciones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormItem
                        label="Color primario"
                        labelClass="font-medium mb-1.5"
                    >
                        <div className="flex items-center">
                            <div className="relative">
                                <div
                                    className="w-8 h-8 rounded mr-2 cursor-pointer border border-gray-300"
                                    style={{
                                        backgroundColor: config.primaryColor,
                                    }}
                                    onClick={() => {
                                        // Disparar un clic en el input de color oculto
                                        document
                                            .getElementById('primaryColorPicker')
                                            ?.click()
                                    }}
                                ></div>
                                <input
                                    id="primaryColorPicker"
                                    type="color"
                                    value={config.primaryColor}
                                    onChange={(e) =>
                                        onConfigChange('primaryColor', e.target.value)
                                    }
                                    className="opacity-0 absolute top-0 left-0 w-0 h-0"
                                />
                            </div>
                            <Input
                                value={config.primaryColor}
                                onChange={(e) =>
                                    onConfigChange('primaryColor', e.target.value)
                                }
                                placeholder="#128c7e"
                            />
                        </div>
                    </FormItem>
                    <FormItem
                        label="Color secundario"
                        labelClass="font-medium mb-1.5"
                    >
                        <div className="flex items-center">
                            <div className="relative">
                                <div
                                    className="w-8 h-8 rounded mr-2 cursor-pointer border border-gray-300"
                                    style={{
                                        backgroundColor: config.secondaryColor,
                                    }}
                                    onClick={() => {
                                        document
                                            .getElementById('secondaryColorPicker')
                                            ?.click()
                                    }}
                                ></div>
                                <input
                                    id="secondaryColorPicker"
                                    type="color"
                                    value={config.secondaryColor}
                                    onChange={(e) =>
                                        onConfigChange('secondaryColor', e.target.value)
                                    }
                                    className="opacity-0 absolute top-0 left-0 w-0 h-0"
                                />
                            </div>
                            <Input
                                value={config.secondaryColor}
                                onChange={(e) =>
                                    onConfigChange('secondaryColor', e.target.value)
                                }
                                placeholder="#F4F4F5"
                            />
                        </div>
                    </FormItem>
                    <FormItem
                        label="Color de texto"
                        labelClass="font-medium mb-1.5"
                    >
                        <div className="flex items-center">
                            <div className="relative">
                                <div
                                    className="w-8 h-8 rounded mr-2 cursor-pointer border border-gray-300"
                                    style={{
                                        backgroundColor: config.textColor,
                                    }}
                                    onClick={() => {
                                        document
                                            .getElementById('textColorPicker')
                                            ?.click()
                                    }}
                                ></div>
                                <input
                                    id="textColorPicker"
                                    type="color"
                                    value={config.textColor}
                                    onChange={(e) =>
                                        onConfigChange('textColor', e.target.value)
                                    }
                                    className="opacity-0 absolute top-0 left-0 w-0 h-0"
                                />
                            </div>
                            <Input
                                value={config.textColor}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    onConfigChange('textColor', e.target.value)
                                }
                                placeholder="#FFFFFF"
                            />
                        </div>
                    </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormItem
                        label="Color de botones"
                        labelClass="font-medium mb-1.5"
                    >
                        <div className="flex items-center">
                            <div className="relative">
                                <div
                                    className="w-8 h-8 rounded mr-2 cursor-pointer border border-gray-300"
                                    style={{
                                        backgroundColor: config.buttonColor,
                                    }}
                                    onClick={() => {
                                        document
                                            .getElementById('buttonColorPicker')
                                            ?.click()
                                    }}
                                ></div>
                                <input
                                    id="buttonColorPicker"
                                    type="color"
                                    value={config.buttonColor}
                                    onChange={(e) =>
                                        onConfigChange('buttonColor', e.target.value)
                                    }
                                    className="opacity-0 absolute top-0 left-0 w-0 h-0"
                                />
                            </div>
                            <Input
                                value={config.buttonColor}
                                onChange={(e) =>
                                    onConfigChange('buttonColor', e.target.value)
                                }
                                placeholder="#128c7e"
                            />
                        </div>
                    </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormItem
                        label="Posición del widget"
                        labelClass="font-medium mb-1.5"
                    >
                        <ClientOnly>
                            <Select<SelectOption>
                                options={positionOptions}
                                onChange={(option) =>
                                    onConfigChange('position', option?.value || '')
                                }
                                value={
                                    positionOptions.find(
                                        (opt: SelectOption) =>
                                            opt.value === config.position
                                    ) || positionOptions[0]
                                }
                            />
                        </ClientOnly>
                    </FormItem>
                    <FormItem
                        label="Auto-apertura"
                        labelClass="font-medium mb-1.5"
                        extra="Abrir el chat automáticamente después de unos segundos"
                    >
                        <Switcher
                            checked={config.autoOpen}
                            onChange={(checked) =>
                                onConfigChange('autoOpen', checked)
                            }
                        />
                    </FormItem>
                </div>
            </FormContainer>
        </div>
    )
}

export default VoiceBotConfig
