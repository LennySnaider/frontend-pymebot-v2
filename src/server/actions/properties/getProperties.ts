'use server';

/**
 * frontend/src/server/actions/properties/getProperties.ts
 * Server action para obtener propiedades con paginación y filtros.
 * Mejorado para usar el mapeador de propiedades para transformar formatos.
 * Incluye modo de respaldo cuando Supabase no está disponible.
 * 
 * @version 2.4.0
 * @updated 2025-07-14
 */

import { createServiceClient } from '@/services/supabase/server'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'
import getServerSession from '@/server/actions/auth/getServerSession'
import { mapSupabaseToProperties } from '@/services/mappers/PropertyMapper'
import type { Property } from '@/app/(protected-pages)/modules/properties/property-list/types'

// Definir tipo para los resultados
type PropertyResult = {
    properties: any[],
    list: any[],
    total: number,
    page?: number,
    limit?: number,
    error?: string,
    isMockData?: boolean // Indica si se están usando datos de ejemplo
};

// No usar datos mock - consultar solo datos reales de la base de datos

/**
 * Obtener propiedades con filtros y paginación
 * 
 * @param params Parámetros de búsqueda, filtrado y paginación
 * @returns Lista de propiedades mapeadas y total
 */
export async function getProperties(params: any = {}): Promise<PropertyResult> {
    // Valores por defecto para paginación
    const page = params.page ? parseInt(String(params.page), 10) : 1
    const limit = params.limit ? parseInt(String(params.limit), 10) : 10
    
    try {
        console.log('Iniciando getProperties')
        
        // Obtener sesión del usuario
        const session = await getServerSession()
        
        // Si no hay sesión, devolver lista vacía
        if (!session) {
            console.warn('No hay sesión activa')
            return {
                properties: [],
                list: [],
                total: 0,
                page,
                limit,
                error: 'No hay sesión activa.',
                isMockData: false
            }
        }
        
        // Intentar obtener el tenant_id (si falla, usar datos de ejemplo)
        let tenant_id;
        try {
            tenant_id = await getTenantFromSession()
            if (!tenant_id) {
                console.warn('No se pudo determinar el tenant')
                return {
                    properties: [],
                    list: [],
                    total: 0,
                    page,
                    limit,
                    error: 'No se pudo determinar el tenant.',
                    isMockData: false
                }
            }
        } catch (tenantError) {
            console.error('Error al obtener tenant_id:', tenantError)
            return {
                properties: [],
                list: [],
                total: 0,
                page,
                limit,
                error: 'Error al obtener tenant_id.',
                isMockData: false
            }
        }
        
        // Calcular rango para paginación
        const from = (page - 1) * limit
        const to = from + limit - 1
        
        // Intentar obtener datos reales de Supabase
        try {
            // Usar el cliente de servicio para bypasear RLS
            const supabase = createServiceClient()
            
            // Construir la consulta usando la vista v_products_with_properties
            console.log('Preparando consulta a Supabase para tenant_id:', tenant_id)
            let query = supabase
                .from('v_products_with_properties')
                .select('*', { count: 'exact' })
                .eq('category_name', 'Propiedades Inmobiliarias')
                .range(from, to)
            
            // Filtrar por tenant_id si no es super_admin
            // Super admin puede ver todas las propiedades sin filtrar por tenant
            const userRole = session?.user?.role
            console.log('Role del usuario detectado:', userRole)
            
            // Solo aplicar filtro si NO es super_admin
            if (userRole !== 'super_admin') {
                console.log('Aplicando filtro por tenant_id:', tenant_id)
                query = query.eq('tenant_id', tenant_id)
            } else {
                console.log('Usuario super_admin detectado - Mostrando TODAS las propiedades sin filtro de tenant')
            }
            
            // Ejecutar la consulta
            console.log('Ejecutando consulta a Supabase...')
            const response = await query
            
            console.log('Respuesta de Supabase:', {
                data: response.data,
                count: response.count,
                error: response.error,
                status: response.status,
                statusText: response.statusText
            })
            
            // Manejar posibles errores
            if (response.error) {
                console.error('Error en la consulta a Supabase:', response.error)
                return {
                    properties: [],
                    list: [],
                    total: 0,
                    page,
                    limit,
                    error: `Error en la consulta a Supabase: ${response.error.message || 'Error desconocido'}`,
                    isMockData: false
                }
            }
            
            // Si no hay errores, procesar los datos reales
            const data = response.data || []
            const count = response.count || 0
            
            // Si no hay datos pero tampoco errores, puede ser un caso válido de cero propiedades
            if (data.length === 0) {
                console.log('No se encontraron propiedades para este tenant')
                return {
                    properties: [],
                    list: [],
                    total: 0,
                    page,
                    limit
                }
            }
            
            // Mapear los datos
            const mappedProperties = mapSupabaseToProperties(data)
            
            // Devolver resultado exitoso con datos reales
            return {
                properties: mappedProperties,
                list: mappedProperties,
                total: count,
                page,
                limit
            }
            
        } catch (supabaseError) {
            console.error('Error al obtener datos de Supabase:', supabaseError)
            return {
                properties: [],
                list: [],
                total: 0,
                page,
                limit,
                error: `Error al obtener datos de Supabase.`,
                isMockData: false
            }
        }
    } catch (err) {
        // Capturar cualquier otro error inesperado
        console.error('Error general en getProperties:', err)
        return {
            properties: [],
            list: [],
            total: 0,
            page,
            limit,
            error: 'Error inesperado.',
            isMockData: false
        }
    }
}
