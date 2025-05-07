/**
 * agentprop/src/app/(protected-pages)/modules/superadmin/variable-builder/_store/systemVariablesStore.ts // Corrected path
 * Zustand store for managing system variables state (SUPERADMIN)
 * @version 1.0.4 // Updated version
 * @updated 2025-10-04 // Implemented CRUD operations without JSX
 */

import { create } from 'zustand'
import { createClient } from '@supabase/supabase-js'
import { showError } from '@/utils/notifications' // Import notification utility

// Interface para opciones de selección
interface SelectOption {
    value: string;
    label: string;
}

// Interface matching the one in the page component (consider centralizing types)
interface SystemVariable {
    id: string
    name: string
    display_name: string
    type: string
    category_id?: string
    category_name?: string
    is_tenant_configurable: boolean
    is_sensitive: boolean
    default_value?: string
    updated_at: string
    // Add other fields as needed from the DB schema
    validation?: Record<string, unknown> // Changed any to unknown
    options?: SelectOption[] // Typed as SelectOption array
    description?: string
    vertical_id?: string
}

// Export the state interface
export interface SystemVariablesState {
    variables: SystemVariable[]
    loading: boolean
    error: string | null
    fetchVariables: () => Promise<void>
    addVariable: (newVariableData: Omit<SystemVariable, 'id' | 'updated_at'>) => Promise<void>
    updateVariable: (variableId: string, updatedData: Partial<SystemVariable>) => Promise<void>
    deleteVariable: (variableId: string) => Promise<void>
}

// Supabase client (consider centralizing)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Crear cliente con headers personalizados para asegurar que se envía el rol correcto
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Prefer': 'return=representation'
        },
    },
})

export const useSystemVariablesStore = create<SystemVariablesState>((set) => ({
    variables: [],
    loading: false,
    error: null,

    fetchVariables: async () => {
        set({ loading: true, error: null })
        try {
            // TODO: Add join with variable_categories if needed
            const { data, error: fetchError } = await supabase
                .from('system_variables')
                .select('*') // Select all columns for now
                .order('name', { ascending: true })

            if (fetchError) {
                throw fetchError
            }
            set({ variables: data as SystemVariable[], loading: false })
        } catch (err) {
            console.error('Error fetching system variables in store:', err)
            const errorMessage =
                'No se pudieron cargar las variables del sistema desde el store.'
            set({ error: errorMessage, loading: false })
            const message =
                err instanceof Error ? err.message : 'Error desconocido'
            // Use notification utility
            showError(`${message}`, errorMessage, { placement: 'top-center' })
        }
    },

    addVariable: async (newVariableData) => {
        set({ loading: true })
        try {
            console.log('Data to insert:', JSON.stringify(newVariableData, null, 2));
            
            // Asegurar que el formato de los datos sea correcto
            const sanitizedData = {
                name: newVariableData.name,
                display_name: newVariableData.display_name,
                description: newVariableData.description || null,
                type: newVariableData.type,
                default_value: newVariableData.default_value || null,
                is_tenant_configurable: !!newVariableData.is_tenant_configurable,
                is_sensitive: !!newVariableData.is_sensitive,
                options: Array.isArray(newVariableData.options) ? newVariableData.options : null,
                validation: newVariableData.validation || null,
                category_id: newVariableData.category_id || null,
                vertical_id: newVariableData.vertical_id || null,
            };
            
            console.log('Sanitized data:', JSON.stringify(sanitizedData, null, 2));
            
            // Verificar si la tabla existe antes de intentar insertar
            try {
                const { error: tableError } = await supabase
                    .from('system_variables')
                    .select('id')
                    .limit(1);
                    
                if (tableError) {
                    console.error('Error al verificar la tabla system_variables:', tableError);
                    throw new Error(`Error verificando tabla: ${tableError.message}`);
                }
            } catch (tableErr) {
                console.error('Error verificando tabla:', tableErr);
                // Continuamos a pesar del error para intentar insertar de todos modos
            }
            
            // Usar try/catch específico para la inserción
            try {
                // Verificar primero si ya existe una variable con ese nombre
                const { data: existingVariable, error: checkError } = await supabase
                    .from('system_variables')
                    .select('id')
                    .eq('name', sanitizedData.name)
                    .maybeSingle();
                
                if (checkError) {
                    console.error('Error verificando existencia de variable:', checkError);
                    throw new Error(`Error de verificación: ${checkError.message}`);
                }
                
                if (existingVariable) {
                    throw new Error(`Ya existe una variable con el nombre "${sanitizedData.name}". Por favor, usa un nombre diferente.`);
                }
                
                // Intentar insertar el registro
                const { data, error } = await supabase
                    .from('system_variables')
                    .insert([sanitizedData])
                    .select();
                
                if (error) {
                    console.error('Supabase insert error details:', error);
                    throw new Error(`Error insertando: ${error.message}`);
                }
                
                if (data && data.length > 0) {
                    set((state) => ({
                        variables: [...state.variables, data[0] as SystemVariable],
                        loading: false,
                    }));
                    return Promise.resolve();
                } else {
                    throw new Error('No se recibieron datos después de la inserción');
                }
            } catch (insertErr) {
                console.error('Error específico en inserción:', insertErr);
                throw new Error(`Error al insertar: ${insertErr instanceof Error ? insertErr.message : 'Error desconocido'}`);
            }
        } catch (err) {
            console.error('Error adding system variable:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido';
            set({ loading: false, error: `Error al crear variable: ${message}` });
            // Use notification utility
            showError(`${message}`, 'Error al crear variable', { placement: 'top-center' });
            return Promise.reject(err);
        }
    },

    updateVariable: async (variableId, updatedData) => {
        set({ loading: true })
        try {
            const { data, error } = await supabase
                .from('system_variables')
                .update(updatedData)
                .eq('id', variableId)
                .select()
                
            if (error) {
                console.error('Supabase update error details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }
            
            if (data) {
                set((state) => ({
                    variables: state.variables.map((v) => 
                        v.id === variableId ? { ...v, ...data[0] } : v
                    ),
                    loading: false,
                }))
            }
            return Promise.resolve()
        } catch (err) {
            console.error('Error updating system variable:', err)
            const message = err instanceof Error ? err.message : 'Error desconocido'
            set({ loading: false, error: `Error al actualizar variable: ${message}` })
            // Use notification utility
            showError(`${message}`, 'Error al actualizar variable', { placement: 'top-center' })
            return Promise.reject(err)
        }
    },

    deleteVariable: async (variableId) => {
        set({ loading: true })
        try {
            const { error } = await supabase
                .from('system_variables')
                .delete()
                .eq('id', variableId)
                
            if (error) {
                console.error('Supabase delete error details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }
            
            set((state) => ({
                variables: state.variables.filter((v) => v.id !== variableId),
                loading: false,
            }))
            return Promise.resolve()
        } catch (err) {
            console.error('Error deleting system variable:', err)
            const message = err instanceof Error ? err.message : 'Error desconocido'
            set({ loading: false, error: `Error al eliminar variable: ${message}` })
            // Use notification utility
            showError(`${message}`, 'Error al eliminar variable', { placement: 'top-center' })
            return Promise.reject(err)
        }
    },
}))
