/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_store/plansStore.ts
 * Store para gestión de planes de suscripción
 * @version 1.0.0
 * @updated 2025-05-01
 */

import { create } from 'zustand'
import { supabase } from '@/services/supabase/SupabaseClient'
import { Module } from './modulesStore'

export interface Plan {
    id: string
    name: string
    code: string
    description: string
    price?: number // De la vista, representa price_monthly
    price_monthly: number
    price_yearly: number
    billing_cycle?: 'monthly' | 'yearly' | 'one_time' // Campo virtual para UI
    is_active: boolean
    features: string[]
    max_users: number
    max_storage_gb: number
    created_at: string
    updated_at: string
}

export interface PlanModule {
    id: string
    plan_id: string
    module_id: string
    is_active: boolean
    limits?: Record<string, any> // Límites específicos para el módulo en este plan
    module?: Module // Para relaciones expandidas
    created_at: string
    updated_at: string
}

interface PlansState {
    plans: Plan[]
    planModules: Record<string, PlanModule[]> // planId -> módulos asignados
    loadingPlans: boolean
    loadingModules: boolean
    error: string | null
    
    // Acciones para planes
    fetchPlans: () => Promise<void>
    createPlan: (plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) => Promise<Plan>
    updatePlan: (id: string, plan: Partial<Plan>) => Promise<Plan>
    deletePlan: (id: string) => Promise<void>
    
    // Acciones para la relación plan-módulo
    fetchPlanModules: (planId: string) => Promise<PlanModule[]>
    assignModuleToPlan: (planId: string, moduleId: string, isActive?: boolean) => Promise<PlanModule>
    updatePlanModule: (id: string, data: Partial<PlanModule>) => Promise<PlanModule>
    removePlanModule: (id: string) => Promise<void>
    
    // Actualizar asignaciones por lotes
    updateModuleAssignments: (
        planId: string, 
        assignments: {moduleId: string, isActive: boolean}[]
    ) => Promise<void>
}

export const usePlansStore = create<PlansState>((set, get) => ({
    plans: [],
    planModules: {},
    loadingPlans: false,
    loadingModules: false,
    error: null,

    fetchPlans: async () => {
        set({ loadingPlans: true, error: null })
        try {
            // Usar la vista que incluye la columna 'price' para lectura
            const { data, error } = await supabase
                .from('subscription_plans_with_price')
                .select('*')
                .order('price', { ascending: true })
            
            if (error) {
                throw new Error(error.message || 'Error en la consulta a la base de datos')
            }
            
            set({ plans: data || [], loadingPlans: false })
        } catch (error) {
            console.error('Error fetching plans:', error)
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al cargar los planes'
            
            set({ 
                error: errorMessage, 
                loadingPlans: false 
            })
            
            throw error
        }
    },

    createPlan: async (planData) => {
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .insert([planData])
                .select()
                .single()
            
            if (error) throw error
            
            set((state) => ({
                plans: [...state.plans, data]
            }))
            
            return data
        } catch (error) {
            console.error('Error creating plan:', error)
            throw new Error('Error al crear el plan')
        }
    },

    updatePlan: async (id, planData) => {
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .update(planData)
                .eq('id', id)
                .select()
                .single()
            
            if (error) throw error
            
            set((state) => ({
                plans: state.plans.map((p) => 
                    p.id === id ? { ...p, ...data } : p
                )
            }))
            
            return data
        } catch (error) {
            console.error('Error updating plan:', error)
            throw new Error('Error al actualizar el plan')
        }
    },

    deletePlan: async (id) => {
        try {
            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            set((state) => ({
                plans: state.plans.filter((p) => p.id !== id),
                // También limpiar los módulos asignados a este plan
                planModules: {
                    ...state.planModules,
                    [id]: undefined
                }
            }))
        } catch (error) {
            console.error('Error deleting plan:', error)
            throw new Error('Error al eliminar el plan')
        }
    },

    fetchPlanModules: async (planId) => {
        set({ loadingModules: true, error: null })
        try {
            const { data, error } = await supabase
                .from('plan_modules')
                .select(`
                    *,
                    module:modules(*)
                `)
                .eq('plan_id', planId)
            
            if (error) {
                throw new Error(error.message || 'Error en la consulta a la base de datos')
            }
            
            // Almacenar los módulos asignados en el estado
            set((state) => ({ 
                planModules: {
                    ...state.planModules,
                    [planId]: data || []
                },
                loadingModules: false 
            }))
            
            return data || []
        } catch (error) {
            console.error('Error fetching plan modules:', error)
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al cargar los módulos del plan'
            
            set({ 
                error: errorMessage, 
                loadingModules: false 
            })
            
            throw error
        }
    },

    assignModuleToPlan: async (planId, moduleId, isActive = true) => {
        try {
            // Verificar si ya existe esta asignación
            const { data: existingData } = await supabase
                .from('plan_modules')
                .select('*')
                .eq('plan_id', planId)
                .eq('module_id', moduleId)
                .single()
            
            let result
            
            if (existingData) {
                // Actualizar la asignación existente
                const { data, error } = await supabase
                    .from('plan_modules')
                    .update({ is_active: isActive })
                    .eq('id', existingData.id)
                    .select()
                    .single()
                
                if (error) throw error
                result = data
            } else {
                // Crear nueva asignación
                const { data, error } = await supabase
                    .from('plan_modules')
                    .insert([{
                        plan_id: planId,
                        module_id: moduleId,
                        is_active: isActive
                    }])
                    .select()
                    .single()
                
                if (error) throw error
                result = data
            }
            
            // Actualizar el estado local
            set((state) => {
                const currentModules = state.planModules[planId] || []
                const updatedModules = existingData
                    ? currentModules.map(m => m.id === result.id ? result : m)
                    : [...currentModules, result]
                
                return {
                    planModules: {
                        ...state.planModules,
                        [planId]: updatedModules
                    }
                }
            })
            
            return result
        } catch (error) {
            console.error('Error assigning module to plan:', error)
            throw new Error('Error al asignar el módulo al plan')
        }
    },

    updatePlanModule: async (id, data) => {
        try {
            const { data: updatedData, error } = await supabase
                .from('plan_modules')
                .update(data)
                .eq('id', id)
                .select(`
                    *,
                    module:modules(*)
                `)
                .single()
            
            if (error) throw error
            
            // Actualizar el estado local
            set((state) => {
                // Encontrar el planId para esta asignación
                const planId = updatedData.plan_id
                const currentModules = state.planModules[planId] || []
                
                return {
                    planModules: {
                        ...state.planModules,
                        [planId]: currentModules.map(m => 
                            m.id === id ? updatedData : m
                        )
                    }
                }
            })
            
            return updatedData
        } catch (error) {
            console.error('Error updating plan module:', error)
            throw new Error('Error al actualizar la asignación del módulo')
        }
    },

    removePlanModule: async (id) => {
        try {
            // Primero obtener el planId antes de eliminar
            const { data: moduleData } = await supabase
                .from('plan_modules')
                .select('plan_id')
                .eq('id', id)
                .single()
            
            if (!moduleData) throw new Error('Asignación no encontrada')
            const planId = moduleData.plan_id
            
            // Eliminar la asignación
            const { error } = await supabase
                .from('plan_modules')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            // Actualizar el estado local
            set((state) => {
                const currentModules = state.planModules[planId] || []
                return {
                    planModules: {
                        ...state.planModules,
                        [planId]: currentModules.filter(m => m.id !== id)
                    }
                }
            })
        } catch (error) {
            console.error('Error removing plan module:', error)
            throw new Error('Error al eliminar la asignación del módulo')
        }
    },

    updateModuleAssignments: async (planId, assignments) => {
        try {
            set({ loadingModules: true, error: null })
            
            // Realizar todas las actualizaciones en una transacción
            for (const assignment of assignments) {
                await get().assignModuleToPlan(
                    planId, 
                    assignment.moduleId, 
                    assignment.isActive
                )
            }
            
            set({ loadingModules: false })
        } catch (error) {
            console.error('Error updating module assignments:', error)
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al actualizar las asignaciones'
            
            set({ 
                error: errorMessage, 
                loadingModules: false 
            })
            
            throw error
        }
    }
}))
