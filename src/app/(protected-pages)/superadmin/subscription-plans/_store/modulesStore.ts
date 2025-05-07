/**
 * frontend/src/app/(protected-pages)/modules/superadmin/subscription-plans/_store/modulesStore.ts
 * Store para gestión de módulos del sistema
 * @version 1.1.0
 * @updated 2025-05-29
 */

import { create } from 'zustand'
import { supabase } from '@/services/supabase/SupabaseClient'

export interface Module {
    id: string
    name: string
    code: string
    description: string
    icon: string
    is_active: boolean
    is_core: boolean
    order_index: number
    created_at: string
    updated_at: string
    metadata?: Record<string, any>
}

export interface ModuleDependency {
    id: string
    module_id: string
    dependency_id: string
    is_required: boolean
    notes?: string
    created_at: string
    module?: Module
    dependency?: Module
}

interface ModulesState {
    modules: Module[]
    moduleDependencies: Record<string, ModuleDependency[]>
    loading: boolean
    loadingDependencies: boolean
    error: string | null
    fetchModules: () => Promise<void>
    fetchModuleDependencies: () => Promise<void>
    getModuleDependenciesByCode: () => Record<string, string[]>
    createModule: (module: Omit<Module, 'id' | 'created_at' | 'updated_at'>) => Promise<Module>
    updateModule: (id: string, module: Partial<Module>) => Promise<Module>
    deleteModule: (id: string) => Promise<void>
}

export const useModulesStore = create<ModulesState>((set, get) => ({
    modules: [],
    moduleDependencies: {},
    loading: false,
    loadingDependencies: false,
    error: null,

    fetchModules: async () => {
        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('modules')
                .select('*')
                .order('order_index', { ascending: true })
            
            if (error) {
                console.error('Supabase query error:', error)
                throw new Error(error.message || 'Error en la consulta a la base de datos')
            }
            
            set({ modules: data || [], loading: false })
        } catch (error) {
            console.error('Error fetching modules:', error)
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al cargar los módulos'
            
            set({ 
                error: errorMessage, 
                loading: false 
            })
            
            throw error // Re-lanzar el error para manejarlo en el componente
        }
    },
    
    fetchModuleDependencies: async () => {
        set({ loadingDependencies: true, error: null })
        try {
            const { data, error } = await supabase
                .from('module_dependencies')
                .select(`
                    id,
                    module_id,
                    dependency_id,
                    is_required,
                    notes,
                    created_at,
                    module:modules!module_id(id, code),
                    dependency:modules!dependency_id(id, code)
                `)
                .order('id')
            
            if (error) {
                console.error('Supabase query error:', error)
                throw new Error(error.message || 'Error en la consulta a la base de datos')
            }
            
            // Organizar dependencias por module_id para acceso más fácil
            const dependenciesByModuleId: Record<string, ModuleDependency[]> = {}
            
            data?.forEach(dep => {
                if (!dependenciesByModuleId[dep.module_id]) {
                    dependenciesByModuleId[dep.module_id] = []
                }
                dependenciesByModuleId[dep.module_id].push(dep)
            })
            
            set({ 
                moduleDependencies: dependenciesByModuleId, 
                loadingDependencies: false 
            })
        } catch (error) {
            console.error('Error fetching module dependencies:', error)
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al cargar las dependencias de módulos'
            
            set({ 
                error: errorMessage, 
                loadingDependencies: false 
            })
            
            throw error
        }
    },
    
    // Obtener dependencias en formato código de módulo -> [códigos de dependencias]
    getModuleDependenciesByCode: () => {
        const { modules, moduleDependencies } = get()
        const dependenciesByCode: Record<string, string[]> = {}
        
        // Crear mapa de id -> código para búsqueda eficiente
        const moduleIdToCode = new Map<string, string>()
        modules.forEach(module => {
            moduleIdToCode.set(module.id, module.code)
        })
        
        // Para cada módulo con dependencias
        Object.entries(moduleDependencies).forEach(([moduleId, deps]) => {
            const moduleCode = moduleIdToCode.get(moduleId)
            if (!moduleCode) return
            
            dependenciesByCode[moduleCode] = deps
                .filter(dep => dep.is_required) // Solo incluir dependencias requeridas
                .map(dep => {
                    // Usar el código del módulo de dependencia
                    if (dep.dependency?.code) return dep.dependency.code
                    // O buscar en el mapa si tenemos solo el ID
                    return moduleIdToCode.get(dep.dependency_id) || ''
                })
                .filter(code => code !== '') // Eliminar códigos vacíos
        })
        
        return dependenciesByCode
    },

    createModule: async (moduleData) => {
        try {
            const { data, error } = await supabase
                .from('modules')
                .insert([moduleData])
                .select()
                .single()
            
            if (error) throw error
            
            set((state) => ({
                modules: [...state.modules, data]
            }))
            
            return data
        } catch (error) {
            console.error('Error creating module:', error)
            throw new Error('Error al crear el módulo')
        }
    },

    updateModule: async (id, moduleData) => {
        try {
            const { data, error } = await supabase
                .from('modules')
                .update(moduleData)
                .eq('id', id)
                .select()
                .single()
            
            if (error) throw error
            
            set((state) => ({
                modules: state.modules.map((m) => 
                    m.id === id ? { ...m, ...data } : m
                )
            }))
            
            return data
        } catch (error) {
            console.error('Error updating module:', error)
            throw new Error('Error al actualizar el módulo')
        }
    },

    deleteModule: async (id) => {
        try {
            // Verificar si el módulo está asignado a algún plan activo
            const { data: planModulesData, error: planModulesError } = await supabase
                .from('plan_modules')
                .select(`
                    id,
                    plan:subscription_plans!inner(id, name, is_active)
                `)
                .eq('module_id', id)
                .order('id')
            
            if (planModulesError) throw planModulesError
            
            // Filtrar planes activos que usan este módulo
            const activePlans = planModulesData
                ?.filter(pm => pm.plan?.is_active)
                .map(pm => pm.plan) || []
            
            if (activePlans.length > 0) {
                // El módulo está siendo utilizado por planes activos
                const plansText = activePlans
                    .map(plan => `"${plan.name}"`)
                    .join(', ')
                
                throw new Error(
                    `No se puede eliminar el módulo porque está siendo utilizado por ${activePlans.length} ` +
                    `${activePlans.length === 1 ? 'plan activo' : 'planes activos'}: ${plansText}`
                )
            }
            
            // También verificar si hay módulos que dependen de este
            const { data: dependentModulesData, error: dependentError } = await supabase
                .from('module_dependencies')
                .select(`
                    id,
                    module:modules!module_id(id, name, code)
                `)
                .eq('dependency_id', id)
                .order('id')
            
            if (dependentError) throw dependentError
            
            if (dependentModulesData && dependentModulesData.length > 0) {
                const dependentNames = dependentModulesData
                    .map(dep => `"${dep.module.name}"`)
                    .join(', ')
                
                throw new Error(
                    `No se puede eliminar el módulo porque es requerido por ${dependentModulesData.length} ` +
                    `${dependentModulesData.length === 1 ? 'otro módulo' : 'otros módulos'}: ${dependentNames}`
                )
            }
            
            // Si pasa las validaciones, eliminar el módulo
            // Las dependencias se eliminarán automáticamente por la restricción ON DELETE CASCADE
            const { error } = await supabase
                .from('modules')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            set((state) => ({
                modules: state.modules.filter((m) => m.id !== id),
                // También eliminar este módulo de las dependencias
                moduleDependencies: Object.fromEntries(
                    Object.entries(state.moduleDependencies).filter(([moduleId]) => moduleId !== id)
                )
            }))
        } catch (error) {
            console.error('Error deleting module:', error)
            throw error instanceof Error 
                ? error 
                : new Error('Error al eliminar el módulo')
        }
    }
}))
