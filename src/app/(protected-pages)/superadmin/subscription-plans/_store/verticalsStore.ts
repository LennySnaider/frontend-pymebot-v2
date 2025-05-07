/**
 * frontend/src/app/(protected-pages)/modules/superadmin/subscription-plans/_store/verticalsStore.ts
 * Store para gestión de verticales de negocio
 * @version 1.1.0
 * @updated 2025-04-14
 */

import { create } from 'zustand'
import { supabase } from '@/services/supabase/SupabaseClient'

export interface VerticalCategory {
    id: string
    name: string
    code: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Vertical {
    id: string
    name: string
    code: string
    description: string
    icon: string
    brand_name: string
    is_active: boolean
    created_at: string
    updated_at: string
    modules?: string[] // IDs de módulos asociados a esta vertical
    categories?: VerticalCategory[] // Categorías de la vertical
}

interface VerticalsState {
    verticals: Vertical[]
    loading: boolean
    error: string | null
    fetchVerticals: () => Promise<void>
    createVertical: (vertical: Omit<Vertical, 'id' | 'created_at' | 'updated_at' | 'categories'>) => Promise<Vertical>
    updateVertical: (id: string, vertical: Partial<Vertical>) => Promise<Vertical>
    deleteVertical: (id: string) => Promise<void>
    // Gestión de la relación con módulos
    associateModules: (verticalId: string, moduleIds: string[]) => Promise<void>
    getVerticalModules: (verticalId: string) => Promise<string[]>
    // Gestión de categorías
    getVerticalCategories: (verticalId: string) => Promise<VerticalCategory[]>
    createCategory: (category: Omit<VerticalCategory, 'id' | 'created_at' | 'updated_at'>) => Promise<VerticalCategory>
    updateCategory: (id: string, category: Partial<VerticalCategory>) => Promise<VerticalCategory>
    deleteCategory: (id: string) => Promise<void>
}

export const useVerticalsStore = create<VerticalsState>((set, get) => ({
    verticals: [],
    loading: false,
    error: null,

    fetchVerticals: async () => {
        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('verticals')
                .select('*')
                .order('name', { ascending: true })
            
            if (error) {
                console.error('Supabase query error:', error)
                throw new Error(error.message || 'Error en la consulta a la base de datos')
            }
            
            // Para cada vertical, obtener los módulos asociados y categorías
            const verticalsWithRelations = await Promise.all(
                (data || []).map(async (vertical) => {
                    const modules = await get().getVerticalModules(vertical.id)
                    const categories = await get().getVerticalCategories(vertical.id)
                    return { ...vertical, modules, categories }
                })
            )
            
            set({ verticals: verticalsWithRelations, loading: false })
        } catch (error) {
            console.error('Error fetching verticals:', error)
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al cargar las verticales'
            
            set({ 
                error: errorMessage, 
                loading: false 
            })
            
            throw error
        }
    },

    createVertical: async (verticalData) => {
        try {
            const { data, error } = await supabase
                .from('verticals')
                .insert([verticalData])
                .select()
                .single()
            
            if (error) throw error
            
            const newVertical = { ...data, modules: [] }
            set((state) => ({
                verticals: [...state.verticals, newVertical]
            }))
            
            return newVertical
        } catch (error) {
            console.error('Error creating vertical:', error)
            throw new Error('Error al crear la vertical')
        }
    },

    updateVertical: async (id, verticalData) => {
        try {
            // Separar modules del resto de datos, ya que no es un campo en la tabla verticals
            const { modules, ...dataToUpdate } = verticalData as any
            
            const { data, error } = await supabase
                .from('verticals')
                .update(dataToUpdate)
                .eq('id', id)
                .select()
                .single()
            
            if (error) throw error
            
            // Si se proporcionaron módulos, actualizar las asociaciones
            if (modules) {
                await get().associateModules(id, modules)
            }
            
            // Obtener los módulos actuales para incluirlos en el resultado
            const currentModules = await get().getVerticalModules(id)
            const updatedVertical = { ...data, modules: currentModules }
            
            set((state) => ({
                verticals: state.verticals.map((v) => 
                    v.id === id ? updatedVertical : v
                )
            }))
            
            return updatedVertical
        } catch (error) {
            console.error('Error updating vertical:', error)
            throw new Error('Error al actualizar la vertical')
        }
    },

    deleteVertical: async (id) => {
        try {
            const { error } = await supabase
                .from('verticals')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            set((state) => ({
                verticals: state.verticals.filter((v) => v.id !== id)
            }))
        } catch (error) {
            console.error('Error deleting vertical:', error)
            throw new Error('Error al eliminar la vertical')
        }
    },

    associateModules: async (verticalId, moduleIds) => {
        try {
            // Primero, eliminar todas las asociaciones actuales
            const { error: deleteError } = await supabase
                .from('vertical_modules')
                .delete()
                .eq('vertical_id', verticalId)
                
            if (deleteError) throw deleteError
            
            // Si no hay módulos para asociar, terminar aquí
            if (!moduleIds.length) return
                
            // Crear las nuevas asociaciones
            const associations = moduleIds.map(moduleId => ({
                vertical_id: verticalId,
                module_id: moduleId
            }))
            
            const { error: insertError } = await supabase
                .from('vertical_modules')
                .insert(associations)
                
            if (insertError) throw insertError
            
            // Actualizar el estado local si es necesario
            set((state) => ({
                verticals: state.verticals.map((v) => 
                    v.id === verticalId ? { ...v, modules: moduleIds } : v
                )
            }))
        } catch (error) {
            console.error('Error associating modules to vertical:', error)
            throw new Error('Error al asociar módulos a la vertical')
        }
    },
    
    getVerticalModules: async (verticalId) => {
        try {
            const { data, error } = await supabase
                .from('vertical_modules')
                .select('module_id')
                .eq('vertical_id', verticalId)
                
            if (error) throw error
            
            return data.map(item => item.module_id)
        } catch (error) {
            console.error('Error getting vertical modules:', error)
            return []
        }
    },

    // Gestión de categorías
    getVerticalCategories: async (verticalId) => {
        try {
            const { data, error } = await supabase
                .from('vertical_categories')
                .select('*')
                .eq('vertical_id', verticalId)
                .order('name')
            
            if (error) throw error
            
            return data || []
        } catch (error) {
            console.error('Error getting vertical categories:', error)
            return []
        }
    },

    createCategory: async (categoryData) => {
        try {
            const { data, error } = await supabase
                .from('vertical_categories')
                .insert([categoryData])
                .select()
                .single()
            
            if (error) throw error
            
            // Actualizar el estado local si la categoría pertenece a una vertical cargada
            set((state) => {
                const verticalIndex = state.verticals.findIndex(
                    (v) => v.id === categoryData.vertical_id
                )
                
                if (verticalIndex >= 0) {
                    const updatedVerticals = [...state.verticals]
                    const categories = updatedVerticals[verticalIndex].categories || []
                    updatedVerticals[verticalIndex].categories = [...categories, data]
                    return { verticals: updatedVerticals }
                }
                
                return state
            })
            
            return data
        } catch (error) {
            console.error('Error creating category:', error)
            throw new Error('Error al crear la categoría')
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            const { data, error } = await supabase
                .from('vertical_categories')
                .update(categoryData)
                .eq('id', id)
                .select()
                .single()
            
            if (error) throw error
            
            // Actualizar el estado local
            set((state) => {
                const updatedVerticals = [...state.verticals]
                
                for (let i = 0; i < updatedVerticals.length; i++) {
                    const categories = updatedVerticals[i].categories || []
                    const categoryIndex = categories.findIndex(c => c.id === id)
                    
                    if (categoryIndex >= 0) {
                        updatedVerticals[i].categories = [
                            ...categories.slice(0, categoryIndex),
                            { ...categories[categoryIndex], ...data },
                            ...categories.slice(categoryIndex + 1)
                        ]
                        break
                    }
                }
                
                return { verticals: updatedVerticals }
            })
            
            return data
        } catch (error) {
            console.error('Error updating category:', error)
            throw new Error('Error al actualizar la categoría')
        }
    },

    deleteCategory: async (id) => {
        try {
            // Primero obtenemos la categoría para saber a qué vertical pertenece
            const { data: category, error: fetchError } = await supabase
                .from('vertical_categories')
                .select('vertical_id')
                .eq('id', id)
                .single()
            
            if (fetchError) throw fetchError
            
            // Luego eliminamos la categoría
            const { error } = await supabase
                .from('vertical_categories')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            // Actualizamos el estado local
            set((state) => {
                const updatedVerticals = state.verticals.map(vertical => {
                    if (vertical.id === category.vertical_id && vertical.categories) {
                        return {
                            ...vertical,
                            categories: vertical.categories.filter(c => c.id !== id)
                        }
                    }
                    return vertical
                })
                
                return { verticals: updatedVerticals }
            })
        } catch (error) {
            console.error('Error deleting category:', error)
            throw new Error('Error al eliminar la categoría')
        }
    }
}))
