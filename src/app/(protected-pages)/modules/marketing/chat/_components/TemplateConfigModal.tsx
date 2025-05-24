/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/TemplateConfigModal.tsx
 * Modal para configuración y activación de plantillas de chatbot
 * @version 3.0.0
 * @updated 2025-05-23
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
    toast,
    Notification,
    Tabs
} from '@/components/ui'
import { useChatStore } from '../_store/chatStore'
import { ChatTemplate } from './TemplateSelector'
import apiSetTemplateEnabled from '@/services/ChatService/apiSetTemplateEnabled'
import apiActivateTemplate from '@/services/ChatService/apiActivateTemplate'
import { HiTrash } from 'react-icons/hi'

// Funciones auxiliares para notificaciones
const showSuccess = (message: string, title = 'Éxito') => {
    toast.push(
        <Notification title={title} type="success">
            {message}
        </Notification>
    )
}

const showError = (message: string, title = 'Error') => {
    toast.push(
        <Notification title={title} type="danger" duration={5000}>
            {message}
        </Notification>
    )
}

const showWarning = (message: string, title = 'Advertencia') => {
    toast.push(
        <Notification title={title} type="warning" duration={4000}>
            {message}
        </Notification>
    )
}

interface TemplateConfigModalProps {
    isOpen: boolean
    onClose: () => void
}

interface ExtendedChatTemplate extends ChatTemplate {
    isEnabled: boolean
    tokenCost?: number
    isLoadingToggle?: boolean
    verticalId?: string | null
    verticalName?: string | null
    isDeleted?: boolean // Nueva propiedad para marcar plantillas eliminadas
}

const TemplateConfigModal = ({ isOpen, onClose }: TemplateConfigModalProps) => {
    const [loading, setLoading] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
    const [isClient, setIsClient] = useState(false)
    const [extendedTemplates, setExtendedTemplates] = useState<ExtendedChatTemplate[]>([])
    const [activeTab, setActiveTab] = useState('sales') // Tab activo
    const [deletedTemplateIds, setDeletedTemplateIds] = useState<Set<string>>(new Set())

    // Obtener plantillas y funciones del store
    const templates = useChatStore((state) => state.templates || [])
    const activeTemplateId = useChatStore((state) => state.activeTemplateId)
    const setTemplates = useChatStore((state) => state.setTemplates)
    const setActiveTemplate = useChatStore((state) => state.setActiveTemplate)
    const fetchTemplatesFromStore = useChatStore((state) => state.fetchTemplates)

    // Detección de cliente para evitar errores de hidratación
    useEffect(() => {
        setIsClient(true)
        
        // Cargar plantillas eliminadas de localStorage
        const savedDeletedIds = localStorage.getItem('deletedTemplateIds')
        if (savedDeletedIds) {
            try {
                const ids = JSON.parse(savedDeletedIds)
                setDeletedTemplateIds(new Set(ids))
            } catch (e) {
                console.error('Error al cargar plantillas eliminadas:', e)
            }
        }
    }, [])

    // Cuando cambian las plantillas, actualizamos el estado extendido
    useEffect(() => {
        if (templates.length > 0 && isClient) {
            // Obtener las activaciones guardadas en localStorage
            let enabledStates = {}

            try {
                const savedStates = localStorage.getItem('templateEnabledStates')
                if (savedStates) {
                    enabledStates = JSON.parse(savedStates)
                }
            } catch (e) {
                console.error('Error al cargar estados de activación:', e)
            }

            const extended = templates
                .filter(template => !deletedTemplateIds.has(template.id)) // Filtrar plantillas eliminadas
                .map((template) => ({
                    ...template,
                    isEnabled: enabledStates[template.id] !== undefined ?
                        enabledStates[template.id] :
                        (template.isEnabled !== undefined ? template.isEnabled : true),
                    tokenCost: Math.floor(Math.random() * 500) + 500,
                }))

            // Verificar si hay una plantilla activa
            const hasActiveTemplate = extended.some(t => t.isActive)

            // Si no hay ninguna activa pero hay activeTemplateId, activar esa
            if (!hasActiveTemplate && activeTemplateId && extended.some(t => t.id === activeTemplateId)) {
                const updatedExtended = extended.map(template => ({
                    ...template,
                    isActive: template.id === activeTemplateId
                }))
                setExtendedTemplates(updatedExtended)
            } else {
                setExtendedTemplates(extended)
            }
        }
    }, [templates, activeTemplateId, isClient, deletedTemplateIds])

    // Establecer la plantilla activa por defecto
    useEffect(() => {
        if (isClient && isOpen) {
            if (activeTemplateId) {
                setSelectedTemplateId(activeTemplateId)
            } else if (templates.length > 0) {
                const activeTemplate = templates.find((t) => t.isActive)
                if (activeTemplate) {
                    setSelectedTemplateId(activeTemplate.id)
                    setActiveTemplate(activeTemplate.id)
                } else {
                    setSelectedTemplateId(templates[0].id)
                }
            }
        }
    }, [activeTemplateId, templates, isOpen, isClient, setActiveTemplate])

    // Cargar plantillas cuando se abre el modal
    const fetchTemplates = async () => {
        try {
            setLoading(true)
            await fetchTemplatesFromStore()
        } catch (error) {
            console.error('Error al cargar plantillas:', error)
            showError('No se pudieron cargar las plantillas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isClient && isOpen && templates.length === 0) {
            fetchTemplates()
        }
    }, [isOpen, isClient])

    // Manejar el cambio de selección
    const handleTemplateChange = (value: string) => {
        setSelectedTemplateId(value)
    }

    // Manejar eliminación de plantilla (ocultar localmente)
    const handleDeleteTemplate = (templateId: string) => {
        // Confirmar eliminación
        if (!confirm('¿Está seguro de que desea eliminar esta plantilla?')) {
            return
        }

        // Agregar a la lista de eliminados
        const newDeletedIds = new Set(deletedTemplateIds)
        newDeletedIds.add(templateId)
        setDeletedTemplateIds(newDeletedIds)

        // Guardar en localStorage
        localStorage.setItem('deletedTemplateIds', JSON.stringify(Array.from(newDeletedIds)))

        // Si es la plantilla seleccionada, deseleccionarla
        if (templateId === selectedTemplateId) {
            setSelectedTemplateId('')
        }

        // Actualizar la lista de plantillas
        setExtendedTemplates(prev => prev.filter(t => t.id !== templateId))

        showSuccess('Plantilla eliminada correctamente')
    }

    // Manejar cambio de estado de activación de plantilla
    const handleToggleTemplate = async (
        templateId: string,
        isEnabled: boolean,
    ) => {
        try {
            const isDefaultTemplate = templateId.startsWith('default-')

            setExtendedTemplates((prevTemplates) =>
                prevTemplates.map((template) =>
                    template.id === templateId
                        ? { ...template, isLoadingToggle: true }
                        : template,
                ),
            )

            if (isDefaultTemplate) {
                setTimeout(() => {
                    setExtendedTemplates((prevTemplates) =>
                        prevTemplates.map((template) =>
                            template.id === templateId
                                ? {
                                    ...template,
                                    isEnabled,
                                    isLoadingToggle: false,
                                    isActive: isEnabled ? true : template.isActive
                                  }
                                : template,
                        ),
                    )

                    if (isEnabled) {
                        setActiveTemplate(templateId)
                    }

                    // Guardar el estado en localStorage
                    if (isClient) {
                        try {
                            const savedStates = localStorage.getItem('templateEnabledStates')
                            let enabledStates = {}

                            if (savedStates) {
                                enabledStates = JSON.parse(savedStates)
                            }

                            enabledStates[templateId] = isEnabled
                            localStorage.setItem('templateEnabledStates', JSON.stringify(enabledStates))
                        } catch (e) {
                            console.error('Error al guardar estado de activación:', e)
                        }
                    }

                    if (!isEnabled && templateId === selectedTemplateId) {
                        setSelectedTemplateId('')
                    }

                    showSuccess(`Plantilla ${isEnabled ? 'activada' : 'desactivada'} exitosamente`)
                }, 500)

                return
            }

            // Para plantillas reales
            const { success, errorMessage } = await apiSetTemplateEnabled(templateId, isEnabled)

            if (success) {
                setExtendedTemplates((prevTemplates) =>
                    prevTemplates.map((template) =>
                        template.id === templateId
                            ? {
                                ...template,
                                isEnabled,
                                isLoadingToggle: false,
                                isActive: isEnabled ? true : template.isActive
                              }
                            : template,
                    ),
                )

                if (isEnabled) {
                    setActiveTemplate(templateId)
                }

                // Guardar el estado en localStorage
                if (isClient) {
                    try {
                        const savedStates = localStorage.getItem('templateEnabledStates')
                        let enabledStates = {}

                        if (savedStates) {
                            enabledStates = JSON.parse(savedStates)
                        }

                        enabledStates[templateId] = isEnabled
                        localStorage.setItem('templateEnabledStates', JSON.stringify(enabledStates))
                    } catch (e) {
                        console.error('Error al guardar estado de activación:', e)
                    }
                }

                if (!isEnabled && templateId === selectedTemplateId) {
                    setSelectedTemplateId('')
                }

                showSuccess(`Plantilla ${isEnabled ? 'activada' : 'desactivada'} exitosamente`)
            } else {
                setExtendedTemplates((prevTemplates) =>
                    prevTemplates.map((template) =>
                        template.id === templateId
                            ? { ...template, isLoadingToggle: false }
                            : template,
                    ),
                )

                showError(errorMessage || 'No se pudo cambiar el estado de la plantilla')
            }
        } catch (error) {
            setExtendedTemplates((prevTemplates) =>
                prevTemplates.map((template) =>
                    template.id === templateId
                        ? { ...template, isLoadingToggle: false }
                        : template,
                ),
            )

            showError('Error al procesar la solicitud')
        }
    }

    // Guardar la configuración y cerrar
    const handleSave = async () => {
        setLoading(true)
        try {
            const selectedTemplate = extendedTemplates.find(
                (t) => t.id === selectedTemplateId,
            )

            if (selectedTemplate && selectedTemplate.isEnabled) {
                const isDefaultTemplate = selectedTemplate.id.startsWith('default-')

                if (isDefaultTemplate) {
                    // Para plantillas predeterminadas
                    setActiveTemplate(selectedTemplateId)

                    // Actualizar el estado local
                    setExtendedTemplates((prevTemplates) =>
                        prevTemplates.map((template) => ({
                            ...template,
                            isActive: template.id === selectedTemplateId
                        }))
                    )

                    // Actualizar las plantillas en el store para reflejar el cambio
                    const updatedTemplates = templates.map(template => ({
                        ...template,
                        isActive: template.id === selectedTemplateId
                    }))
                    setTemplates(updatedTemplates)

                    showSuccess(`Plantilla "${selectedTemplate.name}" activada como chatbot principal`)
                } else {
                    // Para plantillas reales
                    const cookieStore = document.cookie.split('; ').find(row => row.startsWith('tenant_id='))
                    const tenantId = cookieStore ? cookieStore.split('=')[1] : process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'default'
                    
                    const { success, activationId, error } = await apiActivateTemplate(
                        selectedTemplateId,
                        tenantId
                    )

                    if (success) {
                        setActiveTemplate(selectedTemplateId)

                        // Actualizar el estado local
                        setExtendedTemplates((prevTemplates) =>
                            prevTemplates.map((template) => ({
                                ...template,
                                isActive: template.id === selectedTemplateId
                            }))
                        )

                        // Actualizar las plantillas en el store
                        const updatedTemplates = templates.map(template => ({
                            ...template,
                            isActive: template.id === selectedTemplateId
                        }))
                        setTemplates(updatedTemplates)

                        // Emitir evento para actualizar el chat
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('template-changed', {
                                detail: {
                                    templateId: selectedTemplateId,
                                    templateName: selectedTemplate.name,
                                    activationId
                                },
                                bubbles: true
                            }))
                        }

                        showSuccess(`Plantilla "${selectedTemplate.name}" activada como chatbot principal`)
                    } else {
                        showError(`Error al activar la plantilla: ${error}`)
                        setLoading(false)
                        return
                    }
                }
            } else if (selectedTemplate && !selectedTemplate.isEnabled) {
                showWarning(`La plantilla "${selectedTemplate.name}" está deshabilitada. Debe activarla primero.`)
                setLoading(false)
                return
            } else {
                showWarning('Por favor, seleccione una plantilla válida para activar.')
                setLoading(false)
                return
            }

            onClose()
        } catch (error) {
            console.error('Error al guardar configuración:', error)
            showError(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setLoading(false)
        }
    }

    // No renderizamos en SSR para evitar errores de hidratación
    if (!isClient) {
        return null
    }

    // Componente para mostrar una plantilla individual
    const TemplateCard = ({ template }: { template: ExtendedChatTemplate }) => (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-3">
                <div className="flex items-center gap-2">
                    <Radio
                        value={template.id}
                        disabled={!template.isEnabled}
                        className="min-w-[16px]"
                    />
                    <Avatar
                        size={28}
                        shape="circle"
                        src={template.avatarUrl || '/img/avatars/thumb-2.jpg'}
                    />
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-1">
                            <div className="font-medium text-xs">
                                {template.name}
                            </div>
                            {template.id === activeTemplateId && (
                                <span className="text-xs text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm">
                                    Activa
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            {template.verticalName && (
                                <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-sm inline-block">
                                    {template.verticalName}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Botón de eliminar */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template.id)
                        }}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Eliminar plantilla"
                    >
                        <HiTrash className="w-4 h-4 text-red-500" />
                    </button>
                </div>
                {template.description && (
                    <div className="mt-1 ml-8">
                        <p className="text-xs text-gray-500 line-clamp-1">
                            {template.description}
                        </p>
                    </div>
                )}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-500">
                        {template.isEnabled ? 'Plantilla activada' : 'Activar plantilla'}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${template.isEnabled ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {template.tokenCost} tokens/mes
                        </span>
                        {template.isLoadingToggle ? (
                            <Spinner size={16} />
                        ) : (
                            <Switcher
                                checked={template.isEnabled}
                                onChange={(checked) => handleToggleTemplate(template.id, checked)}
                                size="sm"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

    // Categorización de plantillas
    const isInCategory = (templateName: string, keywords: string[]) => {
        const name = templateName.toLowerCase()
        return keywords.some(keyword => name.includes(keyword))
    }

    // Keywords para cada categoría
    const salesKeywords = ['venta', 'mercadeo', 'marketing', 'oferta', 'promoción', 'lead', 'embudo']
    const supportKeywords = ['atención', 'soporte', 'cliente', 'ayuda', 'consulta', 'servicio']
    const appointmentKeywords = ['cita', 'agenda', 'programación', 'reprogramación']

    // Filtramos plantillas por categoría
    const salesTemplates = extendedTemplates.filter(template =>
        isInCategory(template.name, salesKeywords)
    )

    const supportTemplates = extendedTemplates.filter(template =>
        isInCategory(template.name, supportKeywords)
    )

    const appointmentTemplates = extendedTemplates.filter(template =>
        isInCategory(template.name, appointmentKeywords)
    )

    const otherTemplates = extendedTemplates.filter(template =>
        !isInCategory(template.name, [...salesKeywords, ...supportKeywords, ...appointmentKeywords])
    )

    // Función para obtener plantillas según el tab activo
    const getTemplatesByTab = () => {
        switch (activeTab) {
            case 'sales':
                return salesTemplates
            case 'appointments':
                return appointmentTemplates
            case 'support':
                return supportTemplates
            case 'other':
                return otherTemplates
            case 'all':
                return extendedTemplates
            default:
                return []
        }
    }

    const tabList = [
        { key: 'sales', label: 'Ventas y Marketing', count: salesTemplates.length },
        { key: 'appointments', label: 'Gestión de Citas', count: appointmentTemplates.length },
        { key: 'support', label: 'Atención al Cliente', count: supportTemplates.length },
        { key: 'other', label: 'Otras', count: otherTemplates.length },
        { key: 'all', label: 'Todas', count: extendedTemplates.length }
    ]

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={900}>
            <h4 className="text-xl font-semibold mb-4">Configuración de Chatbot</h4>
            {loading ? (
                <div className="flex justify-center py-8">
                    <Spinner size={40} />
                </div>
            ) : (
                <div>
                    <h5 className="text-base font-medium mb-4">Plantillas Disponibles</h5>

                    {/* Tabs para categorías */}
                    <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                        <Tabs.TabList>
                            {tabList.map(tab => (
                                <Tabs.TabNav key={tab.key} value={tab.key}>
                                    {tab.label}
                                    <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                        {tab.count}
                                    </span>
                                </Tabs.TabNav>
                            ))}
                        </Tabs.TabList>
                        <div className="mt-4">
                            <Tabs.TabContent value={activeTab}>
                                <Radio.Group
                                    value={selectedTemplateId}
                                    onChange={handleTemplateChange}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {getTemplatesByTab().map((template) => (
                                            <TemplateCard
                                                key={template.id}
                                                template={template}
                                            />
                                        ))}
                                    </div>
                                    {getTemplatesByTab().length === 0 && (
                                        <div className="py-6 text-center text-gray-500">
                                            No hay plantillas en esta categoría.
                                        </div>
                                    )}
                                </Radio.Group>
                            </Tabs.TabContent>
                        </div>
                    </Tabs>

                    {/* Mensaje cuando no hay plantillas */}
                    {extendedTemplates.length === 0 && (
                        <div className="py-6 text-center text-gray-500">
                            No hay plantillas disponibles en este momento.
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end items-center mt-6 gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <Button
                    variant="plain"
                    onClick={onClose}
                    disabled={loading}
                    size="sm"
                    className="px-4"
                >
                    Cancelar
                </Button>
                <Button
                    variant="solid"
                    onClick={handleSave}
                    disabled={loading || !selectedTemplateId}
                    size="sm"
                    className="px-4"
                >
                    {loading ? (
                        <Spinner size={16} className="mr-2" />
                    ) : null}
                    Guardar
                </Button>
            </div>
        </Dialog>
    )
}

export default TemplateConfigModal
