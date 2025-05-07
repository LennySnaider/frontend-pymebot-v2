/**
 * frontend/src/server/actions/properties/getRecommendedProperties.ts
 * Server action para obtener propiedades recomendadas para un lead, utilizando Supabase.
 * 
 * @version 2.0.0
 * @updated 2025-06-20
 */

'use server'

import { apiGetPropertyList } from '@/services/PropertyService'
import type { PropertyType } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'

// Interfaz para las propiedades inmobiliarias
interface Property {
    id: string
    name: string
    description: string
    price: number
    currency: string
    status: 'available' | 'sold' | 'rented' | 'pending'
    propertyType: PropertyType
    features: {
        bedrooms: number
        bathrooms: number
        area: number
        hasGarage?: boolean
        hasPool?: boolean
        hasGarden?: boolean
    }
    location: {
        address: string
        city: string
        state: string
        zipCode: string
    }
    agentId: string
    media: {
        id: string
        type: 'image' | 'video'
        url: string
        isPrimary?: boolean
    }[]
}

/**
 * Obtiene propiedades recomendadas para un lead basadas en sus preferencias
 * @param leadId ID del lead
 * @param agentId ID del agente (opcional)
 * @returns Lista de propiedades recomendadas y total
 */
const getRecommendedProperties = async (
    leadId: string,
    agentId?: string
): Promise<{ list: Property[], total: number }> => {
    try {
        // Preparar parámetros de consulta basados en los criterios proporcionados
        const queryParams: Record<string, string> = {
            leadId,
            recommended: 'true',
            status: 'available'
        }
        
        // Si se proporciona un agente, añadir ese filtro
        if (agentId) {
            queryParams.agentId = agentId
        }
        
        // Usar el servicio de propiedades para obtener datos filtrados desde Supabase
        const response = await apiGetPropertyList(queryParams)
        
        if (!response || !response.data) {
            console.error('No se recibieron datos de propiedades recomendadas')
            return {
                list: [],
                total: 0
            }
        }
        
        // La respuesta de Supabase ya incluye propiedades filtradas y ordenadas
        console.log(`Obtenidas ${response.data.list.length} propiedades recomendadas para el lead ${leadId}`)
        
        return {
            list: response.data.list,
            total: response.data.total
        }
    } catch (error) {
        console.error('Error al obtener propiedades recomendadas:', error)
        return {
            list: [],
            total: 0
        }
    }
}

export default getRecommendedProperties