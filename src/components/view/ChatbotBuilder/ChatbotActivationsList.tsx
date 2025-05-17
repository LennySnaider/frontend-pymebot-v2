'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/ChatbotActivationsList.tsx
 * Componente para listar y gestionar activaciones de chatbot para un tenant
 * @version 1.1.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect } from 'react'
import { toast, Notification, Button } from '@/components/ui'
import { PiPlusBold, PiMagnifyingGlassBold, PiRobotBold, PiChatTextBold, PiGearBold, PiPowerBold, PiSpinnerGapBold, PiCheckCircleBold, PiWarningCircleBold, PiBugBold } from 'react-icons/pi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/services/supabase/SupabaseClient'
import chatbotTemplateService from '@/services/chatbot/chatbotTemplateService'

interface Activation {
    id: string
    template_id: string
    template_name: string
    is_active: boolean
    activated_at: string
    template_version: number
    vertical_name?: string
    last_updated?: string
    channels_count: number
}

interface ChatbotActivationsListProps {
    tenantId: string
    onActivate?: () => void
    onConfigure?: (activationId: string) => void
}

const ChatbotActivationsList: React.FC<ChatbotActivationsListProps> = ({
    tenantId,
    onActivate,
    onConfigure,
}) => {
    const [activations, setActivations] = useState<Activation[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [processing, setProcessing] = useState<string | null>(null) // ID of activation being processed

    // Cargar activaciones del tenant
    useEffect(() => {
        if (tenantId) {
            fetchActivations()
        }
    }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Función helper para mostrar notificaciones
    const showNotification = (message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info', title?: string) => {
        try {
            toast.push(
                <Notification title={title || (type === 'danger' ? 'Error' : type === 'success' ? 'Éxito' : 'Información')} type={type}>
                    {message}
                </Notification>
            )
        } catch (err) {
            console.error('Error al mostrar notificación:', err)
        }
    }

    // Obtener lista de activaciones
    const fetchActivations = async () => {
        try {
            setLoading(true)
            
            // Consulta inicial para verificar si el tenant existe
            const { data: tenantCheck, error: tenantError } = await supabase
                .from('tenants')
                .select('id')
                .eq('id', tenantId)
                .single()
            
            // Si hay error en la verificación del tenant, manejarlo
            if (tenantError) {
                console.warn('Problema al verificar tenant:', tenantError)
                // No lanzamos error para continuar con activaciones vacías
            }
            
            console.log('Consultando activaciones para tenant:', tenantId)
            
            // Validar que el tenant_id es un UUID válido para evitar errores
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)
            
            if (!isValidUUID) {
                console.error('El tenant_id no es un UUID válido:', tenantId)
                throw new Error('El tenant_id no es válido')
            }
            
            // Usamos el servicio modificado para obtener activaciones
            // Ahora la consulta evita hacer joins que puedan causar errores PGRST200
            try {
                const activationsData = await chatbotTemplateService.getTenantActivations(tenantId)
                
                // Consulta separada para las configuraciones
                let configData = []
                if (activationsData && activationsData.length > 0) {
                    const activationIds = activationsData.map(activation => activation.id)
                    const { data: configs, error: configError } = await supabase
                        .from('tenant_chatbot_configurations')
                        .select('id, activation_id, updated_at')
                        .in('activation_id', activationIds)
                    
                    if (!configError) {
                        configData = configs || []
                        console.log('Configuraciones obtenidas:', configData.length)
                    } else {
                        console.warn('Error al obtener configuraciones, se continuará con valores vacíos:', configError)
                    }
                } else {
                    console.log('No hay activaciones, omitiendo consulta de configuraciones')
                }
                
                // Obtener conteo de canales asociados a cada activación
                let channels = [];
                try {
                    const { data: channelsData, error: channelsError } = await supabase
                        .from('tenant_chatbot_channels')
                        .select('default_activation_id, id')
                        .eq('tenant_id', tenantId)
                        .eq('is_active', true)

                    if (channelsError) {
                        console.warn('Error al obtener canales, se continuará con valores vacíos:', channelsError)
                    } else {
                        channels = channelsData || []
                    }
                } catch (channelsQueryError) {
                    console.warn('Error en consulta de canales:', channelsQueryError)
                    // Continuar con channels vacío
                }

                // Contar canales por activación
                const channelCounts: Record<string, number> = {}
                channels?.forEach((channel) => {
                    if (channel.default_activation_id) {
                        channelCounts[channel.default_activation_id] =
                            (channelCounts[channel.default_activation_id] || 0) + 1
                    }
                })
                
                // Procesar datos para un formato más fácil de usar
                // Relacionar las configuraciones con sus activaciones
                const configurationsMap = {}
                configData.forEach(config => {
                    configurationsMap[config.activation_id] = config
                })
                
                const processedActivations = activationsData.map((item) => {
                    return {
                        id: item.id,
                        template_id: item.template_id,
                        template_name: item.template?.name || 'Plantilla desconocida',
                        is_active: item.is_active,
                        activated_at: item.activated_at,
                        template_version: item.template_version,
                        vertical_name: item.template?.vertical?.name,
                        last_updated: configurationsMap[item.id]?.updated_at,
                        channels_count: channelCounts[item.id] || 0,
                    }
                })

                setActivations(processedActivations)
                
            } catch (error) {
                console.error('Error al procesar activaciones:', error)
                showNotification(`Error al obtener activaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'danger')
                setActivations([]) // Inicializar con array vacío en caso de error
            }
        } catch (error) {
            console.error('Error fetching activations:', error)
            showNotification('Error al cargar las activaciones', 'danger')
            setActivations([]) // Asegurar que se inicialice
        } finally {
            setLoading(false)
        }
    }

    // Activar/Desactivar una plantilla
    const handleToggleActivation = async (
        activationId: string,
        currentStatus: boolean,
    ) => {
        try {
            setProcessing(activationId)

            const { error } = await supabase
                .from('tenant_chatbot_activations')
                .update({
                    is_active: !currentStatus,
                    // Si estamos activando, actualizar la fecha
                    ...(currentStatus
                        ? {}
                        : { activated_at: new Date().toISOString() }),
                })
                .eq('id', activationId)

            if (error) throw error

            // Actualizar estado local
            setActivations((prevActivations) =>
                prevActivations.map((activation) =>
                    activation.id === activationId
                        ? { ...activation, is_active: !currentStatus }
                        : activation,
                ),
            )

            showNotification(`Plantilla ${currentStatus ? 'desactivada' : 'activada'} correctamente`, 'success')
        } catch (error) {
            console.error('Error toggling activation:', error)
            showNotification(`Error al ${currentStatus ? 'desactivar' : 'activar'} la plantilla`, 'danger')
        } finally {
            setProcessing(null)
        }
    }

    // Formatear fecha en formato legible
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-'
        return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es })
    }

    // Filtrar activaciones según búsqueda y filtro
    const filteredActivations = activations.filter((activation) => {
        const matchesSearch = activation.template_name
            .toLowerCase()
            .includes(search.toLowerCase())

        const matchesStatus =
            filter === 'all' ||
            (filter === 'active' && activation.is_active) ||
            (filter === 'inactive' && !activation.is_active)

        return matchesSearch && matchesStatus
    })

    // Función para diagnosticar y arreglar plantillas
    const [diagnosing, setDiagnosing] = useState(false)
    const [diagnosticResult, setDiagnosticResult] = useState<null | {
        templates: number;
        published: number;
        withIssues: number;
        fixed: number;
    }>(null)

    const runTemplatesDiagnostic = async () => {
        try {
            setDiagnosing(true)
            
            // 1. Verificar todas las plantillas
            console.log('Iniciando diagnóstico de plantillas...')
            const templateResponse = await supabase
                .from('chatbot_templates')
                .select('id, name, status, is_deleted')
                .limit(100) // Limitar para evitar problemas con grandes conjuntos de datos
                
            if (templateResponse.error) {
                console.error('Error al obtener plantillas:', templateResponse.error)
                showNotification(`Error al obtener plantillas: ${templateResponse.error.message}`, 'danger')
                setDiagnosing(false)
                return
            }
            
            const allTemplates = templateResponse.data || []
            
            console.log('Diagnóstico - Encontradas:', allTemplates.length, 'plantillas')
            
            // 2. Contar las que tienen problemas
            const published = allTemplates.filter(t => t.status === 'published' && !t.is_deleted).length
            const withIssues = allTemplates.filter(t => t.status !== 'published' || t.is_deleted).length
            
            // 3. Arreglar los problemas
            let fixed = 0
            for (const template of allTemplates) {
                if (template.status !== 'published' || template.is_deleted) {
                    try {
                        console.log(`Intentando arreglar plantilla: ${template.name} (${template.id})`)
                        const success = await chatbotTemplateService.verifyAndFixTemplateStatus(template.id)
                        if (success) fixed++
                    } catch (err) {
                        console.warn(`Error al arreglar plantilla ${template.id}:`, err)
                    }
                }
            }
            
            // 4. Actualizar resultado
            setDiagnosticResult({
                templates: allTemplates.length,
                published,
                withIssues,
                fixed
            })
            
            // 5. Mostrar notificación siempre, incluso si no se arreglaron plantillas
            let message = fixed > 0 
                ? `Se arreglaron ${fixed} plantillas con problemas`
                : 'Diagnóstico completado. No se necesitaron arreglos'
                
            showNotification(message, 'success', 'Diagnóstico completado')
            
            // 6. Recargar activaciones si hubo cambios
            if (fixed > 0) {
                try {
                    await fetchActivations()
                } catch (fetchError) {
                    console.warn('Error al recargar activaciones:', fetchError)
                }
            }
        } catch (error) {
            console.error('Error en diagnóstico:', error)
            showNotification(`Error al diagnosticar plantillas: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'danger')
        } finally {
            setDiagnosing(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Panel de diagnóstico para desarrolladores */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <PiBugBold className="text-amber-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Herramientas de diagnóstico</span>
                    </div>
                    <Button
                        size="sm"
                        variant="default"
                        color="primary"
                        onClick={runTemplatesDiagnostic}
                        loading={diagnosing}
                    >
                        Diagnosticar plantillas
                    </Button>
                </div>
                
                {diagnosticResult && (
                    <div className="mt-3 text-xs text-gray-600 border border-gray-200 rounded p-2 bg-white">
                        <div className="flex items-center mb-1">
                            <span className="font-medium">Resultado del diagnóstico:</span>
                        </div>
                        <ul className="space-y-1 pl-5 list-disc">
                            <li>Total de plantillas: {diagnosticResult.templates}</li>
                            <li>Plantillas publicadas: {diagnosticResult.published}</li>
                            <li>Plantillas con problemas: {diagnosticResult.withIssues}</li>
                            <li>Plantillas arregladas: {diagnosticResult.fixed}</li>
                        </ul>
                    </div>
                )}
            </div>

            <div className="p-4 border-b border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Plantillas de Chatbot Activadas
                    </h2>
                    <button
                        onClick={onActivate}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <PiPlusBold className="-ml-0.5 mr-2 h-4 w-4" />
                        Activar nueva plantilla
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Búsqueda */}
                    <div className="col-span-1">
                        <label htmlFor="search" className="sr-only">
                            Buscar
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <PiMagnifyingGlassBold className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                id="search"
                                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Buscar por nombre de plantilla"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filtro de estado */}
                    <div className="col-span-1">
                        <label htmlFor="status-filter" className="sr-only">
                            Filtrar por estado
                        </label>
                        <select
                            id="status-filter"
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Activas</option>
                            <option value="inactive">Inactivas</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-10 px-4 text-center">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 w-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ) : filteredActivations.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                        <PiRobotBold className="h-12 w-12 text-gray-400 mx-auto" />
                        <p className="mt-3 text-sm text-gray-500">
                            No hay plantillas activadas
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Activa una plantilla para empezar a configurar tu
                            chatbot
                        </p>
                        <button
                            onClick={onActivate}
                            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            <PiPlusBold className="-ml-0.5 mr-2 h-4 w-4" />
                            Activar plantilla
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Plantilla
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Canales
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Estado
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Última actualización
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredActivations.map((activation) => (
                                <tr
                                    key={activation.id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {activation.template_name}
                                                </div>
                                                <div className="flex items-center mt-1">
                                                    {activation.vertical_name && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                                            {
                                                                activation.vertical_name
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        v
                                                        {
                                                            activation.template_version
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center">
                                            <PiChatTextBold className="h-4 w-4 text-gray-500 mr-1" />
                                            <span>
                                                {activation.channels_count}{' '}
                                                {activation.channels_count === 1
                                                    ? 'canal'
                                                    : 'canales'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Activado el{' '}
                                            {formatDate(
                                                activation.activated_at,
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                activation.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {activation.is_active
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {activation.last_updated
                                            ? formatDate(
                                                  activation.last_updated,
                                              )
                                            : 'No configurado'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() =>
                                                    onConfigure &&
                                                    onConfigure(activation.id)
                                                }
                                                className="text-primary hover:text-primary-dark"
                                                title="Configurar"
                                            >
                                                <PiGearBold className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleToggleActivation(
                                                        activation.id,
                                                        activation.is_active,
                                                    )
                                                }
                                                disabled={
                                                    processing === activation.id
                                                }
                                                className={`${
                                                    activation.is_active
                                                        ? 'text-red-600 hover:text-red-800'
                                                        : 'text-green-600 hover:text-green-800'
                                                } ${processing === activation.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={
                                                    activation.is_active
                                                        ? 'Desactivar'
                                                        : 'Activar'
                                                }
                                            >
                                                {processing ===
                                                activation.id ? (
                                                    <PiSpinnerGapBold className="h-5 w-5 animate-spin" />
                                                ) : activation.is_active ? (
                                                    <PiPowerBold className="h-5 w-5" />
                                                ) : (
                                                    <PiPowerBold className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default ChatbotActivationsList