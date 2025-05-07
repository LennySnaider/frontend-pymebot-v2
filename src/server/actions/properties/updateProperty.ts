/**
 * frontend/src/server/actions/properties/updateProperty.ts
 * Server action para actualizar una propiedad existente con soporte mejorado para imágenes.
 * Actualizado para incluir el campo colony y depuración de show_approximate_location.
 * 
 * @version 2.4.1
 * @updated 2025-10-15
 */

'use server'

import PropertyService from '@/services/PropertyService'
import StorageService from '@/services/StorageService'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function updateProperty(id: string, propertyData: any) {
    try {
        console.log('Enviando formulario con valores:', JSON.stringify(propertyData, null, 2));
        
        const safeNumber = (value: any): number | null => {
            if (value === '' || value === undefined || value === null) return null;
            const num = Number(value);
            return isNaN(num) ? null : num;
        };
        
        const transformedData = {
            title: propertyData.name,
            description: propertyData.description,
            property_type: propertyData.propertyType,
            status: propertyData.status,
            price: safeNumber(propertyData.price),
            currency: propertyData.currency,
            address: propertyData.location?.address || null,
            city: propertyData.location?.city || null,
            state: propertyData.location?.state || null,
            zip_code: propertyData.location?.zipCode ? parseInt(propertyData.location.zipCode, 10) : null,
            colony: propertyData.location?.colony || null,
            country: propertyData.location?.country || null,
            _debug_value: {
                location_value: propertyData.location?.showApproximateLocation,
                location_type: typeof propertyData.location?.showApproximateLocation,
                root_value: propertyData.show_approximate_location,
                root_type: typeof propertyData.show_approximate_location
            },
            show_approximate_location: propertyData.location?.showApproximateLocation !== undefined 
                ? propertyData.location?.showApproximateLocation 
                : propertyData.show_approximate_location,
            latitude: safeNumber(propertyData.location?.coordinates?.lat),
            longitude: safeNumber(propertyData.location?.coordinates?.lng),
            bedrooms: safeNumber(propertyData.features?.bedrooms),
            bathrooms: safeNumber(propertyData.features?.bathrooms),
            area: safeNumber(propertyData.features?.area),
            parking_spots: safeNumber(propertyData.features?.parkingSpots),
            year_built: safeNumber(propertyData.features?.yearBuilt),
            has_pool: propertyData.features?.hasPool,
            has_garden: propertyData.features?.hasGarden,
            has_garage: propertyData.features?.hasGarage,
            has_security: propertyData.features?.hasSecurity,
            code: propertyData.propertyCode,
            operation_type: propertyData.operationType,
            agent_id: propertyData.agentId || null,
            media: propertyData.media
        };
        
        if (transformedData.media && Array.isArray(transformedData.media)) {
            const processedMedia = [];
            for (const media of transformedData.media) {
                if (media._file) {
                    try {
                        const uploadResult = await StorageService.uploadPropertyImage(media._file, id);
                        if (uploadResult && uploadResult.success) {
                            processedMedia.push({
                                id: media.id,
                                type: media.type,
                                url: uploadResult.url,
                                isPrimary: media.isPrimary,
                                title: media.title,
                                thumbnail: media.thumbnail,
                                displayOrder: media.displayOrder || processedMedia.length,
                                _storagePath: uploadResult.path
                            });
                        } else {
                            console.error(`Error al subir imagen: ${media.title || 'sin título'}`);
                        }
                    } catch (uploadError) {
                        console.error('Error al procesar imagen durante actualización:', uploadError);
                    }
                } else {
                    processedMedia.push({
                        id: media.id,
                        type: media.type,
                        url: media.url,
                        isPrimary: media.isPrimary,
                        title: media.title,
                        thumbnail: media.thumbnail,
                        displayOrder: media.displayOrder || processedMedia.length,
                        _storagePath: media._storagePath
                    });
                }
            }
            transformedData.media = processedMedia;
        }

        // Log antes de enviar a PropertyService
        console.log('Datos transformados enviados a PropertyService:', JSON.stringify(transformedData, null, 2));
        
        const response = await PropertyService.apiUpdateProperty(id, transformedData);
        
        if (!response.success) {
            console.error('Respuesta fallida de PropertyService:', response.error);
            return { 
                success: false, 
                error: response.error || 'Error al actualizar la propiedad' 
            };
        }
        
        console.log('Propiedad actualizada exitosamente:', response.data);
        
        revalidatePath('/modules/properties/property-list');
        revalidatePath(`/modules/properties/property-details/${id}`);
        
        try {
            const cookieStore = cookies();
            cookieStore.set('property_updated', 'true', { 
                maxAge: 5,
                path: '/' 
            });
        } catch (cookieError) {
            console.error('Error al establecer cookie de notificación:', cookieError);
        }
        
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error al actualizar la propiedad:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido al actualizar' 
        };
    }
}

export default updateProperty;