/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/TemplateConfigModal.tsx
 * Modal para configuración y activación de plantillas de chatbot
 * @version 2.0.0
 * @updated 2025-11-05
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
    Notification
} from '@/components/ui'
import { useChatStore } from '../_store/chatStore'
import { ChatTemplate } from './TemplateSelector'
// import apiSetActiveTemplate from '@/services/ChatService/apiSetActiveTemplate' // Ya no se usa directamente aquí
import apiSetTemplateEnabled from '@/services/ChatService/apiSetTemplateEnabled' // Importado previamente
import apiActivateFlow from '@/services/ChatService/apiActivateFlow' // Nuevo servicio para activar flujo
import apiActivateTemplate from '@/services/ChatService/apiActivateTemplate' // Servicio para activar plantilla

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
        if (templates.length > 0 && isClient) {
            console.log('Actualizando extended templates desde templates:', templates);

            // Primero obtener las activaciones guardadas en localStorage
            let enabledStates = {};

            try {
                const savedStates = localStorage.getItem('templateEnabledStates');
                if (savedStates) {
                    enabledStates = JSON.parse(savedStates);
                    console.log('Estados de activación cargados:', enabledStates);
                }
            } catch (e) {
                console.error('Error al cargar estados de activación:', e);
            }

            const extended = templates.map((template) => ({
                ...template,
                // isEnabled debe reflejar si la plantilla está habilitada para uso
                // Prioridad: 1. Estado guardado localmente, 2. Estado traído del servidor, 3. true por defecto
                isEnabled: enabledStates[template.id] !== undefined ?
                    enabledStates[template.id] :
                    (template.isEnabled !== undefined ? template.isEnabled : true),
                // isActive viene directamente de los templates (no modificar)
                tokenCost: Math.floor(Math.random() * 500) + 500, // Simulación de costo de tokens
            }));

            // Verificar si hay una plantilla activa
            const hasActiveTemplate = extended.some(t => t.isActive);
            console.log('¿Hay plantilla activa en templates?', hasActiveTemplate);

            // Si no hay ninguna activa pero hay activeTemplateId, activar esa
            if (!hasActiveTemplate && activeTemplateId) {
                console.log('No hay plantilla activa pero hay activeTemplateId:', activeTemplateId);
                const updatedExtended = extended.map(template => ({
                    ...template,
                    isActive: template.id === activeTemplateId
                }));
                setExtendedTemplates(updatedExtended);
            } else {
                setExtendedTemplates(extended);
            }
        }
    }, [templates, activeTemplateId, isClient])

    // Establecer la plantilla activa por defecto
    useEffect(() => {
        if (isClient && isOpen) {
            // Si hay un activeTemplateId en el store, usarlo primero
            if (activeTemplateId) {
                console.log(`Seleccionando plantilla activa del store: ${activeTemplateId}`);
                setSelectedTemplateId(activeTemplateId);
            }
            // Si no hay activeTemplateId pero hay templates, buscar una plantilla activa
            else if (templates.length > 0) {
                const activeTemplate = templates.find((t) => t.isActive);
                if (activeTemplate) {
                    console.log(`Seleccionando plantilla activa: ${activeTemplate.name} (${activeTemplate.id})`);
                    setSelectedTemplateId(activeTemplate.id);
                    // Asegurarnos de que esta plantilla también esté marcada como activa en el store
                    setActiveTemplate(activeTemplate.id);
                } else {
                    console.log(`No hay plantilla activa, seleccionando la primera: ${templates[0].name} (${templates[0].id})`);
                    setSelectedTemplateId(templates[0].id);
                }
            }
        }
    }, [activeTemplateId, templates, isOpen, isClient, setActiveTemplate])

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

        // Log para depuración: identificar la plantilla activa cada vez que cambia
        if (isClient && activeTemplateId && extendedTemplates.length > 0) {
            const activeTemplate = extendedTemplates.find(t => t.id === activeTemplateId);
            if (activeTemplate) {
                console.log(`Plantilla activa actualmente: ${activeTemplate.name} (ID: ${activeTemplate.id})`);
            }
        }
    }, [isOpen, isClient, activeTemplateId, extendedTemplates])

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
            // Verificar si es una ID de plantilla predeterminada (como "default-*")
            const isDefaultTemplate = templateId.startsWith('default-');

            // Mostrar estado de carga para la plantilla específica
            setExtendedTemplates((prevTemplates) =>
                prevTemplates.map((template) =>
                    template.id === templateId
                        ? { ...template, isLoadingToggle: true }
                        : template,
                ),
            )

            // Si es una plantilla predeterminada, solo actualizamos el estado local
            if (isDefaultTemplate) {
                console.log(`Plantilla predeterminada "${templateId}" detectada - actualizando solo estado local`);

                // Simular un pequeño retraso para el efecto visual
                setTimeout(() => {
                    // Actualizar el estado local
                    setExtendedTemplates((prevTemplates) =>
                        prevTemplates.map((template) =>
                            template.id === templateId
                                ? {
                                    ...template,
                                    isEnabled,
                                    isLoadingToggle: false,
                                    // Si se está activando, también actualizar isActive
                                    isActive: isEnabled ? true : template.isActive
                                  }
                                : template,
                        ),
                    )

                    // También actualizar en el store global si se está activando
                    if (isEnabled) {
                        setActiveTemplate(templateId);
                    }

                    // Guardar el estado en localStorage para persistencia
                    if (isClient) {
                        try {
                            // Obtener estados actuales
                            const savedStates = localStorage.getItem('templateEnabledStates');
                            let enabledStates = {};

                            if (savedStates) {
                                enabledStates = JSON.parse(savedStates);
                            }

                            // Actualizar el estado para esta plantilla
                            enabledStates[templateId] = isEnabled;

                            // Guardar en localStorage
                            localStorage.setItem('templateEnabledStates', JSON.stringify(enabledStates));
                            console.log(`Estado de plantilla ${templateId} guardado como ${isEnabled ? 'activado' : 'desactivado'}`);
                        } catch (e) {
                            console.error('Error al guardar estado de activación:', e);
                        }
                    }

                    // Si se está desactivando la plantilla actualmente seleccionada, deseleccionarla
                    if (!isEnabled && templateId === selectedTemplateId) {
                        setSelectedTemplateId('');
                    }

                    // Mostrar notificación de éxito
                    showSuccess(`Plantilla ${isEnabled ? 'activada' : 'desactivada'} exitosamente`);
                }, 500); // Pequeño retraso para simular procesamiento

                return; // Salir aquí, ya hemos manejado las plantillas predeterminadas
            }

            // Este código solo se ejecuta para plantillas reales (no predeterminadas)
            // Llamar al servicio para actualizar el estado "enabled" de la plantilla
            const { success, errorMessage } = await apiSetTemplateEnabled(templateId, isEnabled)

            if (success) {
                // Actualizar el estado local si la operación fue exitosa
                setExtendedTemplates((prevTemplates) =>
                    prevTemplates.map((template) =>
                        template.id === templateId
                            ? {
                                ...template,
                                isEnabled,
                                isLoadingToggle: false,
                                // Si se está activando, también actualizar isActive
                                isActive: isEnabled ? true : template.isActive
                              }
                            : template,
                    ),
                )

                // También actualizar en el store global si se está activando
                if (isEnabled) {
                    setActiveTemplate(templateId);
                }

                // Guardar el estado en localStorage para persistencia
                if (isClient) {
                    try {
                        // Obtener estados actuales
                        const savedStates = localStorage.getItem('templateEnabledStates');
                        let enabledStates = {};

                        if (savedStates) {
                            enabledStates = JSON.parse(savedStates);
                        }

                        // Actualizar el estado para esta plantilla
                        enabledStates[templateId] = isEnabled;

                        // Guardar en localStorage
                        localStorage.setItem('templateEnabledStates', JSON.stringify(enabledStates));
                        console.log(`Estado de plantilla ${templateId} guardado como ${isEnabled ? 'activado' : 'desactivado'}`);
                    } catch (e) {
                        console.error('Error al guardar estado de activación:', e);
                    }
                }

                // Si se está desactivando la plantilla actualmente seleccionada, deseleccionarla
                if (!isEnabled && templateId === selectedTemplateId) {
                    setSelectedTemplateId('')
                }

                // Mostrar notificación de éxito
                showSuccess(`Plantilla ${isEnabled ? 'activada' : 'desactivada'} exitosamente`);
            } else {
                // Revertir el cambio visual si hubo un error
                setExtendedTemplates((prevTemplates) =>
                    prevTemplates.map((template) =>
                        template.id === templateId
                            ? { ...template, isLoadingToggle: false }
                            : template,
                    ),
                )

                console.error(
                    'No se pudo cambiar el estado de la plantilla:',
                    errorMessage || 'Operación rechazada por el servidor.'
                )

                // Mostrar notificación de error
                showError(errorMessage || 'No se pudo cambiar el estado de la plantilla. Inténtelo de nuevo más tarde.');
            }
        } catch (error) {
            // Revertir el cambio visual si hubo una excepción
            setExtendedTemplates((prevTemplates) =>
                prevTemplates.map((template) =>
                    template.id === templateId
                        ? { ...template, isLoadingToggle: false }
                        : template,
                ),
            )

            console.error(
                'Error al establecer el estado "enabled" de la plantilla:',
                error,
            )

            // Mostrar notificación de error
            showError('Error al procesar la solicitud. Por favor, inténtelo de nuevo más tarde.');
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
                // Verificar si es una plantilla predeterminada
                const isDefaultTemplate = selectedTemplate.id.startsWith('default-');

                if (isDefaultTemplate) {
                    console.log(`Activando plantilla predeterminada: ${selectedTemplate.name} (${selectedTemplate.id})`);

                    // Para plantillas predeterminadas, simplemente actualizamos el estado en la interfaz
                    // Actualizar plantilla activa en el store
                    setActiveTemplate(selectedTemplateId);

                    // Actualizar el estado local para reflejar que esta plantilla está activa
                    setExtendedTemplates((prevTemplates) =>
                        prevTemplates.map((template) => ({
                            ...template,
                            isActive: template.id === selectedTemplateId
                        }))
                    );

                    // Mostrar notificación de éxito
                    showSuccess(`Plantilla "${selectedTemplate.name}" activada como chatbot principal`);
                }
                // Si no es plantilla predeterminada, proceder con la lógica normal
                else {
                    // Obtener tenant_id de las cookies o usar el default
                    const cookieStore = document.cookie.split('; ').find(row => row.startsWith('tenant_id='));
                    const tenantId = cookieStore ? cookieStore.split('=')[1] : process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'default';
                    
                    // Llamar al servicio para activar/crear la activación de la plantilla
                    const { success, activationId, error } = await apiActivateTemplate(
                        selectedTemplateId,
                        tenantId
                    );

                    if (success) {
                        // Actualizar plantilla activa en el store
                        setActiveTemplate(selectedTemplateId);

                        // Actualizar el estado local para reflejar que esta plantilla está activa
                        setExtendedTemplates((prevTemplates) =>
                            prevTemplates.map((template) => ({
                                ...template,
                                isActive: template.id === selectedTemplateId
                            }))
                        );

                        console.log(
                            `Plantilla ${selectedTemplateId} activada con ID de activación: ${activationId}`,
                        );
                        
                        // Mostrar notificación de éxito
                        showSuccess(`Plantilla "${selectedTemplate.name}" activada como chatbot principal`);
                    } else {
                        console.error(
                            `Error al activar la plantilla: ${error}`,
                        );
                        // Mostrar notificación de error
                        showError(`Error al activar la plantilla: ${error}`);
                        setLoading(false);
                        return; // No cerrar el modal en caso de error
                    }
                }
            } else if (selectedTemplate && !selectedTemplate.isEnabled) {
                showWarning(`La plantilla "${selectedTemplate.name}" está deshabilitada. Debe activarla primero utilizando el interruptor.`);
                setLoading(false);
                return; // No cerramos el modal para que pueda activarla
            } else {
                showWarning('Por favor, seleccione una plantilla válida para activar.');
                setLoading(false);
                return; // No cerramos el modal para que pueda seleccionar una
            }

            // Cerrar el modal solo si todo fue exitoso
            onClose()
        } catch (error) {
            console.error('Error al guardar configuración:', error)
            showError(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false)
        }
    }

    // No renderizamos en SSR para evitar errores de hidratación
    if (!isClient) {
        return null
    }

    // Componente para mostrar una plantilla individual
    const TemplateCard = ({ template }) => (
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
                        src={
                            template.avatarUrl ||
                            '/img/avatars/thumb-2.jpg'
                        }
                    />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <div className="font-medium text-xs">
                                {template.name}
                            </div>
                            {selectedTemplateId === template.id && (
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
                        {template.isEnabled
                            ? 'Plantilla activada'
                            : 'Activar plantilla'}
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
                                onChange={(checked) =>
                                    handleToggleTemplate(
                                        template.id,
                                        checked,
                                    )
                                }
                                size="sm"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Simplificamos la categorización de plantillas
    const isInCategory = (templateName, keywords) => {
        const name = templateName.toLowerCase();
        return keywords.some(keyword => name.includes(keyword));
    };

    // Keywords para cada categoría
    const salesKeywords = ['venta', 'mercadeo', 'marketing', 'oferta', 'promoción', 'lead', 'embudo'];
    const supportKeywords = ['atención', 'soporte', 'cliente', 'ayuda', 'consulta', 'servicio'];
    const appointmentKeywords = ['cita', 'agenda', 'programación', 'reprogramación'];
    
    // Nota: Movimos el useEffect que estaba aquí para evitar errores en el orden de hooks

    // Filtramos plantillas por categoría
    const salesTemplates = extendedTemplates.filter(template =>
        isInCategory(template.name, salesKeywords)
    );

    const supportTemplates = extendedTemplates.filter(template =>
        isInCategory(template.name, supportKeywords)
    );

    const appointmentTemplates = extendedTemplates.filter(template =>
        isInCategory(template.name, appointmentKeywords)
    );

    // Las que no caen en ninguna categoría definida
    const otherTemplates = extendedTemplates.filter(template =>
        !isInCategory(template.name, [...salesKeywords, ...supportKeywords, ...appointmentKeywords])
    );

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

                    <Radio.Group
                        value={selectedTemplateId}
                        onChange={handleTemplateChange}
                    >
                        <div className="space-y-6">
                            {/* Encabezados de categorías */}
                            <div className="grid grid-cols-3 gap-4 border-b pb-2">
                                <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Ventas y Marketing
                                </h6>
                                <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Gestión de Citas
                                </h6>
                                <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Otras Plantillas
                                </h6>
                            </div>

                            {/* Contenido de plantillas en filas */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Columna 1: Ventas y Marketing */}
                                <div className="space-y-4">
                                    {salesTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                        />
                                    ))}
                                    {salesTemplates.length === 0 && (
                                        <div className="text-center text-xs text-gray-500 p-3">
                                            No hay plantillas en esta categoría
                                        </div>
                                    )}
                                </div>

                                {/* Columna 2: Gestión de Citas */}
                                <div className="space-y-4">
                                    {appointmentTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                        />
                                    ))}
                                    {appointmentTemplates.length === 0 && (
                                        <div className="text-center text-xs text-gray-500 p-3">
                                            No hay plantillas en esta categoría
                                        </div>
                                    )}
                                </div>

                                {/* Columna 3: Combina Otras Plantillas y Atención al Cliente */}
                                <div className="space-y-4">
                                    {/* Primero mostrar otras plantillas */}
                                    {otherTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                        />
                                    ))}

                                    {/* Luego mostrar plantillas de atención al cliente */}
                                    {supportTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                        />
                                    ))}

                                    {otherTemplates.length === 0 && supportTemplates.length === 0 && (
                                        <div className="text-center text-xs text-gray-500 p-3">
                                            No hay plantillas en esta categoría
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mensaje cuando no hay plantillas */}
                            {extendedTemplates.length === 0 && (
                                <div className="py-6 text-center text-gray-500">
                                    No hay plantillas disponibles en este momento.
                                </div>
                            )}
                        </div>
                    </Radio.Group>
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
                    disabled={loading}
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