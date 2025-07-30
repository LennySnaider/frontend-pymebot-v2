'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/SimplifiedChatbotConfig.tsx
 * Componente simplificado para configurar chatbots por parte del tenant
 * @version 1.5.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect } from 'react'
import { toast } from '@/components/ui/toast'
import { Notification, Tooltip } from '@/components/ui'
import { Tabs } from '@/components/ui'
import { Button, Input, FormItem, FormContainer, Select, Badge, Switcher } from '@/components/ui'
import { 
    PiCheckBold, 
    PiArrowCounterClockwiseBold, 
    PiXBold, 
    PiMicrophoneBold, 
    PiInfoBold,
    PiChatCircleTextBold,
    PiChatCircleDotsBold,
    PiSlidersHorizontalBold,
    PiEyeBold,
    PiStorefront,
    PiLink
} from 'react-icons/pi'
import chatbotTemplateService, { ChatbotActivation, ChatbotConfig } from '@/services/chatbot/chatbotTemplateService'
import { PiRobotDuotone, PiPaperPlaneTiltBold, PiMicrophoneDuotone, PiRobotBold, PiMicrophoneSlashBold } from 'react-icons/pi'
import VoiceConfigPanel from './VoiceConfigPanel'
import VoicePreview from './VoicePreview'
import useCurrentSession from '@/utils/hooks/useCurrentSession'
import { supabase } from '@/services/supabase/SupabaseClient'
import ConfigBusinessInfoLink from './ConfigBusinessInfoLink'

interface SimplifiedChatbotConfigProps {
    activationId: string
    onSave?: () => void
    onCancel?: () => void
}

// Tipo para la información del tenant
interface TenantInfo {
    name: string;
    logo_url?: string;
    primary_color?: string;
    description?: string;
}

const SimplifiedChatbotConfig: React.FC<SimplifiedChatbotConfigProps> = ({
    activationId,
    onSave,
    onCancel
}) => {
    // Estados
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activation, setActivation] = useState<ChatbotActivation | null>(null)
    const [config, setConfig] = useState<ChatbotConfig | null>(null)
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [configFields, setConfigFields] = useState<Array<{
        key: string,
        label: string,
        type: 'text' | 'textarea' | 'number' | 'select' | 'boolean',
        options?: Array<{ value: string, label: string }>,
        description?: string,
        placeholder?: string,
        defaultValue?: any,
        inheritedFromBusiness?: boolean
    }>>([])
    const [showTextPreview, setShowTextPreview] = useState(true)
    const [showVoicePreview, setShowVoicePreview] = useState(false)
    const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
    
    // Obtener sesión actual para el tenantId
    const { session } = useCurrentSession()
    const tenantId = session?.user?.tenant_id || 'current-tenant'
    
    // Cargar datos iniciales
    useEffect(() => {
        if (activationId) {
            loadActivationData()
            loadTenantInfo()
        }
    }, [activationId])
    
    // Determinar qué previsualizaciones mostrar
    useEffect(() => {
        if (formData) {
            // Si tiene reconocimiento de voz habilitado o configs específicas de voz,
            // mostrar preview de voice bot
            const hasVoiceEnabled = formData.enableVoice === true || 
                (formData.voice && Object.keys(formData.voice).length > 0);
            
            setShowVoicePreview(hasVoiceEnabled);
            
            // Por defecto, siempre mostramos la preview de texto
            // a menos que sea explícitamente solo de voz
            setShowTextPreview(true);
        }
    }, [formData]);
    
    // Cargar datos del tenant
    const loadTenantInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('name, logo_url, primary_color, description')
                .eq('id', tenantId)
                .single();
                
            if (error) {
                console.warn('Error al obtener información del tenant:', error);
                return;
            }
            
            if (data) {
                setTenantInfo(data);
                
                // Actualizar formData con los valores del tenant para los campos heredados
                setFormData(prev => ({
                    ...prev,
                    businessName: prev.businessName || data.name,
                    businessLogo: prev.businessLogo || data.logo_url,
                    primaryColor: prev.primaryColor || data.primary_color || '#3b82f6'
                }));
            }
        } catch (error) {
            console.error('Error al cargar info del tenant:', error);
        }
    };
    
    // Cargar datos de la activación y su configuración
    const loadActivationData = async () => {
        try {
            setLoading(true)
            console.log(`Cargando configuración para activación: ${activationId} (tenant: ${tenantId})`)
            
            // Intentar obtener la activación directamente de la base de datos por ID
            const { data: activationData, error: activationError } = await supabase
                .from('tenant_chatbot_activations')
                .select(`
                    *,
                    template:template_id (
                        name, 
                        description,
                        vertical_id
                    )
                `)
                .eq('id', activationId)
                .single()
            
            if (activationError) {
                console.error('Error al obtener activación directamente:', activationError)
                // Intentamos el enfoque alternativo
                
                // Obtenemos las activaciones para el tenant actual
                console.log(`Buscando activación ${activationId} en tenant: ${tenantId}`)
                const activations = await chatbotTemplateService.getTenantActivations(tenantId)
                console.log(`Activaciones encontradas: ${activations.length}`)
                
                // Buscar la activación específica por su ID
                const currentActivation = activations.find(a => a.id === activationId)
                
                if (!currentActivation) {
                    console.error(`Activación ${activationId} no encontrada en tenant ${tenantId}`)
                    console.log('Activaciones disponibles:', activations.map(a => a.id).join(', '))
                    
                    toast.push(
                        <Notification title="Error" type="danger">
                            No se encontró la activación seleccionada
                        </Notification>
                    )
                    return
                }
                
                setActivation(currentActivation)
            } else {
                // Tenemos la activación directamente de Supabase
                console.log('Activación obtenida directamente:', activationData)
                setActivation(activationData)
            }
            
            // Obtenemos la configuración actual
            const config = await chatbotTemplateService.getActivationConfig(activationId)
            setConfig(config)
            
            if (config?.config_data) {
                setFormData(config.config_data)
            }
            
            // Definimos los campos de configuración basados en la plantilla
            // Esto podría venir de la plantilla o estar predefinido según el tipo
            const templateFields = getConfigFieldsForTemplate(activation?.template_id || '')
            setConfigFields(templateFields)
            
            // Si hay campos con valores por defecto que no están en formData, los añadimos
            const initialFormData = { ...formData }
            templateFields.forEach(field => {
                if (field.defaultValue !== undefined && initialFormData[field.key] === undefined) {
                    initialFormData[field.key] = field.defaultValue
                }
            })
            
            setFormData(initialFormData)
        } catch (error) {
            console.error('Error al cargar datos:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Error al cargar la configuración: {error instanceof Error ? error.message : 'Error desconocido'}
                </Notification>
            )
        } finally {
            setLoading(false)
        }
    }
    
    // Esto sería ideal que viniera de la plantilla en el futuro
    const getConfigFieldsForTemplate = (templateId: string) => {
        // Por ahora usamos campos genéricos, pero esto debería 
        // personalizarse según la plantilla específica
        return [
            {
                key: 'welcomeMessage',
                label: 'Mensaje de bienvenida',
                type: 'textarea' as const,
                description: 'Mensaje que se mostrará al iniciar la conversación',
                placeholder: 'Ej: ¡Hola! Soy el asistente virtual de [Tu Negocio]. ¿En qué puedo ayudarte?',
                defaultValue: '¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?'
            },
            {
                key: 'businessName',
                label: 'Nombre del negocio',
                type: 'text' as const,
                description: 'Nombre de tu negocio que aparecerá en las conversaciones',
                placeholder: 'Ej: Inmobiliaria Ejemplo',
                inheritedFromBusiness: true
            },
            {
                key: 'businessLogo',
                label: 'URL del logo',
                type: 'text' as const,
                description: 'URL de la imagen que se usará como logo (opcional)',
                placeholder: 'https://ejemplo.com/logo.png',
                inheritedFromBusiness: true
            },
            {
                key: 'primaryColor',
                label: 'Color principal',
                type: 'text' as const,
                description: 'Color principal en formato hexadecimal',
                placeholder: '#3b82f6',
                defaultValue: '#3b82f6',
                inheritedFromBusiness: true
            },
            {
                key: 'responseDelay',
                label: 'Retraso en respuestas (ms)',
                type: 'number' as const,
                description: 'Tiempo de espera antes de mostrar respuestas (para simular escritura)',
                defaultValue: 1000
            },
            {
                key: 'botPersonality',
                label: 'Personalidad del bot',
                type: 'select' as const,
                description: 'Define el estilo comunicativo del asistente',
                options: [
                    { value: 'professional', label: 'Profesional' },
                    { value: 'friendly', label: 'Amigable' },
                    { value: 'casual', label: 'Casual' },
                    { value: 'formal', label: 'Formal' }
                ],
                defaultValue: 'professional'
            },
            {
                key: 'enableVoice',
                label: 'Habilitar reconocimiento de voz',
                type: 'boolean' as const,
                description: 'Permite a los usuarios hablar con el chatbot',
                defaultValue: false
            }
        ]
    }
    
    // Manejar cambios en el formulario
    const handleInputChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }))
        
        // Si estamos cambiando la opción de voz, actualizar la visualización
        if (key === 'enableVoice') {
            setShowVoicePreview(value === true)
        }
    }
    
    // Guardar la configuración
    const handleSave = async () => {
        try {
            setSaving(true)
            
            // Validar datos aquí si es necesario
            
            const success = await chatbotTemplateService.updateActivationConfig(
                activationId,
                formData
            )
            
            if (success) {
                toast.push(
                    <Notification title="Éxito" type="success">
                        Configuración guardada correctamente
                    </Notification>
                )
                if (onSave) onSave()
            } else {
                toast.push(
                    <Notification title="Error" type="danger">
                        Error al guardar la configuración
                    </Notification>
                )
            }
        } catch (error) {
            console.error('Error al guardar:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Error al guardar los cambios
                </Notification>
            )
        } finally {
            setSaving(false)
        }
    }
    
    // Guardar la configuración de voz
    const handleSaveVoiceConfig = (voiceConfig: any) => {
        // Integrar la configuración de voz con la configuración general
        setFormData(prev => ({
            ...prev,
            voice: voiceConfig
        }))
        
        // Mostrar la vista previa de voz
        setShowVoicePreview(true)
        
        // Salvar inmediatamente o esperar a que el usuario guarde manualmente
        handleSave()
    }
    
    // Renderizar campo según su tipo
    const renderField = (field: typeof configFields[0]) => {
        // Si el campo es heredado, mostrar una UI diferente
        const isInherited = field.inheritedFromBusiness && tenantInfo;
        
        const inheritedValue = isInherited ? (
            field.key === 'businessName' ? tenantInfo?.name :
            field.key === 'businessLogo' ? tenantInfo?.logo_url :
            field.key === 'primaryColor' ? tenantInfo?.primary_color : ''
        ) : undefined;
        
        const hasOverride = isInherited && formData[field.key] !== inheritedValue && formData[field.key];
        
        switch (field.type) {
            case 'textarea':
                return (
                    <FormItem
                        key={field.key}
                        label={
                            <div className="flex items-center">
                                {field.label}
                                {isInherited && (
                                    <Tooltip title="Este valor se hereda de la configuración general del negocio, pero puedes personalizarlo para este chatbot">
                                        <span className="ml-1.5 text-gray-400 hover:text-gray-600 cursor-help">
                                            <PiInfoBold size={14} />
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        }
                        labelClass="font-medium mb-1.5"
                        extra={field.description}
                    >
                        <div className="space-y-2">
                            <Input
                                textArea
                                placeholder={field.placeholder}
                                value={formData[field.key] || ''}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                rows={3}
                            />
                            
                            {isInherited && !hasOverride && inheritedValue && (
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <PiStorefront className="mr-1.5 text-gray-400" />
                                    Usando valor de la empresa: <span className="font-medium ml-1">&quot;{inheritedValue}&quot;</span>
                                </div>
                            )}
                            
                            {hasOverride && (
                                <div className="flex items-center text-xs text-amber-600 mt-1">
                                    <PiInfoBold className="mr-1.5" />
                                    Valor personalizado para este chatbot
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        className="ml-2 text-blue-600"
                                        onClick={() => handleInputChange(field.key, inheritedValue)}
                                    >
                                        Restaurar valor de empresa
                                    </Button>
                                </div>
                            )}
                        </div>
                    </FormItem>
                )
            
            case 'select':
                return (
                    <FormItem
                        key={field.key}
                        label={field.label}
                        labelClass="font-medium mb-1.5"
                        extra={field.description}
                    >
                        <Select
                            options={field.options || []}
                            value={formData[field.key] || ''}
                            onChange={(value) => handleInputChange(field.key, value)}
                        />
                    </FormItem>
                )
            
            case 'boolean':
                return (
                    <FormItem
                        key={field.key}
                        label={field.label}
                        labelClass="font-medium mb-1.5"
                        extra={field.description}
                    >
                        <Switcher
                            checked={formData[field.key] === true}
                            onChange={(checked) => handleInputChange(field.key, checked)}
                        />
                    </FormItem>
                )
            
            case 'number':
                return (
                    <FormItem
                        key={field.key}
                        label={field.label}
                        labelClass="font-medium mb-1.5"
                        extra={field.description}
                    >
                        <Input
                            type="number"
                            placeholder={field.placeholder}
                            value={formData[field.key] || ''}
                            onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
                        />
                    </FormItem>
                )
            
            case 'text':
            default:
                return (
                    <FormItem
                        key={field.key}
                        label={
                            <div className="flex items-center">
                                {field.label}
                                {isInherited && (
                                    <Tooltip title="Este valor se hereda de la configuración general del negocio, pero puedes personalizarlo para este chatbot">
                                        <span className="ml-1.5 text-gray-400 hover:text-gray-600 cursor-help">
                                            <PiInfoBold size={14} />
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        }
                        labelClass="font-medium mb-1.5"
                        extra={field.description}
                    >
                        <div className="space-y-2">
                            <Input
                                placeholder={field.placeholder}
                                value={formData[field.key] || ''}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                suffix={
                                    field.key === 'businessLogo' && formData[field.key] ? (
                                        <a 
                                            href={formData[field.key]} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            <PiLink />
                                        </a>
                                    ) : undefined
                                }
                            />
                            
                            {isInherited && !hasOverride && inheritedValue && (
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <PiStorefront className="mr-1.5 text-gray-400" />
                                    Usando valor de la empresa: <span className="font-medium ml-1">&quot;{inheritedValue}&quot;</span>
                                </div>
                            )}
                            
                            {hasOverride && (
                                <div className="flex items-center text-xs text-amber-600 mt-1">
                                    <PiInfoBold className="mr-1.5" />
                                    Valor personalizado para este chatbot
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        className="ml-2 text-blue-600"
                                        onClick={() => handleInputChange(field.key, inheritedValue)}
                                    >
                                        Restaurar valor de empresa
                                    </Button>
                                </div>
                            )}
                        </div>
                    </FormItem>
                )
        }
    }
    
    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }
    
    if (!activation) {
        return (
            <div className="p-6 text-center">
                <PiRobotBold className="h-12 w-12 mx-auto text-gray-400" />
                <div className="mt-4 text-gray-500">
                    <p className="mb-2">No se encontró la plantilla seleccionada</p>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mx-auto max-w-md mt-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <PiInfoBold className="h-5 w-5 text-amber-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-amber-800">
                                    Información de diagnóstico
                                </h3>
                                <div className="mt-2 text-sm text-amber-700">
                                    <p className="mb-1">ID de activación buscado: <code className="px-1 py-0.5 bg-amber-100 rounded text-xs">{activationId}</code></p>
                                    <p className="mb-1">Tenant actual: <code className="px-1 py-0.5 bg-amber-100 rounded text-xs">{tenantId}</code></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {onCancel && (
                    <Button
                        className="mt-4"
                        variant="twoTone"
                        color="red"
                        onClick={onCancel}
                    >
                        Volver
                    </Button>
                )}
            </div>
        )
    }
    
    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        Configuración: {activation.template?.name || 'Plantilla'}
                    </h2>
                    <div className="flex mt-1">
                        {showTextPreview && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2 flex items-center">
                                <PiChatCircleTextBold className="mr-1" /> Chat de texto
                            </span>
                        )}
                        {showVoicePreview && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                                <PiMicrophoneBold className="mr-1" /> Voice Bot
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="plain"
                        color="blue"
                        icon={<PiArrowCounterClockwiseBold className="text-lg" />}
                        onClick={loadActivationData}
                    >
                        Recargar
                    </Button>
                    <Button
                        size="sm"
                        variant="twoTone"
                        color="red"
                        icon={<PiXBold className="text-lg" />}
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        color="primary"
                        icon={<PiCheckBold className="text-lg" />}
                        onClick={handleSave}
                        loading={saving}
                    >
                        Guardar
                    </Button>
                </div>
            </div>
            
            <Tabs defaultValue="general">
                <div className="px-4 border-b border-gray-200">
                    <Tabs.TabNav 
                        value="general" 
                        label="General" 
                        icon={<PiChatCircleDotsBold />}
                    />
                    <Tabs.TabNav 
                        value="voice" 
                        label="Voz" 
                        icon={<PiMicrophoneBold />}
                    />
                    <Tabs.TabNav 
                        value="advanced" 
                        label="Avanzado" 
                        icon={<PiSlidersHorizontalBold />}
                    />
                    <Tabs.TabNav 
                        value="preview" 
                        label="Vista previa" 
                        icon={<PiEyeBold />}
                    />
                </div>
                
                <div className="p-4">
                    <Tabs.TabContent value="general">
                        <div className="mb-4">
                            {/* Enlace a configuración de empresa */}
                            <ConfigBusinessInfoLink className="mb-6" />
                            
                            <p className="text-sm text-gray-500 mb-4">
                                Configuración general del chatbot. Estos valores se aplicarán a todos los canales donde esté activo.
                            </p>
                            
                            <FormContainer>
                                {configFields
                                    .filter(field => !['enableVoice', 'responseDelay', 'botPersonality'].includes(field.key))
                                    .map(renderField)}
                            </FormContainer>
                        </div>
                    </Tabs.TabContent>

                    <Tabs.TabContent value="voice">
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <div className="flex items-center">
                                    <Tooltip title="El reconocimiento de voz permite a los usuarios interactuar con el chatbot hablando en lugar de escribir mensajes">
                                        <span className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                                            <PiMicrophoneBold className="text-lg" />
                                        </span>
                                    </Tooltip>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">Funcionalidades de voz</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">Permite a los usuarios hablar con el chatbot</p>
                                    </div>
                                </div>
                                <Switcher
                                    checked={formData.enableVoice === true}
                                    onChange={(checked) => handleInputChange('enableVoice', checked)}
                                />
                            </div>
                            
                            {formData.enableVoice ? (
                                <VoiceConfigPanel
                                    activationId={activationId}
                                    initialConfig={formData.voice || {
                                        botName: formData.businessName || 'Customer Service Agent',
                                        welcomeMessage: formData.welcomeMessage || 'Por favor, envía un mensaje de voz...',
                                        primaryColor: formData.primaryColor || '#1e6f50',
                                        textColor: '#ffffff',
                                        enableVoiceResponse: true
                                    }}
                                    onSave={handleSaveVoiceConfig}
                                />
                            ) : (
                                <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
                                    <PiMicrophoneSlashBold className="h-12 w-12 mx-auto text-gray-400" />
                                    <p className="mt-3 text-sm text-gray-500">
                                        Las funciones de voz están desactivadas
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Activa la opción de voz para configurar esta sección
                                    </p>
                                </div>
                            )}
                        </div>
                    </Tabs.TabContent>
                    
                    <Tabs.TabContent value="advanced">
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-4">
                                Configuración avanzada del chatbot. Estos ajustes afectan al comportamiento y rendimiento.
                            </p>
                            
                            <FormContainer>
                                {configFields
                                    .filter(field => ['responseDelay', 'botPersonality'].includes(field.key))
                                    .map(renderField)}
                            </FormContainer>
                        </div>
                    </Tabs.TabContent>
                    
                    <Tabs.TabContent value="preview">
                        <div className="mb-4">
                            {/* Controles para elegir qué previsualizaciones mostrar */}
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-medium text-sm text-gray-700">Previsualizaciones disponibles</h3>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showTextPreview}
                                            onChange={(e) => setShowTextPreview(e.target.checked)}
                                            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                                            <PiChatCircleTextBold className="mr-1 text-blue-500" /> 
                                            Chat de texto
                                        </span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showVoicePreview}
                                            onChange={(e) => setShowVoicePreview(e.target.checked)}
                                            className="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                                            <PiMicrophoneBold className="mr-1 text-green-500" /> 
                                            Voice Bot
                                        </span>
                                    </label>
                                </div>
                            </div>
                            
                            {/* Contenedor de previsualizaciones */}
                            <div className={`grid gap-6 ${showTextPreview && showVoicePreview ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {showTextPreview && (
                                    <div>
                                        <h3 className="font-medium mb-3 flex items-center text-sm text-gray-700">
                                            <PiChatCircleTextBold className="mr-2 text-blue-500" />
                                            Chat de texto
                                        </h3>
                                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                            <div className="bg-primary text-white p-3 flex items-center">
                                                <PiRobotBold className="h-5 w-5 mr-2" />
                                                <span>{formData.businessName || 'Asistente Virtual'}</span>
                                            </div>
                                            
                                            <div className="h-64 p-3 overflow-y-auto">
                                                <div className="flex items-start mb-3">
                                                    <div className="bg-primary text-white rounded-lg p-2 px-3 max-w-[80%]">
                                                        {formData.welcomeMessage || '¡Hola! ¿En qué puedo ayudarte?'}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-start justify-end mb-3">
                                                    <div className="bg-gray-200 rounded-lg p-2 px-3 max-w-[80%]">
                                                        Hola, estoy interesado en sus servicios.
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-start mb-3">
                                                    <div className="bg-primary text-white rounded-lg p-2 px-3 max-w-[80%]">
                                                        ¡Excelente! Estamos encantados de poder ayudarte. ¿Qué información específica necesitas?
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="border-t border-gray-200 p-2 flex">
                                                {formData.enableVoice && (
                                                    <Tooltip title="Permite a los usuarios enviar mensajes de voz">
                                                        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                                                            <PiMicrophoneBold className="h-5 w-5" />
                                                        </button>
                                                    </Tooltip>
                                                )}
                                                <input 
                                                    type="text" 
                                                    className="flex-1 mx-2 p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                                    placeholder="Escribe un mensaje..."
                                                    disabled
                                                />
                                                <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                                                    <PiPaperPlaneTiltBold className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showVoicePreview && (
                                    <div>
                                        <h3 className="font-medium mb-3 flex items-center text-sm text-gray-700">
                                            <PiMicrophoneBold className="mr-2 text-green-500" />
                                            Voice Bot
                                            {!formData.enableVoice && (
                                                <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded">
                                                    No activado
                                                </span>
                                            )}
                                        </h3>
                                        <VoicePreview
                                            config={{
                                                botName: formData.voice?.botName || formData.businessName || 'Customer Service Agent',
                                                welcomeMessage: formData.voice?.welcomeMessage || formData.welcomeMessage || 'Por favor, envía un mensaje de voz...',
                                                primaryColor: formData.voice?.primaryColor || formData.primaryColor || '#1e6f50',
                                                secondaryColor: formData.voice?.secondaryColor || '#2a8868',
                                                textColor: formData.voice?.textColor || '#ffffff'
                                            }}
                                        />
                                        {!formData.enableVoice && (
                                            <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded flex items-center">
                                                <PiInfoBold className="mr-1 flex-shrink-0" />
                                                <span>
                                                    Para habilitar esta funcionalidad, activa la opción &quot;Habilitar reconocimiento de voz&quot; en la pestaña Voz.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {!showTextPreview && !showVoicePreview && (
                                <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
                                    <PiEyeBold className="h-12 w-12 mx-auto text-gray-400" />
                                    <p className="mt-3 text-gray-500">Selecciona al menos una visualización para ver la preview</p>
                                </div>
                            )}
                        </div>
                    </Tabs.TabContent>
                </div>
            </Tabs>
        </div>
    )
}

export default SimplifiedChatbotConfig