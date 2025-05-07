/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_components/ModuleLimitsModal.tsx
 * Modal para configurar límites específicos de módulo por plan
 * @version 1.1.0
 * @updated 2025-06-05
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, Input, Button, Spinner, Avatar, toast, Notification, Select, Tooltip, Badge } from '@/components/ui'
import NumericInput from '@/components/shared/NumericInput'
import { PiWarningCircleFill, PiCheck, PiSliders, PiInfoBold, PiPlusBold, PiTrashBold, PiQuestionBold } from 'react-icons/pi'
import { Plan, PlanModule, usePlansStore } from '../_store/plansStore'
import { Module, useModulesStore } from '../_store/modulesStore'
import { useTranslations } from 'next-intl'

interface ModuleLimitsModalProps {
    isOpen: boolean
    onClose: () => void
    plan: Plan | null
    moduleId: string | null
    moduleName?: string
}

// Interfaz para los límites configurables por módulo
interface ModuleLimits {
    // Límites generales
    max_records?: number
    max_api_calls_daily?: number
    max_storage_mb?: number
    
    // Límites específicos por módulo
    max_active_appointments?: number     // Para módulo de citas
    max_users_module?: number            // Para control de usuarios por módulo
    concurrent_sessions?: number         // Para sesiones simultáneas
    max_custom_fields?: number           // Para campos personalizables
    retention_days?: number              // Para retención de datos
    
    // Características que se pueden activar/desactivar
    advanced_features_enabled?: boolean  // Para habilitar características avanzadas
    api_access?: boolean                 // Para acceso a la API
    export_enabled?: boolean             // Para habilitar exportación
    bulk_operations?: boolean            // Para operaciones en lote
    priority_support?: boolean           // Para soporte prioritario
    
    // Restricciones por tipo de vertical (especialmente medicina, legal, etc.)
    module_level?: 'basic' | 'advanced' | 'premium' // Nivel de funcionalidad
    max_files_size_mb?: number          // Tamaño máximo para archivos
    max_templates?: number              // Máximas plantillas por tenant
    enable_ai_features?: boolean        // Habilitar características de IA
    max_reports?: number                // Reportes máximos
}

// Tipos predefinidos de límites
const LIMIT_TYPES = {
    // Límites generales
    'max_records': { 
        label: 'Máximo de registros', 
        type: 'number', 
        min: 0,
        description: 'Número máximo de registros que se pueden almacenar en este módulo',
        category: 'general'
    },
    'max_api_calls_daily': { 
        label: 'Llamadas API diarias', 
        type: 'number', 
        min: 0,
        description: 'Número máximo de llamadas a la API permitidas por día',
        category: 'api'
    },
    'max_storage_mb': { 
        label: 'Almacenamiento (MB)', 
        type: 'number', 
        min: 0,
        description: 'Espacio máximo de almacenamiento en MB para este módulo',
        category: 'general'
    },
    
    // Límites específicos
    'max_active_appointments': { 
        label: 'Citas activas máximas', 
        type: 'number', 
        min: 0,
        description: 'Número máximo de citas activas que pueden tener en un momento dado',
        category: 'specific',
        applicableModules: ['appointment']
    },
    'max_users_module': { 
        label: 'Usuarios por módulo', 
        type: 'number', 
        min: 1,
        description: 'Número máximo de usuarios que pueden acceder a este módulo',
        category: 'users'
    },
    'concurrent_sessions': { 
        label: 'Sesiones simultáneas', 
        type: 'number', 
        min: 1,
        description: 'Número máximo de sesiones simultáneas permitidas',
        category: 'users'
    },
    'max_custom_fields': { 
        label: 'Campos personalizados', 
        type: 'number', 
        min: 0,
        description: 'Número máximo de campos personalizados que se pueden crear',
        category: 'general'
    },
    'retention_days': { 
        label: 'Días de retención', 
        type: 'number', 
        min: 1,
        description: 'Días que se conservan los datos antes de ser archivados o eliminados',
        category: 'general'
    },
    
    // Características activables
    'advanced_features_enabled': { 
        label: 'Características avanzadas', 
        type: 'boolean',
        description: 'Habilita funcionalidades adicionales más avanzadas',
        category: 'features'
    },
    'api_access': { 
        label: 'Acceso API', 
        type: 'boolean',
        description: 'Permite el acceso a la API para este módulo',
        category: 'api'
    },
    'export_enabled': { 
        label: 'Exportación habilitada', 
        type: 'boolean',
        description: 'Permite exportar datos desde este módulo',
        category: 'features'
    },
    'bulk_operations': { 
        label: 'Operaciones masivas', 
        type: 'boolean',
        description: 'Permite realizar operaciones en lote o masivas',
        category: 'features'
    },
    'priority_support': { 
        label: 'Soporte prioritario', 
        type: 'boolean',
        description: 'Acceso a soporte técnico prioritario',
        category: 'support'
    },
    
    // Nuevos límites
    'module_level': {
        label: 'Nivel del módulo',
        type: 'select',
        options: [
            { value: 'basic', label: 'Básico' },
            { value: 'advanced', label: 'Avanzado' },
            { value: 'premium', label: 'Premium' }
        ],
        description: 'Define el nivel de funcionalidades disponibles en este módulo',
        category: 'general'
    },
    'max_files_size_mb': {
        label: 'Tamaño máximo de archivos (MB)',
        type: 'number',
        min: 1,
        description: 'Tamaño máximo permitido para archivos adjuntos en MB',
        category: 'storage'
    },
    'max_templates': {
        label: 'Plantillas máximas',
        type: 'number',
        min: 0,
        description: 'Número máximo de plantillas personalizadas que puede crear el usuario',
        category: 'templates'
    },
    'enable_ai_features': {
        label: 'Características de IA',
        type: 'boolean',
        description: 'Habilita funcionalidades de Inteligencia Artificial',
        category: 'features'
    },
    'max_reports': {
        label: 'Reportes personalizados',
        type: 'number',
        min: 0,
        description: 'Número máximo de reportes personalizados que puede crear',
        category: 'reports'
    }
}

// Categorías de límites para mejor organización en la UI
const LIMIT_CATEGORIES = {
    'general': { label: 'General', icon: <PiInfoBold className="text-blue-500" /> },
    'api': { label: 'API', icon: <PiInfoBold className="text-purple-500" /> },
    'users': { label: 'Usuarios', icon: <PiInfoBold className="text-green-500" /> },
    'features': { label: 'Características', icon: <PiInfoBold className="text-amber-500" /> },
    'support': { label: 'Soporte', icon: <PiInfoBold className="text-red-500" /> },
    'storage': { label: 'Almacenamiento', icon: <PiInfoBold className="text-indigo-500" /> },
    'templates': { label: 'Plantillas', icon: <PiInfoBold className="text-teal-500" /> },
    'reports': { label: 'Reportes', icon: <PiInfoBold className="text-orange-500" /> },
    'specific': { label: 'Específicos', icon: <PiInfoBold className="text-gray-500" /> }
}

// Obtener límites predefinidos según el tipo de módulo
const getDefaultLimitsForModule = (moduleCode: string): Record<string, any> => {
    switch (moduleCode) {
        case 'appointment':
            return {
                max_active_appointments: 100,
                max_records: 1000,
                concurrent_sessions: 5,
                retention_days: 90,
                export_enabled: true,
                module_level: 'basic'
            }
        case 'crm':
            return {
                max_records: 2000,
                max_custom_fields: 10,
                bulk_operations: true,
                export_enabled: true,
                module_level: 'basic'
            }
        case 'calendar':
            return {
                max_records: 500,
                concurrent_sessions: 3,
                module_level: 'basic'
            }
        case 'products':
            return {
                max_records: 1000,
                max_custom_fields: 5,
                export_enabled: true,
                module_level: 'basic'
            }
        case 'chat':
            return {
                max_api_calls_daily: 1000,
                retention_days: 60,
                concurrent_sessions: 10,
                module_level: 'basic',
                enable_ai_features: false
            }
        case 'medical_records':
            return {
                max_records: 2000,
                max_storage_mb: 5000,
                retention_days: 1825, // 5 años para registros médicos
                export_enabled: true,
                module_level: 'advanced',
                max_templates: 10
            }
        case 'sales':
            return {
                max_records: 3000,
                max_custom_fields: 15,
                bulk_operations: true,
                export_enabled: true,
                module_level: 'advanced',
                max_reports: 5
            }
        default:
            return {
                max_records: 1000,
                concurrent_sessions: 3,
                export_enabled: true,
                module_level: 'basic'
            }
    }
}

// Función para verificar si un límite es aplicable a un módulo específico
const isLimitApplicableToModule = (limitKey: string, moduleCode: string): boolean => {
    const limitConfig = LIMIT_TYPES[limitKey as keyof typeof LIMIT_TYPES]
    
    // Si no tiene restricción de módulos, es aplicable a todos
    if (!limitConfig.applicableModules) return true
    
    // Verificar si el módulo está en la lista de aplicables
    return limitConfig.applicableModules.includes(moduleCode)
}

// Componente principal
const ModuleLimitsModal = ({ isOpen, onClose, plan, moduleId, moduleName = 'Módulo' }: ModuleLimitsModalProps) => {
    const t = useTranslations('common')
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [limitsModified, setLimitsModified] = useState(false)
    const [currentLimits, setCurrentLimits] = useState<ModuleLimits>({})
    const [selectedLimitType, setSelectedLimitType] = useState<string>('')
    const [moduleDetails, setModuleDetails] = useState<PlanModule | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    
    const { 
        planModules, 
        updatePlanModule,
        fetchPlanModules 
    } = usePlansStore()
    
    const { modules } = useModulesStore()
    
    // Obtener el código del módulo actual
    const currentModuleCode = moduleDetails?.module?.code || ''
    
    // Cargar datos del módulo cuando se abre el modal
    useEffect(() => {
        const loadModuleData = async () => {
            if (!plan || !moduleId) return
            
            setLoading(true)
            try {
                // Si no tenemos los módulos del plan, cargarlos
                if (!planModules[plan.id]) {
                    await fetchPlanModules(plan.id)
                }
                
                // Buscar el módulo específico
                const modules = planModules[plan.id] || []
                const moduleData = modules.find(m => m.module_id === moduleId)
                
                if (moduleData) {
                    setModuleDetails(moduleData)
                    
                    // Extraer los límites actuales o inicializar con valores predeterminados
                    const moduleLimits = moduleData.limits || {}
                    const moduleCode = moduleData.module?.code || ''
                    
                    // Si no hay límites configurados, usar los predeterminados
                    if (Object.keys(moduleLimits).length === 0 && moduleCode) {
                        const defaultLimits = getDefaultLimitsForModule(moduleCode)
                        setCurrentLimits(defaultLimits)
                        setLimitsModified(true) // Marcar como modificado para que se pueda guardar
                    } else {
                        setCurrentLimits(moduleLimits)
                        setLimitsModified(false)
                    }
                }
            } catch (error) {
                console.error('Error loading module data:', error)
                toast.push(
                    <Notification title="Error" type="danger">
                        Error al cargar datos del módulo
                    </Notification>
                )
            } finally {
                setLoading(false)
            }
        }
        
        if (isOpen) {
            loadModuleData()
            setSelectedCategory(null)
            setSearchQuery('')
        }
    }, [isOpen, plan, moduleId, planModules, fetchPlanModules])
    
    // Guardar los cambios en los límites
    const saveLimits = async () => {
        if (!plan || !moduleId || !moduleDetails) return
        
        setSaving(true)
        try {
            await updatePlanModule(moduleDetails.id, {
                limits: currentLimits
            })
            
            toast.push(
                <Notification title="Éxito" type="success">
                    Límites actualizados correctamente
                </Notification>
            )
            
            setLimitsModified(false)
            onClose()
        } catch (error) {
            console.error('Error saving limits:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Error al guardar los límites
                </Notification>
            )
        } finally {
            setSaving(false)
        }
    }
    
    // Añadir un nuevo tipo de límite
    const addLimitType = () => {
        if (!selectedLimitType || currentLimits[selectedLimitType as keyof ModuleLimits] !== undefined) return
        
        const limitInfo = LIMIT_TYPES[selectedLimitType as keyof typeof LIMIT_TYPES]
        let initialValue: any;
        
        if (limitInfo.type === 'boolean') {
            initialValue = false
        } else if (limitInfo.type === 'select' && limitInfo.options) {
            initialValue = limitInfo.options[0].value
        } else {
            initialValue = limitInfo.min || 0
        }
        
        setCurrentLimits(prev => ({
            ...prev,
            [selectedLimitType]: initialValue
        }))
        
        setSelectedLimitType('')
        setLimitsModified(true)
    }
    
    // Actualizar un límite existente
    const updateLimit = (key: string, value: any) => {
        setCurrentLimits(prev => ({
            ...prev,
            [key]: value
        }))
        
        setLimitsModified(true)
    }
    
    // Eliminar un límite
    const removeLimit = (key: string) => {
        const updatedLimits = { ...currentLimits }
        delete updatedLimits[key as keyof ModuleLimits]
        
        setCurrentLimits(updatedLimits)
        setLimitsModified(true)
    }
    
    // Función para filtrar las opciones disponibles
    const filterLimitOptions = () => {
        let options = Object.entries(LIMIT_TYPES)
            // Filtrar las que ya están configuradas
            .filter(([key]) => currentLimits[key as keyof ModuleLimits] === undefined)
            // Filtrar por aplicabilidad al módulo si tenemos código de módulo
            .filter(([key]) => !currentModuleCode || isLimitApplicableToModule(key, currentModuleCode))
            
        // Filtrar por categoría si hay una seleccionada
        if (selectedCategory) {
            options = options.filter(([_, config]) => config.category === selectedCategory)
        }
        
        // Filtrar por búsqueda si hay texto
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            options = options.filter(([key, config]) => 
                config.label.toLowerCase().includes(query) || 
                key.toLowerCase().includes(query) || 
                (config.description && config.description.toLowerCase().includes(query))
            )
        }
        
        return options.map(([key, config]) => ({
            value: key,
            label: config.label
        }))
    }
    
    // Opciones disponibles para añadir (filtradas)
    const availableLimitOptions = filterLimitOptions()
    
    // Agrupar límites configurados por categoría para mejor visualización
    const groupedCurrentLimits = Object.entries(currentLimits).reduce((acc, [key, value]) => {
        const limitConfig = LIMIT_TYPES[key as keyof typeof LIMIT_TYPES]
        if (!limitConfig) return acc
        
        const category = limitConfig.category || 'general'
        if (!acc[category]) acc[category] = []
        
        acc[category].push({ key, value, config: limitConfig })
        return acc
    }, {} as Record<string, { key: string, value: any, config: any }[]>)
    
    // Restablecer a valores predeterminados
    const resetToDefaults = () => {
        if (!moduleDetails?.module?.code) return
        
        const defaultLimits = getDefaultLimitsForModule(moduleDetails.module.code)
        setCurrentLimits(defaultLimits)
        setLimitsModified(true)
    }
    
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            contentClassName="max-w-3xl"
        >
            <h5 className="mb-4 flex items-center">
                <PiSliders className="text-lg mr-2" /> 
                Configuración de Límites: {moduleName}
            </h5>
            
            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <Spinner size={40} />
                </div>
            ) : (
                <>
                    {/* Header con acciones */}
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex-grow">
                            <Input
                                prefix={<PiQuestionBold className="text-gray-500"/>}
                                placeholder="Buscar límite..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-xs"
                            />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Tooltip title="Restablecer valores predeterminados">
                                <Button
                                    size="sm"
                                    variant="plain"
                                    onClick={resetToDefaults}
                                >
                                    Valores predeterminados
                                </Button>
                            </Tooltip>
                            
                            <div className="flex space-x-2 ml-2">
                                <Select
                                    placeholder="Añadir límite..."
                                    options={availableLimitOptions}
                                    value={selectedLimitType}
                                    onChange={(val) => setSelectedLimitType(val as string)}
                                    className="min-w-[200px]"
                                />
                                <Button
                                    size="sm"
                                    variant="solid"
                                    onClick={addLimitType}
                                    disabled={!selectedLimitType}
                                    icon={<PiPlusBold />}
                                >
                                    Añadir
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Filtro por categorías */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        <Badge 
                            className={`cursor-pointer ${selectedCategory === null ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} 
                            onClick={() => setSelectedCategory(null)}
                        >
                            Todas
                        </Badge>
                        {Object.entries(LIMIT_CATEGORIES).map(([categoryKey, { label, icon }]) => (
                            <Badge 
                                key={categoryKey}
                                className={`cursor-pointer ${selectedCategory === categoryKey ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} 
                                onClick={() => setSelectedCategory(categoryKey === selectedCategory ? null : categoryKey)}
                            >
                                <span className="flex items-center">
                                    {icon && <span className="mr-1">{icon}</span>}
                                    {label}
                                </span>
                            </Badge>
                        ))}
                    </div>
                    
                    {/* Límites actuales agrupados por categoría */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {Object.entries(groupedCurrentLimits).length > 0 ? (
                            Object.entries(groupedCurrentLimits)
                                // Filtrar por categoría seleccionada
                                .filter(([category]) => !selectedCategory || category === selectedCategory)
                                .map(([category, limits]) => (
                                    <div key={category} className="mb-6">
                                        <h6 className="font-semibold mb-2 flex items-center">
                                            {LIMIT_CATEGORIES[category]?.icon && (
                                                <span className="mr-1">{LIMIT_CATEGORIES[category].icon}</span>
                                            )}
                                            {LIMIT_CATEGORIES[category]?.label || category}
                                        </h6>
                                        <div className="space-y-3">
                                            {limits.map(({ key, value, config }) => (
                                                <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary-300 transition-colors">
                                                    <div className="flex-grow flex flex-col">
                                                        <div className="flex items-center">
                                                            <label className="font-medium text-sm mb-1">
                                                                {config.label}
                                                            </label>
                                                            {config.description && (
                                                                <Tooltip title={config.description}>
                                                                    <span className="ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                                                                        <PiInfoBold size={14} />
                                                                    </span>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                        
                                                        {config.type === 'boolean' ? (
                                                            <div className="flex items-center">
                                                                <Select
                                                                    value={value ? 'true' : 'false'}
                                                                    options={[
                                                                        { value: 'true', label: 'Habilitado' },
                                                                        { value: 'false', label: 'Deshabilitado' }
                                                                    ]}
                                                                    onChange={(val) => updateLimit(key, val === 'true')}
                                                                    className="w-40"
                                                                />
                                                            </div>
                                                        ) : config.type === 'select' ? (
                                                            <div className="flex items-center">
                                                                <Select
                                                                    value={value}
                                                                    options={config.options || []}
                                                                    onChange={(val) => updateLimit(key, val)}
                                                                    className="w-40"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <NumericInput
                                                                value={value}
                                                                onValueChange={(vals) => updateLimit(key, vals.floatValue)}
                                                                min={config.min || 0}
                                                                className="w-32"
                                                            />
                                                        )}
                                                    </div>
                                                    
                                                    <Button
                                                        variant="plain"
                                                        shape="circle"
                                                        size="sm"
                                                        onClick={() => removeLimit(key)}
                                                        className="text-gray-500 hover:text-red-500"
                                                        icon={<PiTrashBold />}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="p-6 text-center text-gray-500 border rounded-lg">
                                No hay límites configurados para este módulo. 
                                <div className="text-sm mt-2">
                                    Añade límites para controlar las funcionalidades disponibles.
                                </div>
                                <Button 
                                    className="mt-3" 
                                    size="sm"
                                    onClick={resetToDefaults}
                                >
                                    Aplicar valores predeterminados
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}
            
            <div className="mt-6 flex justify-between">
                <div className="text-sm text-gray-500">
                    {limitsModified && (
                        <span className="text-amber-500 flex items-center">
                            <PiWarningCircleFill className="mr-1" />
                            Hay cambios sin guardar
                        </span>
                    )}
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="plain"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        onClick={saveLimits}
                        loading={saving}
                        disabled={!limitsModified}
                        icon={<PiCheck />}
                    >
                        Guardar Cambios
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ModuleLimitsModal