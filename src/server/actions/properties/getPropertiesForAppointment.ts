/**
 * server/actions/properties/getPropertiesForAppointment.ts
 * Acción del servidor para obtener propiedades recomendadas para una cita basada en las preferencias del lead.
 *
 * @version 1.1.0
 * @updated 2025-04-12
 */

'use server'

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '../tenant/getTenantFromSession'

export interface Property {
    id: string
    title: string // Cambiado de name a title
    latitude?: number
    longitude?: number
    price: number
    currency: string
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    area?: number
    description?: string
    // media?: any[] // Eliminado, las imágenes están en un bucket
    status?: string
}

export async function getPropertiesForAppointment(
    leadId: string,
    agentId?: string,
) {
    try {
        const supabase = SupabaseClient.getInstance()

        // Obtener el tenant actual (tenant_id)
        const tenantId = await getTenantFromSession()

        if (!tenantId) {
            console.warn('No se pudo obtener el tenant_id')
            return []
        }

        console.log(
            'DEBUG - Buscando propiedades para leadId:',
            leadId,
            'agentId:',
            agentId,
            'tenantId:',
            tenantId,
        )

        // Intentar obtener preferencias del lead
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select(
                `
                id,
                property_type,
                budget_min,
                budget_max,
                preferred_zones,
                bedrooms_needed,
                bathrooms_needed,
                features_needed
            `,
            )
            .eq('id', leadId)
            .eq('tenant_id', tenantId)
            .single()

        if (leadError) {
            console.error('Error al obtener preferencias del lead:', leadError)
            console.warn('No se pudo obtener el lead')
            return []
        }

        console.log(
            'DEBUG - Preferencias del lead:',
            JSON.stringify(lead, null, 2),
        )

        // Construir la consulta para propiedades basada en las preferencias del lead
        // TEMPORALMENTE ELIMINAMOS ALGUNOS FILTROS PARA DIAGNÓSTICO
        let query = supabase
            .from('properties')
            .select(
                `
                id,
                title,
                code,
                description,
                property_type,
                price,
                currency,
                status,
                features,
                latitude,
                longitude,
                tenant_id,
                agent_id
            `,
            )
            .eq('tenant_id', tenantId)
        // Comentamos temporalmente el filtro de status para diagnóstico
        // .eq('status', 'available')

        // Comentamos temporalmente los filtros basados en preferencias para diagnóstico
        /*
        // Filtrar por tipo de propiedad si está especificado
        if (lead.property_type) {
            query = query.eq('property_type', lead.property_type)
        }
        
        // Filtrar por rango de precio si está especificado
        if (lead.budget_min) {
            query = query.gte('price', lead.budget_min)
        }
        
        if (lead.budget_max) {
            query = query.lte('price', lead.budget_max)
        }
        
        // Filtrar por habitaciones y baños si están especificados
        if (lead.bedrooms_needed) {
            query = query.gte('features->>bedrooms', lead.bedrooms_needed)
        }
        
        if (lead.bathrooms_needed) {
            query = query.gte('features->>bathrooms', lead.bathrooms_needed)
        }
        
        // Filtrar por zonas preferidas si están especificadas
        if (lead.preferred_zones && lead.preferred_zones.length > 0) {
            // Para filtrar por zonas específicas en un array, usamos la función array_overlaps
            // Esto requerirá una función personalizada en SQL si no está disponible directamente
            // Simplificado para este ejemplo
            // query = query.containedBy('location->>colony', lead.preferred_zones)
        }
        
        // Filtrar por agente si está especificado
        if (agentId) {
            query = query.eq('agent_id', agentId)
        }
        */

        // Limitar a 10 propiedades
        query = query.limit(10)

        // Ejecutar la consulta
        const { data, error } = await query

        if (error) {
            console.error('Error al obtener propiedades para cita:', error)
            console.warn('Error en la consulta a propiedades')
            return []
        }

        console.log(
            'DEBUG - Propiedades encontradas (sin filtros):',
            JSON.stringify(data, null, 2),
        )

        // Procesar los datos para asegurar que los campos JSONB están correctamente formateados
        const processed = data.map((property) => {
            // Convertir campos JSONB si es necesario
            let features = property.features
            if (typeof features === 'string') {
                try {
                    features = JSON.parse(features)
                } catch (e) {
                    features = {}
                }
            }

            // No necesitamos procesar latitude y longitude ya que son números

            return {
                ...property,
                features,
                // No incluimos location aquí ya que no existe
            }
        })

        return processed as Property[]
    } catch (error) {
        console.error('Error en getPropertiesForAppointment:', error)
        // En caso de cualquier error, devolvemos array vacío
        return []
    }
}

export default getPropertiesForAppointment
