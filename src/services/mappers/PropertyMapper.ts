/**
 * frontend/src/services/mappers/PropertyMapper.ts
 * Funciones para mapear entre esquemas de Supabase y estructuras internas de la aplicación.
 * 
 * @version 1.0.0
 * @updated 2025-06-22
 */

import type { Property, PropertyMedia } from '@/app/(protected-pages)/modules/properties/property-list/types';

/**
 * Mapea una propiedad desde el formato de la vista v_products_with_properties al formato interno
 */
export function mapSupabaseToProperty(supabaseProperty: any): Property {
    // Validar que supabaseProperty sea un objeto válido
    if (!supabaseProperty || typeof supabaseProperty !== 'object') {
        console.error('mapSupabaseToProperty: input no es un objeto válido:', supabaseProperty);
        // Devolver una propiedad con valores por defecto para evitar errores
        return {
            id: `temp-${Date.now()}`,
            name: 'Propiedad sin datos',
            propertyType: 'house',
            status: 'available',
            price: 0,
            currency: 'MXN',
            media: []
        };
    }
    
    // Verificar campo id (crucial para operaciones)
    if (!supabaseProperty.id) {
        console.warn('mapSupabaseToProperty: propiedad sin ID:', supabaseProperty);
        // Asignar un ID temporal
        supabaseProperty.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // Extraer imágenes del campo images
    const media: PropertyMedia[] = [];
    const images = supabaseProperty.images || [];
    
    if (Array.isArray(images)) {
        images.forEach((image: any) => {
            if (image && image.url) {
                media.push({
                    id: image.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    type: 'image',
                    url: image.url,
                    isPrimary: image.is_primary || false,
                    displayOrder: image.display_order || 0,
                    _storagePath: image.storage_path
                });
            }
        });
    }
    
    // Ordenar imágenes por displayOrder
    media.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    // Asegurar que hay al menos una imagen marcada como principal
    if (media.length > 0 && !media.some(img => img.isPrimary)) {
        media[0].isPrimary = true;
    }

    // Mapeo directo desde los campos de la vista (que ahora son campos directos de properties)
    return {
        id: supabaseProperty.id,
        name: supabaseProperty.name || supabaseProperty.title,
        propertyCode: supabaseProperty.code || '',
        description: supabaseProperty.description,
        propertyType: supabaseProperty.property_type || 'house',
        status: supabaseProperty.status || (supabaseProperty.is_active ? 'available' : 'unavailable'),
        operationType: supabaseProperty.operation_type || 'sale',
        price: parseFloat(supabaseProperty.price) || 0,
        currency: supabaseProperty.currency || 'MXN',
        features: {
            bedrooms: parseInt(supabaseProperty.bedrooms) || 0,
            bathrooms: parseFloat(supabaseProperty.bathrooms) || 0,
            area: parseFloat(supabaseProperty.area) || 0,
            parkingSpots: parseInt(supabaseProperty.parking_spots) || 0,
            yearBuilt: parseInt(supabaseProperty.year_built) || null,
            hasPool: supabaseProperty.has_pool === true,
            hasGarden: supabaseProperty.has_garden === true,
            hasGarage: supabaseProperty.has_garage === true,
            hasSecurity: supabaseProperty.has_security === true
        },
        location: {
            address: supabaseProperty.address || '',
            city: supabaseProperty.city || '',
            state: supabaseProperty.state || '',
            zipCode: supabaseProperty.zip_code || '',
            colony: supabaseProperty.colony || '',
            country: supabaseProperty.country || 'México',
            showApproximateLocation: supabaseProperty.show_approximate_location === true,
            coordinates: {
                lat: parseFloat(supabaseProperty.latitude) || null,
                lng: parseFloat(supabaseProperty.longitude) || null
            }
        },
        media,
        agentId: supabaseProperty.agent_id,
        createdAt: supabaseProperty.created_at,
        updatedAt: supabaseProperty.updated_at,
        tenant_id: supabaseProperty.tenant_id
    };
}

/**
 * Mapea un arreglo de propiedades desde el formato de Supabase
 */
export function mapSupabaseToProperties(supabaseProperties: any[]): Property[] {
    if (!Array.isArray(supabaseProperties)) {
        console.error('mapSupabaseToProperties: input no es un arreglo:', supabaseProperties);
        return [];
    }
    
    // Usar map con manejo de errores para evitar que un error en una propiedad interrumpa todo el proceso
    return supabaseProperties.map(property => {
        try {
            return mapSupabaseToProperty(property);
        } catch (error) {
            console.error('Error al mapear propiedad individual:', error);
            console.error('Propiedad problemática:', JSON.stringify(property, null, 2));
            // Devolver una propiedad con valores por defecto
            return {
                id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: 'Error al procesar propiedad',
                propertyType: 'house',
                status: 'available',
                price: 0,
                currency: 'MXN',
                media: []
            };
        }
    });
}

export default {
    mapSupabaseToProperty,
    mapSupabaseToProperties
};
