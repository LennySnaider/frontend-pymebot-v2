/**
 * frontend/src/server/actions/properties/createProperty.ts
 * Server action para crear una nueva propiedad con soporte mejorado para imágenes.
 * 
 * @version 2.2.0
 * @updated 2025-06-23
 */

'use server'

import PropertyService from '@/services/PropertyService'
import StorageService from '@/services/StorageService'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

export async function createProperty(propertyData: any) {
    try {
        console.log('Iniciando creación de propiedad con datos:', JSON.stringify(propertyData, null, 2));
        
        // Obtener ID de tenant actual
        const tenant_id = await getTenantFromSession();
        
        // Añadir tenant_id a los datos de la propiedad
        propertyData.tenant_id = tenant_id;
        
        // Convertir los datos del formulario al formato esperado por Supabase
        // Mapeamos campos anidados en la estructura plana de la tabla properties
        if (propertyData.location) {
            propertyData.address = propertyData.location.address;
            propertyData.city = propertyData.location.city;
            propertyData.state = propertyData.location.state;
            propertyData.zip_code = propertyData.location.zipCode;
            propertyData.country = propertyData.location.country;
            
            if (propertyData.location.coordinates) {
                propertyData.latitude = propertyData.location.coordinates.lat;
                propertyData.longitude = propertyData.location.coordinates.lng;
            }
            
            // Asegurarnos de que show_approximate_location sea un booleano
            // Ahora solo usamos el valor de location.showApproximateLocation
            propertyData.show_approximate_location = Boolean(
                propertyData.location.showApproximateLocation === true || 
                propertyData.location.showApproximateLocation === "true"
            );
        }
        
        if (propertyData.features) {
            propertyData.bedrooms = propertyData.features.bedrooms;
            propertyData.bathrooms = propertyData.features.bathrooms;
            propertyData.area = propertyData.features.area;
            propertyData.parking_spots = propertyData.features.parkingSpots;
            propertyData.year_built = propertyData.features.yearBuilt;
            propertyData.has_pool = propertyData.features.hasPool;
            propertyData.has_garden = propertyData.features.hasGarden;
            propertyData.has_garage = propertyData.features.hasGarage;
            propertyData.has_security = propertyData.features.hasSecurity;
        }
        
        // Mapear nombre de propiedad a título
        if (propertyData.name) {
            propertyData.title = propertyData.name;
        }
        
        // Mapear propertyType a property_type
        if (propertyData.propertyType) {
            propertyData.property_type = propertyData.propertyType;
        }
        
        // Mapear operationType a operation_type
        if (propertyData.operationType) {
            propertyData.operation_type = propertyData.operationType;
        }
        
        // Mapear propertyCode a code
        if (propertyData.propertyCode) {
            propertyData.code = propertyData.propertyCode;
        }
        
        // Asegurar que existe el bucket para imágenes
        await StorageService.ensureBucketExists();
        
        // Procesar imágenes primero si existen
        if (propertyData.media && Array.isArray(propertyData.media)) {
            console.log(`Procesando ${propertyData.media.length} imágenes...`);
            
            const processedMedia = [];
            
            // Procesamos cada imagen
            for (const media of propertyData.media) {
                // Si la imagen tiene un archivo original (_file), necesitamos subirlo a Supabase Storage
                if (media._file) {
                    try {
                        // Crear un objeto File a partir de la información disponible
                        // Esto es necesario porque los archivos no pueden pasar directamente a través de los server actions
                        
                        // Si tenemos una URL base64 o blob, la extraemos
                        let fileContent;
                        let fileName = media.title || 'image.jpg';
                        let contentType = 'image/jpeg';
                        
                        // Aquí deberíamos tener la información del archivo, pero como no podemos
                        // transmitir el File directamente a través del server action, lo manejamos
                        // en el frontend en el MediaSection.
                        
                        // En su lugar, creamos el objeto de media sin subir la imagen,
                        // ya que lo haremos cuando tengamos el ID de la propiedad
                        processedMedia.push({
                            id: media.id,
                            type: media.type,
                            url: media.url,
                            isPrimary: media.isPrimary,
                            title: media.title,
                            thumbnail: media.thumbnail,
                            displayOrder: media.displayOrder || processedMedia.length,
                            // No podemos poner _file aquí porque no se puede serializar
                        });
                    } catch (uploadError) {
                        console.error('Error al procesar imagen durante creación:', uploadError);
                    }
                } else {
                    // Si la imagen ya tiene una URL y no un archivo, la mantenemos como está
                    processedMedia.push({
                        id: media.id,
                        type: media.type,
                        url: media.url,
                        isPrimary: media.isPrimary,
                        title: media.title,
                        thumbnail: media.thumbnail,
                        displayOrder: media.displayOrder || processedMedia.length,
                    });
                }
            }
            
            // Reemplazar el array de media original con el procesado
            propertyData.media = processedMedia;
        }
        
        // Llamar al método del servicio para crear la propiedad
        const response = await PropertyService.apiCreateProperty(propertyData)
        
        // Si hay un error en la respuesta, retornarlo
        if (!response.success) {
            return { 
                success: false, 
                error: response.error || 'Error al crear la propiedad' 
            }
        }
        
        // Si se creó la propiedad correctamente, ahora podemos procesar las imágenes
        // Este paso se hace en el frontend, ya que no podemos pasar los archivos File
        // a través de server actions
        
        console.log('Propiedad creada exitosamente:', response.data);
        
        // Revalidar la ruta para actualizar la caché
        revalidatePath('/modules/properties/property-list')
        
        // Establecer una cookie para mostrar notificación en la página de listado
        const cookieStore = cookies();
        await cookieStore.set('property_created', 'true', { 
            maxAge: 5, // 5 segundos, solo para la próxima carga
            path: '/' 
        })
        
        return { 
            success: true, 
            data: response.data,
            propertyId: response.data?.id,
            message: 'Propiedad creada exitosamente'
        }
    } catch (error) {
        console.error('Error al crear la propiedad:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido al crear' 
        }
    }
}

export default createProperty