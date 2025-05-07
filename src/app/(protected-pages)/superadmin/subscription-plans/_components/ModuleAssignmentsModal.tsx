/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_components/ModuleAssignmentsModal.tsx
 * Modal para asignación avanzada de módulos a planes
 * @version 1.2.0
 * @updated 2025-05-29
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, Input, Button, Checkbox, Spinner, Avatar, toast, Notification, Tooltip } from '@/components/ui'
import { PiMagnifyingGlassBold, PiWarningCircleFill, PiCheck, PiSliders, PiLockSimple, PiLockSimpleOpen } from 'react-icons/pi'
import { Plan, PlanModule, usePlansStore } from '../_store/plansStore'
import { useModulesStore, Module } from '../_store/modulesStore'
import classNames from 'classnames'
import ModuleLimitsModal from './ModuleLimitsModal'

interface ModuleAssignmentsModalProps {
    isOpen: boolean
    onClose: () => void
    plan: Plan | null
}

interface ModuleWithAssignment extends Module {
    isAssigned: boolean
    assignmentId?: string
    isRequired?: boolean
    requiredBy?: string[]
    dependencies?: string[]
    featureLevel?: 'basic' | 'advanced' | 'premium'
    verticalSpecific?: boolean
}

const ModuleAssignmentsModal = ({ isOpen, onClose, plan }: ModuleAssignmentsModalProps) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [saving, setSaving] = useState(false)
    const [assignmentModified, setAssignmentModified] = useState(false)
    
    // Estado para gestionar el modal de límites
    const [limitsModalOpen, setLimitsModalOpen] = useState(false)
    const [selectedModule, setSelectedModule] = useState<{id: string, name: string} | null>(null)
    
    // Estado para los módulos con su asignación
    const [modulesWithAssignments, setModulesWithAssignments] = useState<ModuleWithAssignment[]>([])
    
    // Obtener datos de los stores
    const { 
        modules, 
        loading: loadingModules, 
        fetchModules,
        loadingDependencies,
        fetchModuleDependencies,
        getModuleDependenciesByCode
    } = useModulesStore()
    
    const { 
        planModules, 
        loadingModules: loadingPlanModules, 
        fetchPlanModules,
        updateModuleAssignments 
    } = usePlansStore()
    
    // Cargar los módulos y las asignaciones cuando se abre el modal
    useEffect(() => {
        const loadData = async () => {
            try {
                if (!modules || modules.length === 0) {
                    await fetchModules()
                }
                
                // Cargar dependencias de módulos
                await fetchModuleDependencies()
                
                if (plan) {
                    await fetchPlanModules(plan.id)
                }
            } catch (error) {
                console.error('Error loading data:', error)
                toast.push(
                    <Notification title="Error" type="danger">
                        Error al cargar los datos
                    </Notification>
                )
            }
        }
        
        if (isOpen) {
            loadData()
        }
    }, [isOpen, plan, fetchModules, fetchModuleDependencies, fetchPlanModules, modules])
    
    // Combinar módulos y asignaciones
    useEffect(() => {
        if (!plan || !modules) return
        
        const currentAssignments = planModules[plan.id] || []
        
        // Analizar dependencias entre módulos
        const moduleDependencies = new Map<string, string[]>()
        const moduleRequiredBy = new Map<string, string[]>()
        
        // Obtener dependencias desde la base de datos
        const databaseDependencies = getModuleDependenciesByCode()
        
        // Construir el grafo de dependencias
        modules.forEach(module => {
            // Obtener dependencias de la base de datos para este módulo
            if (databaseDependencies[module.code] && databaseDependencies[module.code].length > 0) {
                moduleDependencies.set(module.code, databaseDependencies[module.code])
                
                // Actualizar la lista de módulos que requieren cada dependencia
                databaseDependencies[module.code].forEach(depCode => {
                    if (!moduleRequiredBy.has(depCode)) {
                        moduleRequiredBy.set(depCode, [])
                    }
                    moduleRequiredBy.get(depCode)?.push(module.code)
                })
            }
        })
        
        // Combinamos módulos con sus asignaciones
        const combined = modules.map(module => {
            const assignment = currentAssignments.find(a => a.module_id === module.id)
            
            // Determinar nivel de característica basado en metadata
            let featureLevel: 'basic' | 'advanced' | 'premium' = 'basic'
            if (module.metadata && typeof module.metadata === 'object') {
                if (module.metadata.importance === 'high' || module.metadata.complexity === 'high') {
                    featureLevel = 'premium'
                } else if (module.metadata.importance === 'medium' || module.metadata.complexity === 'medium') {
                    featureLevel = 'advanced'
                }
            }
            
            // Determinar si es específico de una vertical
            const verticalSpecific = module.metadata?.vertical_specific === true
            
            return {
                ...module,
                isAssigned: !!assignment,
                assignmentId: assignment?.id,
                // Dependencias y requisitos
                dependencies: moduleDependencies.get(module.code) || [],
                requiredBy: moduleRequiredBy.get(module.code) || [],
                featureLevel,
                verticalSpecific
            }
        })
        
        setModulesWithAssignments(combined)
        setAssignmentModified(false)
    }, [modules, plan, planModules])
    
    // Filtrar módulos según la búsqueda
    const filteredModules = useMemo(() => {
        if (!searchQuery) return modulesWithAssignments
        
        const query = searchQuery.toLowerCase()
        return modulesWithAssignments.filter(
            m => m.name.toLowerCase().includes(query) || 
                 m.code.toLowerCase().includes(query) ||
                 m.description?.toLowerCase().includes(query) ||
                 m.featureLevel?.toLowerCase().includes(query) ||
                 (query === 'vertical' && m.verticalSpecific)
        )
    }, [modulesWithAssignments, searchQuery])
    
    // Agrupar módulos por categorías
    const groupedModules = useMemo(() => {
        const core: ModuleWithAssignment[] = []
        const premium: ModuleWithAssignment[] = []
        const advanced: ModuleWithAssignment[] = []
        const basic: ModuleWithAssignment[] = []
        const verticalSpecific: ModuleWithAssignment[] = []
        
        filteredModules.forEach(module => {
            if (module.is_core) {
                core.push(module)
            } else if (module.verticalSpecific) {
                verticalSpecific.push(module)
            } else if (module.featureLevel === 'premium') {
                premium.push(module)
            } else if (module.featureLevel === 'advanced') {
                advanced.push(module)
            } else {
                basic.push(module)
            }
        })
        
        return {
            core,
            premium,
            advanced,
            basic,
            verticalSpecific
        }
    }, [filteredModules])
    
    // Verificar si un módulo está bloqueado por dependencias
    const isModuleBlocked = (module: ModuleWithAssignment) => {
        // Si el módulo no tiene dependencias, no está bloqueado
        if (!module.dependencies || module.dependencies.length === 0) {
            return false
        }
        
        // Verificar que todas las dependencias estén asignadas
        for (const depCode of module.dependencies) {
            const depModule = modulesWithAssignments.find(m => m.code === depCode)
            if (!depModule?.isAssigned) {
                return true
            }
        }
        
        return false
    }
    
    // Verificar si un módulo no puede ser desasignado porque otros módulos dependen de él
    const cantUnassign = (module: ModuleWithAssignment) => {
        if (!module.requiredBy || module.requiredBy.length === 0) {
            return false
        }
        
        // Verificar si algún módulo que requiere este está asignado
        for (const reqCode of module.requiredBy) {
            const reqModule = modulesWithAssignments.find(m => m.code === reqCode)
            if (reqModule?.isAssigned) {
                return true
            }
        }
        
        return false
    }
    
    // Obtener las dependencias que faltan para un módulo
    const getMissingDependencies = (module: ModuleWithAssignment) => {
        if (!module.dependencies || module.dependencies.length === 0) {
            return []
        }
        
        return module.dependencies.filter(depCode => {
            const depModule = modulesWithAssignments.find(m => m.code === depCode)
            return !depModule?.isAssigned
        })
    }
    
    // Obtener los módulos que requieren este módulo
    const getRequiringModules = (module: ModuleWithAssignment) => {
        if (!module.requiredBy || module.requiredBy.length === 0) {
            return []
        }
        
        return module.requiredBy.filter(reqCode => {
            const reqModule = modulesWithAssignments.find(m => m.code === reqCode)
            return reqModule?.isAssigned
        })
    }
    
    // Cambiar el estado de asignación de un módulo
    const toggleModuleAssignment = (module: ModuleWithAssignment) => {
        // Si el módulo está bloqueado o no se puede desasignar, no permitir el cambio
        if ((!module.isAssigned && isModuleBlocked(module)) || 
            (module.isAssigned && cantUnassign(module))) {
            return
        }
        
        let newAssignments = [...modulesWithAssignments]
        
        // Si estamos activando un módulo
        if (!module.isAssigned) {
            // Primero actualizar el módulo principal
            newAssignments = newAssignments.map(m => 
                m.id === module.id ? { ...m, isAssigned: true } : m
            )
            
            // Luego activar todas sus dependencias si es necesario
            const moduleDeps = module.dependencies || []
            if (moduleDeps.length > 0) {
                // Encontrar todos los módulos que son dependencias y que no están asignados
                const missingDeps = modulesWithAssignments.filter(
                    m => moduleDeps.includes(m.code) && !m.isAssigned
                )
                
                // Si hay dependencias que activar, mostrar confirmación
                if (missingDeps.length > 0) {
                    const depNames = missingDeps.map(m => m.name).join(', ')
                    
                    // Confirmar con el usuario si desea activar las dependencias
                    if (confirm(
                        `El módulo "${module.name}" requiere los siguientes módulos que no están activos: ` +
                        `${depNames}. ¿Desea activarlos automáticamente?`
                    )) {
                        // Activar todas las dependencias
                        newAssignments = newAssignments.map(m => 
                            moduleDeps.includes(m.code) ? { ...m, isAssigned: true } : m
                        )
                    } else {
                        // El usuario no quiere activar las dependencias, cancelar todo
                        return
                    }
                }
            }
        } else {
            // Si estamos desactivando un módulo, verificar si otros dependen de él
            const requiringModules = getRequiringModules(module)
            
            if (requiringModules.length > 0) {
                const moduleNames = modulesWithAssignments
                    .filter(m => requiringModules.includes(m.code))
                    .map(m => m.name)
                    .join(', ')
                
                // Mostrar mensaje de error
                toast.push(
                    <Notification title="No se puede desactivar" type="warning">
                        Este módulo es requerido por: {moduleNames}
                    </Notification>
                )
                return
            }
            
            // Si no hay dependencias, simplemente desactivar el módulo
            newAssignments = newAssignments.map(m => 
                m.id === module.id ? { ...m, isAssigned: false } : m
            )
        }
        
        setModulesWithAssignments(newAssignments)
        setAssignmentModified(true)
    }
    
    // Guardar los cambios en las asignaciones
    const saveAssignments = async () => {
        if (!plan) return
        
        setSaving(true)
        try {
            // Preparar los datos para enviar
            const assignments = modulesWithAssignments.map(module => ({
                moduleId: module.id,
                isActive: module.isAssigned
            }))
            
            // Actualizar las asignaciones
            await updateModuleAssignments(plan.id, assignments)
            
            toast.push(
                <Notification title="Éxito" type="success">
                    Asignaciones actualizadas correctamente
                </Notification>
            )
            
            setAssignmentModified(false)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al guardar las asignaciones
                </Notification>
            )
        } finally {
            setSaving(false)
        }
    }
    
    // Función para abrir el modal de configuración de límites
    const openLimitsModal = (moduleId: string, moduleName: string) => {
        setSelectedModule({ id: moduleId, name: moduleName })
        setLimitsModalOpen(true)
    }
    
    // Si no hay plan seleccionado, no mostrar el modal
    if (!plan) return null
    
    const loading = loadingModules || loadingPlanModules || loadingDependencies
    
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            contentClassName="max-w-3xl"
        >
            <h5 className="mb-4">Gestión de Módulos para Plan: {plan.name}</h5>
            
            <div className="mb-4">
                <Input
                    prefix={<PiMagnifyingGlassBold className="text-lg" />}
                    placeholder="Buscar módulos..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <Spinner size={40} />
                </div>
            ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                    {/* Módulos Core */}
                    {groupedModules.core.length > 0 && (
                        <div className="mb-6">
                            <h6 className="font-semibold mb-2 text-gray-500 text-sm uppercase">Módulos Core</h6>
                            <div className="space-y-2">
                                {groupedModules.core.map(module => (
                                    <ModuleItem 
                                        key={module.id}
                                        module={module}
                                        isBlocked={isModuleBlocked(module)}
                                        cantUnassign={cantUnassign(module)}
                                        missingDependencies={getMissingDependencies(module)}
                                        requiringModules={getRequiringModules(module)}
                                        onToggle={toggleModuleAssignment}
                                        onConfigureLimits={openLimitsModal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Módulos Específicos de Verticales */}
                    {groupedModules.verticalSpecific.length > 0 && (
                        <div className="mb-6">
                            <h6 className="font-semibold mb-2 text-gray-500 text-sm uppercase">Módulos Específicos por Vertical</h6>
                            <div className="space-y-2">
                                {groupedModules.verticalSpecific.map(module => (
                                    <ModuleItem 
                                        key={module.id}
                                        module={module}
                                        isBlocked={isModuleBlocked(module)}
                                        cantUnassign={cantUnassign(module)}
                                        missingDependencies={getMissingDependencies(module)}
                                        requiringModules={getRequiringModules(module)}
                                        onToggle={toggleModuleAssignment}
                                        onConfigureLimits={openLimitsModal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Módulos Premium */}
                    {groupedModules.premium.length > 0 && (
                        <div className="mb-6">
                            <h6 className="font-semibold mb-2 text-gray-500 text-sm uppercase">Módulos Premium</h6>
                            <div className="space-y-2">
                                {groupedModules.premium.map(module => (
                                    <ModuleItem 
                                        key={module.id}
                                        module={module}
                                        isBlocked={isModuleBlocked(module)}
                                        cantUnassign={cantUnassign(module)}
                                        missingDependencies={getMissingDependencies(module)}
                                        requiringModules={getRequiringModules(module)}
                                        onToggle={toggleModuleAssignment}
                                        onConfigureLimits={openLimitsModal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Módulos Avanzados */}
                    {groupedModules.advanced.length > 0 && (
                        <div className="mb-6">
                            <h6 className="font-semibold mb-2 text-gray-500 text-sm uppercase">Módulos Avanzados</h6>
                            <div className="space-y-2">
                                {groupedModules.advanced.map(module => (
                                    <ModuleItem 
                                        key={module.id}
                                        module={module}
                                        isBlocked={isModuleBlocked(module)}
                                        cantUnassign={cantUnassign(module)}
                                        missingDependencies={getMissingDependencies(module)}
                                        requiringModules={getRequiringModules(module)}
                                        onToggle={toggleModuleAssignment}
                                        onConfigureLimits={openLimitsModal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Módulos Básicos */}
                    {groupedModules.basic.length > 0 && (
                        <div>
                            <h6 className="font-semibold mb-2 text-gray-500 text-sm uppercase">Módulos Básicos</h6>
                            <div className="space-y-2">
                                {groupedModules.basic.map(module => (
                                    <ModuleItem 
                                        key={module.id}
                                        module={module}
                                        isBlocked={isModuleBlocked(module)}
                                        cantUnassign={cantUnassign(module)}
                                        missingDependencies={getMissingDependencies(module)}
                                        requiringModules={getRequiringModules(module)}
                                        onToggle={toggleModuleAssignment}
                                        onConfigureLimits={openLimitsModal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Mensaje si no hay módulos */}
                    {filteredModules.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                            {searchQuery 
                                ? 'No se encontraron módulos que coincidan con la búsqueda.' 
                                : 'No hay módulos disponibles.'}
                        </div>
                    )}
                </div>
            )}
            
            <div className="mt-6 flex justify-between">
                <div className="text-sm text-gray-500">
                    {assignmentModified && (
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
                        Cerrar
                    </Button>
                    <Button
                        variant="solid"
                        onClick={saveAssignments}
                        loading={saving}
                        disabled={!assignmentModified}
                        icon={<PiCheck />}
                    >
                        Guardar Cambios
                    </Button>
                </div>
            </div>
            
            {/* Modal de configuración de límites */}
            <ModuleLimitsModal
                isOpen={limitsModalOpen}
                onClose={() => setLimitsModalOpen(false)}
                plan={plan}
                moduleId={selectedModule?.id || null}
                moduleName={selectedModule?.name}
            />
        </Dialog>
    )
}

// Componente para cada ítem de módulo
interface ModuleItemProps {
    module: ModuleWithAssignment
    isBlocked: boolean
    cantUnassign: boolean
    missingDependencies: string[]
    requiringModules: string[]
    onToggle: (module: ModuleWithAssignment) => void
    onConfigureLimits?: (moduleId: string, moduleName: string) => void
}

const ModuleItem = ({ 
    module, 
    isBlocked,
    cantUnassign,
    missingDependencies,
    requiringModules,
    onToggle,
    onConfigureLimits
}: ModuleItemProps) => {
    const disabled = (isBlocked && !module.isAssigned) || (cantUnassign && module.isAssigned)
    
    // Determinar color de fondo según el nivel
    const getBgColor = () => {
        if (module.is_core) return "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
        if (module.verticalSpecific) return "border-purple-500 bg-purple-50/50 dark:bg-purple-900/10"
        if (module.featureLevel === 'premium') return "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
        if (module.featureLevel === 'advanced') return "border-teal-500 bg-teal-50/50 dark:bg-teal-900/10"
        
        return "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10"
    }
    
    return (
        <div 
            className={classNames(
                "border rounded-lg p-3 transition-colors",
                module.isAssigned ? getBgColor() : "border-gray-200 dark:border-gray-700",
                disabled && "opacity-70"
            )}
        >
            <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                    <Avatar 
                        shape="circle" 
                        size={40}
                        icon={module.icon || "puzzle-piece"}
                    />
                </div>
                <div className="flex-grow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h6 className="font-semibold">{module.name}</h6>
                            <div className="flex items-center flex-wrap gap-1">
                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                                    {module.code}
                                </code>
                                {module.is_core && (
                                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                        Core
                                    </span>
                                )}
                                {module.verticalSpecific && (
                                    <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                        Específico
                                    </span>
                                )}
                                {!module.is_core && !module.verticalSpecific && (
                                    <span className={classNames(
                                        "text-xs px-1.5 py-0.5 rounded",
                                        module.featureLevel === 'premium' 
                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                            : module.featureLevel === 'advanced'
                                                ? "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400"
                                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    )}>
                                        {module.featureLevel === 'premium' 
                                            ? 'Premium' 
                                            : module.featureLevel === 'advanced' 
                                                ? 'Avanzado' 
                                                : 'Básico'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Botón de configuración de límites (solo visible si el módulo está asignado) */}
                            {module.isAssigned && onConfigureLimits && (
                                <Tooltip title="Configurar límites del módulo">
                                    <Button
                                        variant="plain"
                                        size="sm"
                                        shape="circle"
                                        icon={<PiSliders />}
                                        onClick={() => onConfigureLimits(module.id, module.name)}
                                        className="text-gray-500 hover:text-primary-500 transition-colors"
                                    />
                                </Tooltip>
                            )}
                            
                            {/* Indicador de dependencias/bloqueos */}
                            {(isBlocked || cantUnassign) && (
                                <Tooltip title={isBlocked ? "Requiere otros módulos" : "Requerido por otros módulos"}>
                                    {isBlocked ? (
                                        <PiLockSimple className="text-amber-500" />
                                    ) : (
                                        <PiLockSimpleOpen className="text-amber-500" />
                                    )}
                                </Tooltip>
                            )}
                            
                            {/* Checkbox para asignar/desasignar */}
                            <Checkbox 
                                checked={module.isAssigned}
                                onChange={() => onToggle(module)}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                    
                    {module.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {module.description}
                        </p>
                    )}
                    
                    {/* Mensajes de dependencias */}
                    {isBlocked && !module.isAssigned && missingDependencies.length > 0 && (
                        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded flex items-center">
                            <PiLockSimple className="mr-1 flex-shrink-0" />
                            <span>
                                <strong>Requiere estos módulos:</strong> {missingDependencies.join(', ')}
                            </span>
                        </div>
                    )}
                    
                    {cantUnassign && module.isAssigned && requiringModules.length > 0 && (
                        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded flex items-center">
                            <PiLockSimpleOpen className="mr-1 flex-shrink-0" />
                            <span>
                                <strong>No se puede desactivar porque es requerido por:</strong> {requiringModules.join(', ')}
                            </span>
                        </div>
                    )}
                    
                    {/* Mostrar todas las dependencias del módulo cuando está asignado */}
                    {module.isAssigned && module.dependencies && module.dependencies.length > 0 && !cantUnassign && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/20 p-2 rounded">
                            <strong>Requiere:</strong> {module.dependencies.join(', ')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ModuleAssignmentsModal
