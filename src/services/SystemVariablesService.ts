'use client'

/**
 * agentprop/src/services/SystemVariablesService.ts
 * Servicio para gestionar las variables del sistema
 * @version 1.1.0
 * @created 2025-10-04
 * @updated 2025-05-07
 */

import { supabase } from '@/services/supabase/SupabaseClient'
import { notifications } from '@/utils/notifications'

// Interfaz para las opciones de selección
export interface SelectOption {
    value: string
    label: string
}

// Interfaz para las variables del sistema
export interface SystemVariable {
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
    validation?: Record<string, unknown>
    options?: SelectOption[]
    description?: string
    vertical_id?: string
}

// Clase Singleton para gestionar variables del sistema
export class SystemVariablesService {
    private static instance: SystemVariablesService;

    /**
     * Constructor del servicio
     */
    private constructor() {
        // Inicialización privada
    }

    /**
     * Obtiene la instancia del servicio
     */
    public static getInstance(): SystemVariablesService {
        if (!SystemVariablesService.instance) {
            SystemVariablesService.instance = new SystemVariablesService();
        }
        return SystemVariablesService.instance;
    }

    /**
     * Obtiene todas las variables del sistema
     * @returns Promise con el array de variables del sistema
     */
    public async getAllVariables(): Promise<SystemVariable[]> {
        try {
            const { data, error } = await supabase
                .from('system_variables')
                .select('*')
                .order('name', { ascending: true })

            if (error) {
                console.error('Error al obtener variables del sistema:', error)
                notifications.error('Error al cargar variables del sistema')
                return []
            }

            return data as SystemVariable[]
        } catch (error) {
            console.error('Error inesperado al obtener variables del sistema:', error)
            notifications.error('Error inesperado al cargar variables del sistema')
            return []
        }
    }

    /**
     * Obtiene una variable del sistema por su ID
     * @param id ID de la variable
     * @returns Promise con la variable del sistema o null si no existe
     */
    public async getVariableById(id: string): Promise<SystemVariable | null> {
        try {
            const { data, error } = await supabase
                .from('system_variables')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Error al obtener variable del sistema:', error)
                return null
            }

            return data as SystemVariable
        } catch (error) {
            console.error('Error inesperado al obtener variable del sistema:', error)
            return null
        }
    }

    /**
     * Obtiene una variable del sistema por su nombre
     * @param name Nombre de la variable
     * @returns Promise con la variable del sistema o null si no existe
     */
    public async getVariableByName(name: string): Promise<SystemVariable | null> {
        try {
            const { data, error } = await supabase
                .from('system_variables')
                .select('*')
                .eq('name', name)
                .single()

            if (error) {
                console.error('Error al obtener variable del sistema:', error)
                return null
            }

            return data as SystemVariable
        } catch (error) {
            console.error('Error inesperado al obtener variable del sistema:', error)
            return null
        }
    }

    /**
     * Obtiene el valor de una variable por su nombre
     * @param name Nombre de la variable
     * @returns Promise con el valor de la variable o null si no existe
     */
    public async getVariableValue(name: string): Promise<string | null> {
        const variable = await this.getVariableByName(name);
        return variable?.default_value || null;
    }

    /**
     * Obtiene múltiples variables del sistema por sus nombres
     * @param names Nombres de las variables
     * @returns Objeto con los valores de las variables
     */
    public async getVariables(names: string[]): Promise<Record<string, string>> {
        try {
            const { data, error } = await supabase
                .from('system_variables')
                .select('name, default_value')
                .in('name', names);

            if (error) {
                console.error('Error al obtener variables del sistema:', error);
                return {};
            }

            // Convertir a objeto {name: default_value}
            const variables: Record<string, string> = {};
            data.forEach((item: any) => {
                if (item.default_value !== null && item.default_value !== undefined) {
                    variables[item.name] = item.default_value;
                }
            });

            return variables;
        } catch (error) {
            console.error('Error inesperado al obtener variables del sistema:', error);
            return {};
        }
    }

    /**
     * Establece el valor de una variable del sistema
     * @param name Nombre de la variable
     * @param value Valor de la variable
     */
    public async setVariable(name: string, value: string): Promise<boolean> {
        try {
            // Verificar si la variable ya existe
            const existingVar = await this.getVariableByName(name);

            let result;

            if (existingVar) {
                // Actualizar variable existente
                result = await supabase
                    .from('system_variables')
                    .update({ 
                        default_value: value,
                        updated_at: new Date().toISOString() 
                    })
                    .eq('name', name);
            } else {
                // Insertar nueva variable
                result = await supabase
                    .from('system_variables')
                    .insert({
                        name,
                        display_name: name,
                        type: 'string',
                        is_tenant_configurable: false,
                        is_sensitive: name.includes('API_KEY') || name.includes('SECRET') || name.includes('PASSWORD'),
                        default_value: value,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
            }

            if (result.error) {
                console.error('Error al establecer variable del sistema:', result.error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al establecer variable del sistema:', error);
            return false;
        }
    }

    /**
     * Formatea una variable del sistema para mostrarla en un selector
     * @param variable Variable del sistema
     * @returns Objeto con value y label para usar en un selector
     */
    public formatVariableForSelector(variable: SystemVariable): SelectOption {
        return {
            value: variable.name,
            label: `${variable.display_name} (${variable.name})`,
        }
    }

    /**
     * Formatea el nombre de una variable para su uso en texto
     * @param variableName Nombre de la variable
     * @returns Nombre formateado para usar en texto (ej: {{variable_name}})
     */
    public formatVariableName(variableName: string): string {
        return `{{${variableName}}}`
    }

    /**
     * Verifica si un texto contiene variables del sistema
     * @param text Texto a verificar
     * @returns true si el texto contiene variables, false en caso contrario
     */
    public containsVariables(text: string): boolean {
        const variableRegex = /\{\{([^}]+)\}\}/g
        return variableRegex.test(text)
    }

    /**
     * Extrae los nombres de las variables de un texto
     * @param text Texto del que extraer las variables
     * @returns Array con los nombres de las variables encontradas
     */
    public extractVariableNames(text: string): string[] {
        const variableRegex = /\{\{([^}]+)\}\}/g
        const matches = text.matchAll(variableRegex)
        const variableNames: string[] = []

        for (const match of matches) {
            if (match[1]) {
                variableNames.push(match[1])
            }
        }

        return variableNames
    }

    /**
     * Reemplaza las variables en un texto con sus valores
     * @param text Texto con variables
     * @param variables Objeto con los valores de las variables
     * @returns Texto con las variables reemplazadas
     */
    public replaceVariables(text: string, variables: Record<string, string | number | boolean | null | undefined>): string {
        if (!text) return ''
        
        return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
            return variables[variableName] !== undefined ? String(variables[variableName]) : match
        })
    }
}

// Para compatibilidad con código existente
export const getSystemVariables = async (): Promise<SystemVariable[]> => {
    return SystemVariablesService.getInstance().getAllVariables();
}

export const getSystemVariableById = async (id: string): Promise<SystemVariable | null> => {
    return SystemVariablesService.getInstance().getVariableById(id);
}

export const getSystemVariableByName = async (name: string): Promise<SystemVariable | null> => {
    return SystemVariablesService.getInstance().getVariableByName(name);
}

export const formatVariableForSelector = (variable: SystemVariable): SelectOption => {
    return SystemVariablesService.getInstance().formatVariableForSelector(variable);
}

export const formatVariableName = (variableName: string): string => {
    return SystemVariablesService.getInstance().formatVariableName(variableName);
}

export const containsVariables = (text: string): boolean => {
    return SystemVariablesService.getInstance().containsVariables(text);
}

export const extractVariableNames = (text: string): string[] => {
    return SystemVariablesService.getInstance().extractVariableNames(text);
}

export const replaceVariables = (text: string, variables: Record<string, string | number | boolean | null | undefined>): string => {
    return SystemVariablesService.getInstance().replaceVariables(text, variables);
}

export default {
    getSystemVariables,
    getSystemVariableById,
    getSystemVariableByName,
    formatVariableForSelector,
    formatVariableName,
    containsVariables,
    extractVariableNames,
    replaceVariables,
    SystemVariablesService,
}