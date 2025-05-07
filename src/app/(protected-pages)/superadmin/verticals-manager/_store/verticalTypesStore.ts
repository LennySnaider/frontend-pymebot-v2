/**
 * frontend/src/app/(protected-pages)/superadmin/verticals-manager/_store/verticalTypesStore.ts
 * Store para gestión de tipos de verticales
 * @version 1.1.0
 * @updated 2025-05-01
 */

import { create } from 'zustand'
import { supabase } from '@/services/supabase/SupabaseClient'

export interface VerticalType {
    id: string
    vertical_id: string
    name: string
    code: string
    description: string
    icon: string
    default_settings: Record<string, any>
    is_active: boolean
    created_at: string
    updated_at: string
    // Campos relacionados (expandidos)
    vertical_name?: string
    vertical_code?: string
}

interface VerticalTypesState {
    types: VerticalType[]
    typesGroupedByVertical: Record<string, VerticalType[]>
    loading: boolean
    error: string | null
    
    // Acciones
    fetchTypes: () => Promise<void>
    fetchTypesByVertical: (verticalId: string) => Promise<VerticalType[]>
    createType: (type: Omit<VerticalType, 'id' | 'created_at' | 'updated_at'>) => Promise<VerticalType>
    updateType: (id: string, type: Partial<VerticalType>) => Promise<VerticalType>
    deleteType: (id: string) => Promise<void>
    
    // Clonación de configuraciones
    cloneTypeSettings: (sourceTypeId: string, targetTypeId: string) => Promise<VerticalType>
}

export const useVerticalTypesStore = create<VerticalTypesState>((set, get) => ({
    types: [],
    typesGroupedByVertical: {},
    loading: false,
    error: null,

    fetchTypes: async () => {
        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('vertical_types')
                .select(`
                    *
                `)
                .order('name', { ascending: true })
            
            if (error) {
                throw new Error(error.message || 'Error en la consulta a la base de datos')
            }
            
            // Obtener los datos relacionados de verticales en una consulta separada
            const verticalIds = [...new Set(data?.map(item => item.vertical_id) || [])]
            
            let verticalsData: Record<string, { name: string, code: string }> = {}
            
            if (verticalIds.length > 0) {
                const { data: verticalsResult, error: verticalsError } = await supabase
                    .from('verticals')
                    .select('id, name, code')
                    .in('id', verticalIds)
                
                if (verticalsError) {
                    console.error('Error fetching verticals data:', verticalsError)
                } else {
                    verticalsData = verticalsResult.reduce((acc, vertical) => {
                        acc[vertical.id] = { name: vertical.name, code: vertical.code }
                        return acc
                    }, {} as Record<string, { name: string, code: string }>)
                }
            }
            
            // Procesar los datos para añadir los campos expandidos
            const processedData = data?.map(item => ({
                ...item,
                vertical_name: verticalsData[item.vertical_id]?.name || 'Desconocido',
                vertical_code: verticalsData[item.vertical_id]?.code || 'unknown'
            })) || []
            
            // Agrupar los tipos por vertical
            const grouped: Record<string, VerticalType[]> = {}
            
            processedData.forEach(type => {
                if (!grouped[type.vertical_id]) {
                    grouped[type.vertical_id] = []
                }
                grouped[type.vertical_id].push(type)
            })
            
            set({ 
                types: processedData,
                typesGroupedByVertical: grouped,
                loading: false 
            })
        } catch (error) {
            console.error('Error fetching vertical types:', error)
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al cargar los tipos de verticales'
            
            set({ 
                error: errorMessage, 
                loading: false 
            })
            
            throw error
        }
    },

    fetchTypesByVertical: async (verticalId) => {
        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('vertical_types')
                .select(`
                    *
                `)
                .eq('vertical_id', verticalId)
                .order('name', { ascending: true })
            
            if (error) {
                throw new Error(error.message || 'Error en la consulta a la base de datos')
            }
            
            // Obtener los datos de la vertical
            const { data: verticalData, error: verticalError } = await supabase
                .from('verticals')
                .select('id, name, code')
                .eq('id', verticalId)
                .single()
            
            // Definir nombre y código de la vertical
            const verticalInfo = !verticalError && verticalData
                ? { name: verticalData.name, code: verticalData.code }
                : { name: 'Desconocido', code: 'unknown' }
            
            // Procesar los datos para añadir los campos expandidos
            const processedData = data?.map(item => ({
                ...item,
                vertical_name: verticalInfo.name,
                vertical_code: verticalInfo.code
            })) || []
            
            // Actualizar el estado con los nuevos tipos para esta vertical
            set((state) => ({
                typesGroupedByVertical: {
                    ...state.typesGroupedByVertical,
                    [verticalId]: processedData
                },
                loading: false
            }))
            
            return processedData
        } catch (error) {
            console.error('Error fetching types by vertical:', error)
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Error desconocido al cargar los tipos de la vertical'
            
            set({ 
                error: errorMessage, 
                loading: false 
            })
            
            throw error
        }
    },

    createType: async (typeData) => {
        try {
            console.log('Creating vertical type with data:', typeData)
            
            const { data, error } = await supabase
                .from('vertical_types')
                .insert([typeData])
                .select('*')
                .single()
                
            if (error) {
                console.error('Error inserting vertical type:', error)
                throw new Error(error.message || 'Error al crear el tipo de vertical')
            }
            
            console.log('Created vertical type:', data)
            
            // Obtener datos de la vertical
            const { data: verticalData, error: verticalError } = await supabase
                .from('verticals')
                .select('id, name, code')
                .eq('id', data.vertical_id)
                .single()
                
            if (verticalError) {
                console.error('Error fetching vertical data:', verticalError)
            }
            
            // Procesar para añadir campos expandidos
            const processedType = {
                ...data,
                vertical_name: verticalData?.name || 'Desconocido',
                vertical_code: verticalData?.code || 'unknown'
            }
            
            // Actualizar el estado
            set((state) => {
                // Actualizar lista completa
                const updatedTypes = [...state.types, processedType]
                
                // Actualizar grupo de esta vertical
                const verticalId = processedType.vertical_id
                const verticalTypes = state.typesGroupedByVertical[verticalId] || []
                
                return {
                    types: updatedTypes,
                    typesGroupedByVertical: {
                        ...state.typesGroupedByVertical,
                        [verticalId]: [...verticalTypes, processedType]
                    }
                }
            })
            
            return processedType
        } catch (error) {
            console.error('Error creating vertical type:', error)
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error(`Error desconocido al crear el tipo de vertical: ${JSON.stringify(error)}`)
            }
        }
    },

    updateType: async (id, typeData) => {
        try {
            const { data, error } = await supabase
                .from('vertical_types')
                .update(typeData)
                .eq('id', id)
                .select('*')
                .single()
                
            if (error) {
                console.error('Error updating vertical type:', error)
                throw new Error(error.message || 'Error al actualizar el tipo de vertical')
            }
                
            // Obtener datos de la vertical
            const { data: verticalData, error: verticalError } = await supabase
                .from('verticals')
                .select('id, name, code')
                .eq('id', data.vertical_id)
                .single()
                
            if (verticalError) {
                console.error('Error fetching vertical data:', verticalError)
            }
            
            // Procesar para añadir campos expandidos
            const processedType = {
                ...data,
                vertical_name: verticalData?.name || 'Desconocido',
                vertical_code: verticalData?.code || 'unknown'
            }
            
            // Actualizar el estado
            set((state) => {
                // Actualizar lista completa
                const updatedTypes = state.types.map((t) => 
                    t.id === id ? processedType : t
                )
                
                // Actualizar grupo de esta vertical
                const verticalId = processedType.vertical_id
                const verticalTypes = state.typesGroupedByVertical[verticalId] || []
                
                return {
                    types: updatedTypes,
                    typesGroupedByVertical: {
                        ...state.typesGroupedByVertical,
                        [verticalId]: verticalTypes.map((t) => 
                            t.id === id ? processedType : t
                        )
                    }
                }
            })
            
            return processedType
        } catch (error) {
            console.error('Error updating vertical type:', error)
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error(`Error desconocido al actualizar el tipo de vertical: ${JSON.stringify(error)}`)
            }
        }
    },

    deleteType: async (id) => {
        try {
            // Primero obtener el tipo para conocer su vertical_id
            const typeToDelete = get().types.find(t => t.id === id)
            if (!typeToDelete) throw new Error('Tipo no encontrado')
            
            const { error } = await supabase
                .from('vertical_types')
                .delete()
                .eq('id', id)
            
            if (error) throw error
            
            // Actualizar el estado
            set((state) => {
                // Actualizar lista completa
                const updatedTypes = state.types.filter((t) => t.id !== id)
                
                // Actualizar grupo de esta vertical
                const verticalId = typeToDelete.vertical_id
                const verticalTypes = state.typesGroupedByVertical[verticalId] || []
                
                return {
                    types: updatedTypes,
                    typesGroupedByVertical: {
                        ...state.typesGroupedByVertical,
                        [verticalId]: verticalTypes.filter((t) => t.id !== id)
                    }
                }
            })
        } catch (error) {
            console.error('Error deleting vertical type:', error)
            throw new Error('Error al eliminar el tipo de vertical')
        }
    },

    cloneTypeSettings: async (sourceTypeId, targetTypeId) => {
        try {
            // Obtener la configuración del tipo origen
            const sourceType = get().types.find(t => t.id === sourceTypeId)
            if (!sourceType) throw new Error('Tipo de origen no encontrado')
            
            // Actualizar el tipo destino con la misma configuración
            const { data, error } = await supabase
                .from('vertical_types')
                .update({
                    default_settings: sourceType.default_settings
                })
                .eq('id', targetTypeId)
                .select('*')
                .single()
                
            if (error) {
                console.error('Error updating settings:', error)
                throw new Error(error.message || 'Error al clonar configuraciones del tipo')
            }
                
            // Obtener datos de la vertical
            const { data: verticalData, error: verticalError } = await supabase
                .from('verticals')
                .select('id, name, code')
                .eq('id', data.vertical_id)
                .single()
                
            if (verticalError) {
                console.error('Error fetching vertical data:', verticalError)
            }
            
            // Procesar para añadir campos expandidos
            const processedType = {
                ...data,
                vertical_name: verticalData?.name || 'Desconocido',
                vertical_code: verticalData?.code || 'unknown'
            }
            
            // Actualizar el estado
            set((state) => {
                // Actualizar lista completa
                const updatedTypes = state.types.map((t) => 
                    t.id === targetTypeId ? processedType : t
                )
                
                // Actualizar grupo de esta vertical
                const verticalId = processedType.vertical_id
                const verticalTypes = state.typesGroupedByVertical[verticalId] || []
                
                return {
                    types: updatedTypes,
                    typesGroupedByVertical: {
                        ...state.typesGroupedByVertical,
                        [verticalId]: verticalTypes.map((t) => 
                            t.id === targetTypeId ? processedType : t
                        )
                    }
                }
            })
            
            return processedType
        } catch (error) {
            console.error('Error cloning type settings:', error)
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error(`Error desconocido al clonar configuraciones del tipo: ${JSON.stringify(error)}`)
            }
        }
    }
}))
