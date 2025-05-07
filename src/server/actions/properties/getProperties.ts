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

import { supabase } from '@/services/supabase/SupabaseClient'
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

// Datos de ejemplo como fallback cuando Supabase no está disponible
const MOCK_PROPERTIES = [
    {
        id: '9dd01c94-8f92-4114-8a19-3404cb3ff1a9',
        name: 'Casa Claudia (Datos de ejemplo)',
        description: 'Casa Claudia es una exclusiva propiedad en Querétaro',
        propertyType: 'house',
        status: 'available',
        price: 7845000,
        currency: 'MXN',
        location: {
            address: 'Blvd. Paseos del Pedregal 731',
            city: 'Querétaro', 
            state: 'Querétaro',
            country: 'México',
            zipCode: '76226',
            colony: 'Grand Juriquilla',
            coordinates: {
                lat: 20.741862,
                lng: -100.473159
            },
            showApproximateLocation: false
        },
        media: [],
        features: {
            bedrooms: 3,
            bathrooms: 3.5,
            parkingSpots: 3,
            hasGarage: true,
            hasGarden: true,
            hasPool: false,
            hasSecurity: false,
            area: 318,
            areaUnit: 'm²',
            yearBuilt: 2025
        },
        code: 'VJUQ-002',
        operationType: 'sale',
        agent_id: 'agent-3'
    }
];

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
        
        // Si no hay sesión, devolver datos de ejemplo en modo desarrollo
        if (!session) {
            console.warn('No hay sesión activa, usando datos de ejemplo')
            return {
                properties: MOCK_PROPERTIES,
                list: MOCK_PROPERTIES,
                total: MOCK_PROPERTIES.length,
                page,
                limit,
                error: 'No hay sesión activa. Mostrando datos de ejemplo.',
                isMockData: true
            }
        }
        
        // Intentar obtener el tenant_id (si falla, usar datos de ejemplo)
        let tenant_id;
        try {
            tenant_id = await getTenantFromSession()
            if (!tenant_id) {
                console.warn('No se pudo determinar el tenant, usando datos de ejemplo')
                return {
                    properties: MOCK_PROPERTIES,
                    list: MOCK_PROPERTIES,
                    total: MOCK_PROPERTIES.length,
                    page,
                    limit,
                    error: 'No se pudo determinar el tenant. Mostrando datos de ejemplo.',
                    isMockData: true
                }
            }
        } catch (tenantError) {
            console.error('Error al obtener tenant_id:', tenantError)
            return {
                properties: MOCK_PROPERTIES,
                list: MOCK_PROPERTIES,
                total: MOCK_PROPERTIES.length,
                page,
                limit,
                error: 'Error al obtener tenant_id. Mostrando datos de ejemplo.',
                isMockData: true
            }
        }
        
        // Calcular rango para paginación
        const from = (page - 1) * limit
        const to = from + limit - 1
        
        // Intentar obtener datos reales de Supabase
        try {
            // Construir la consulta
            console.log('Preparando consulta a Supabase para tenant_id:', tenant_id)
            let query = supabase
                .from('properties')
                .select('*, property_images(*)', { count: 'exact' })
                .range(from, to)
            
            // Filtrar por tenant_id si no es super_admin
            if (session.role !== 'super_admin' || !session.tenant_id) {
                query = query.eq('tenant_id', tenant_id)
            }
            
            // Ejecutar la consulta
            console.log('Ejecutando consulta a Supabase...')
            const response = await query
            
            // Manejar posibles errores
            if (response.error) {
                console.error('Error en la consulta a Supabase:', response.error)
                // Fallback a datos de ejemplo si hay error
                return {
                    properties: MOCK_PROPERTIES,
                    list: MOCK_PROPERTIES,
                    total: MOCK_PROPERTIES.length,
                    page,
                    limit,
                    error: `Error en la consulta a Supabase: ${response.error.message || 'Error desconocido'}. Mostrando datos de ejemplo.`,
                    isMockData: true
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
            // Si cualquier operación con Supabase falla, usar datos de ejemplo
            console.error('Error al obtener datos de Supabase:', supabaseError)
            return {
                properties: MOCK_PROPERTIES,
                list: MOCK_PROPERTIES,
                total: MOCK_PROPERTIES.length,
                page,
                limit,
                error: `Error al obtener datos de Supabase. Mostrando datos de ejemplo.`,
                isMockData: true
            }
        }
    } catch (err) {
        // Capturar cualquier otro error inesperado
        console.error('Error general en getProperties:', err)
        return {
            properties: MOCK_PROPERTIES,
            list: MOCK_PROPERTIES,
            total: MOCK_PROPERTIES.length,
            page,
            limit,
            error: 'Error inesperado. Mostrando datos de ejemplo.',
            isMockData: true
        }
    }
}
