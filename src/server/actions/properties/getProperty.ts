/**
 * frontend/src/server/actions/properties/getProperty.ts
 * Server action para obtener una propiedad específica por su ID.
 * Implementa el mapeador para transformar el formato de Supabase al formato del frontend.
 * Mejorado para manejar correctamente propiedades eliminadas.
 * 
 * @version 2.5.0
 * @updated 2025-07-15
 */

'use server'

import PropertyService from '@/services/PropertyService'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'
import { mapSupabaseToProperty } from '@/services/mappers/PropertyMapper'

/**
 * Obtiene una propiedad específica utilizando su ID
 * Incluye verificación de seguridad para asegurar que el usuario tiene acceso a la propiedad
 * y mapeo de datos al formato del frontend
 */
const getProperty = async (_queryParams: {
    [key: string]: string | string[] | undefined
}) => {
    const queryParams = _queryParams
    const id = typeof queryParams.id === 'string' 
        ? queryParams.id 
        : Array.isArray(queryParams.id) 
            ? queryParams.id[0] 
            : null

    if (!id) {
        throw new Error('El ID de la propiedad es requerido')
    }

    try {
        // Obtener el tenant_id del usuario actual para verificación
        const tenant_id = await getTenantFromSession()
        console.log(`Obteniendo propiedad con ID: ${id} para tenant: ${tenant_id}`)
        
        // Usar el método apiGetPropertyById del servicio PropertyService
        const response = await PropertyService.apiGetPropertyById(id)
        
        // Si no hay respuesta o hay un error, devolvemos null
        if (!response.success || !response.data) {
            console.log(`No se encontró la propiedad con ID: ${id} (posiblemente eliminada)`)
            return null
        }
        
        // Verificar que la propiedad pertenece al tenant del usuario (excepto super_admin)
        if (response.data.tenant_id !== tenant_id && tenant_id !== process.env.DEFAULT_TENANT_ID) {
            console.error(`La propiedad con ID: ${id} no pertenece al tenant: ${tenant_id}`)
            return null
        }
        
        // Debug de la respuesta cruda para diagnosticar problemas de tipos
        console.log('Datos crudos de la propiedad:', {
            id: response.data.id,
            show_approximate_location: {
                value: response.data.show_approximate_location,
                type: typeof response.data.show_approximate_location
            }
        })
        
        // IMPORTANTE: Usamos siempre el mapeador oficial para garantizar la consistencia
        // Ignoramos el mapeo previo del servicio y aplicamos el mapeador correcto
        const rawData = response.data
        
        // Si los datos ya están mapeados, pasamos la propiedad sin procesar para un mapeo limpio
        const dataToMap = rawData.features ? rawData : rawData.property_data || rawData
        
        // Aplicar el mapeador
        const mappedProperty = mapSupabaseToProperty(dataToMap)
        
        // Verificar que la estructura de datos sea correcta antes de devolverla
        console.log(`Propiedad mapeada exitosamente:`, {
            id: mappedProperty.id,
            name: mappedProperty.name,
            location: {
                state: mappedProperty.location?.state,
                city: mappedProperty.location?.city,
                colony: mappedProperty.location?.colony,
                coordinates: mappedProperty.location?.coordinates ? 'OK' : 'MISSING',
            },
            features: mappedProperty.features ? 'OK' : 'MISSING',
            mediaCount: mappedProperty.media?.length || 0
        })
        
        // Asegurar que la estructura de location esté completa
        if (!mappedProperty.location) {
            mappedProperty.location = {
                address: '',
                city: '',
                state: '',
                zipCode: '',
                colony: '',
                country: 'México',
                showApproximateLocation: false,
                coordinates: { lat: 0, lng: 0 }
            }
        }
        
        // Asegurar que todos los campos necesarios existan en la estructura
        if (mappedProperty.location) {
            if (!('colony' in mappedProperty.location)) {
                mappedProperty.location.colony = ''
            }
            
            // Asegurar que showApproximateLocation exista y sea booleano
            if (!('showApproximateLocation' in mappedProperty.location)) {
                mappedProperty.location.showApproximateLocation = false
            } else {
                // Convertir explícitamente a booleano si es un string
                const currentValue = mappedProperty.location.showApproximateLocation
                mappedProperty.location.showApproximateLocation = 
                    currentValue === true || 
                    currentValue === "true" ||
                    false
            }
            
            // Debug información relacionada con la ubicación
            console.log('Configuración de ubicación de la propiedad:', {
                showApproximateLocation: mappedProperty.location.showApproximateLocation,
                colony: mappedProperty.location.colony,
                address: mappedProperty.location.address,
                coordinates: mappedProperty.location.coordinates
            })
        }
        
        // Devolver los datos de la propiedad ya mapeados y verificados
        return mappedProperty
    } catch (error) {
        console.error('Error al obtener la propiedad:', error)
        throw new Error('No se pudo obtener la propiedad solicitada')
    }
}

export default getProperty