/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/TemplateConfigModal.tsx
 * Modal para configuración y activación de plantillas de chatbot
 * @version 1.1.0
 * @updated 2025-04-26
 */

'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    Radio,
    Avatar,
    Button,
    Spinner,
    Switcher,
} from '@/components/ui'
import { useChatStore } from '../_store/chatStore'
import { ChatTemplate } from './TemplateSelector'
// Importación directa del servicio específico
import apiGetChatTemplates from '@/services/ChatService/apiGetChatTemplates'
// import apiSetActiveTemplate from '@/services/ChatService/apiSetActiveTemplate' // Ya no se usa directamente aquí
import apiSetTemplateEnabled from '@/services/ChatService/apiSetTemplateEnabled' // Importado previamente
import apiActivateFlow from '@/services/ChatService/apiActivateFlow' // Nuevo servicio para activar flujo

interface TemplateConfigModalProps {
    isOpen: boolean
    onClose: () => void
}

interface ExtendedChatTemplate extends ChatTemplate {
    isEnabled: boolean
    tokenCost?: number
}

const TemplateConfigModal = ({ isOpen, onClose }: TemplateConfigModalProps) => {
    const [loading, setLoading] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
    const [isClient, setIsClient] = useState(false)
    const [extendedTemplates, setExtendedTemplates] = useState<
        ExtendedChatTemplate[]
    >([])

    // Obtener plantillas y funciones del store
    const templates = useChatStore((state) => state.templates || [])
    const activeTemplateId = useChatStore((state) => state.activeTemplateId)
    const setTemplates = useChatStore((state) => state.setTemplates)
    const setActiveTemplate = useChatStore((state) => state.setActiveTemplate)

    // Detección de cliente para evitar errores de hidratación
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Cuando cambian las plantillas, actualizamos el estado extendido
    useEffect(() => {
        if (templates.length > 0) {
            const extended = templates.map((template) => ({
                ...template,
                isEnabled: template.isActive,
                tokenCost: Math.floor(Math.random() * 500) + 500, // Simulación de costo de tokens
            }))
            setExtendedTemplates(extended)
        }
    }, [templates])

    // Establecer la plantilla activa por defecto
    useEffect(() => {
        if (isClient && isOpen) {
            if (activeTemplateId) {
                setSelectedTemplateId(activeTemplateId)
            } else if (templates.length > 0) {
                const activeTemplate = templates.find((t) => t.isActive)
                setSelectedTemplateId(activeTemplate?.id || templates[0].id)
            }
        }
    }, [activeTemplateId, templates, isOpen, isClient])

    // Cargar plantillas disponibles desde el servidor
    const fetchTemplates = async () => {
        try {
            setLoading(true)
            const templatesData = await apiGetChatTemplates()
            if (templatesData && templatesData.length > 0) {
                setTemplates(templatesData)
            }
        } catch (error) {
            console.error('Error al cargar plantillas:', error)
        } finally {
            setLoading(false)
        }
    }

    // Cargar plantillas cuando se abre el modal
    useEffect(() => {
        if (isClient && isOpen && templates.length === 0) {
            fetchTemplates()
        }
    }, [isOpen, isClient])

    // Manejar el cambio de selección
    const handleTemplateChange = (value: string) => {
        setSelectedTemplateId(value)
    }

    // Manejar cambio de estado de activación de plantilla
    const handleToggleTemplate = async (
        templateId: string,
        isEnabled: boolean,
    ) => {
        try {
            // Llamar al servicio para actualizar el estado "enabled" de la plantilla
            await apiSetTemplateEnabled(templateId, isEnabled)

            // Actualizar el estado local
            setExtendedTemplates((prevTemplates) =>
                prevTemplates.map((template) =>
                    template.id === templateId
                        ? { ...template, isEnabled }
                        : template,
                ),
            )
        } catch (error) {
            console.error(
                'Error al establecer el estado "enabled" de la plantilla:',
                error,
            )
        }
    }

    // Guardar la configuración y cerrar
    const handleSave = async () => {
        setLoading(true)
        try {
            // Solo se puede activar la plantilla seleccionada y que esté habilitada
            const selectedTemplate = extendedTemplates.find(
                (t) => t.id === selectedTemplateId,
            )

            if (selectedTemplate && selectedTemplate.isEnabled) {
                // Verificar si la plantilla tiene un flowId asociado (ya instanciada)
                if (selectedTemplate.flowId) {
                    // Llamar al nuevo servicio para activar el FLUJO instanciado
                    const success = await apiActivateFlow(
                        selectedTemplate.flowId,
                    )

                    if (success) {
                        // Actualizar plantilla activa en el store (usando templateId para la UI)
                        setActiveTemplate(selectedTemplateId)
                        console.log(
                            `Flujo ${selectedTemplate.flowId} activado para plantilla ${selectedTemplateId}`,
                        )
                    } else {
                        console.error(
                            `Error al activar el flujo ${selectedTemplate.flowId}`,
                        )
                        // Podríamos mostrar un toast de error aquí
                    }
                } else {
                    // La plantilla seleccionada no tiene una instancia de flujo para este tenant
                    console.warn(
                        `La plantilla ${selectedTemplateId} no está instanciada para este tenant. No se puede activar.`,
                    )
                    // Podríamos mostrar un toast informativo aquí
                    // Opcionalmente: Podríamos intentar instanciarla aquí, pero añade complejidad.
                }
            } else if (selectedTemplate && !selectedTemplate.isEnabled) {
                console.warn(
                    `La plantilla ${selectedTemplateId} está deshabilitada, no se puede activar.`,
                )
                // Podríamos mostrar un toast informativo aquí
            } else {
                console.warn(
                    'No se seleccionó ninguna plantilla válida para activar.',
                )
            }

            // Cerrar el modal
            onClose()
        } catch (error) {
            console.error('Error al guardar configuración:', error)
        } finally {
            setLoading(false)
        }
    }

    // No renderizamos en SSR para evitar errores de hidratación
    if (!isClient) {
        return null
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={500}>
            {/* Contenido del diálogo sin usar Dialog.Header, Dialog.Body, etc. */}
            <div className="p-6">
                {/* Cabecera */}
                <div className="mb-6">
                    <h4 className="mb-0">Configuración de Chatbot</h4>
                </div>

                {/* Cuerpo */}
                <div className="mb-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size={40} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h5 className="mb-4">Plantillas Disponibles</h5>
                            <div className="space-y-3">
                                <Radio.Group
                                    vertical
                                    value={selectedTemplateId}
                                    onChange={handleTemplateChange}
                                >
                                    {extendedTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-2"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Radio
                                                    value={template.id}
                                                    disabled={
                                                        !template.isEnabled
                                                    }
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            size={40}
                                                            shape="circle"
                                                            src={
                                                                template.avatarUrl ||
                                                                '/img/avatars/thumb-2.jpg'
                                                            }
                                                        />
                                                        <div>
                                                            <div className="font-medium">
                                                                {template.name}
                                                            </div>
                                                            {template.description && (
                                                                <div className="text-sm text-gray-500">
                                                                    {
                                                                        template.description
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Radio>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-xs font-medium ${template.isEnabled ? 'text-emerald-500' : 'text-gray-400'}`}
                                                    >
                                                        {template.tokenCost}{' '}
                                                        tokens/mes
                                                    </span>
                                                    <Switcher
                                                        checked={
                                                            template.isEnabled
                                                        }
                                                        onChange={(checked) =>
                                                            handleToggleTemplate(
                                                                template.id,
                                                                checked,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="ml-7 pl-3 mt-1 text-xs text-gray-500">
                                                {template.isEnabled
                                                    ? 'Plantilla activada y lista para usar'
                                                    : 'Activar plantilla para poder seleccionarla'}
                                            </div>
                                        </div>
                                    ))}
                                </Radio.Group>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pie */}
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner size={20} className="mr-2" />
                        ) : null}
                        Guardar
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default TemplateConfigModal
