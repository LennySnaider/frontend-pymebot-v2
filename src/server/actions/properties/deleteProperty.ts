/**
 * frontend/src/server/actions/properties/deleteProperty.ts
 * Server action para eliminar una propiedad con limpieza de archivos asociados.
 * Mejorada la eliminación de archivos para garantizar que no queden huérfanos.
 * Se ha corregido la secuencia de eliminación para garantizar la consistencia.
 * 
 * @version 2.4.0
 * @updated 2025-07-15
 */

'use server'

import PropertyService from '@/services/PropertyService'
import StorageService from '@/services/StorageService'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function deleteProperty(id: string) {
    try {
        // Primero obtenemos la propiedad para asegurarnos de que existe
        const property = await PropertyService.apiGetPropertyById(id)
        
        if (!property || !property.success || !property.data || !property.data.id) {
            console.warn(`Intento de eliminar una propiedad inexistente: ${id}`)
            return { 
                success: false, 
                error: 'No se encontró la propiedad a eliminar' 
            }
        }
        
        console.log(`Eliminando propiedad con ID: ${id}`)
        
        // Eliminamos los archivos de Storage primero para evitar huérfanos
        console.log(`Comenzando eliminación de archivos asociados a la propiedad ${id}`)
        const storageResult = await StorageService.deletePropertyFiles(id)
        
        if (!storageResult.success) {
            console.warn(`Advertencia: No se pudieron eliminar todos los archivos: ${storageResult.error}`)
            // Registramos el error pero continuamos para intentar eliminar la propiedad
        } else {
            console.log(`Archivos de la propiedad ${id} eliminados correctamente`)
        }
        
        // Llamar al método del servicio para eliminar la propiedad
        console.log(`Eliminando registro de propiedad ${id} de la base de datos`)
        const response = await PropertyService.apiDeleteProperty(id)
        
        // Si hay un error en la respuesta, retornarlo
        if (!response.success) {
            console.error(`Error al eliminar la propiedad de la base de datos: ${response.error}`)
            return { 
                success: false, 
                error: response.error || 'Error al eliminar la propiedad' 
            }
        }
        
        console.log(`Propiedad ${id} eliminada correctamente`)
        
        // Revalidar la ruta para actualizar la caché
        revalidatePath('/modules/properties/property-list')
        
        // Establecer una cookie para mostrar notificación en la página de listado
        const cookieStore = cookies();
        cookieStore.set('property_deleted', 'true', { 
            maxAge: 5, // 5 segundos, solo para la próxima carga
            path: '/' 
        })
        
        return { success: true }
    } catch (error) {
        console.error('Error al eliminar la propiedad:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido al eliminar' 
        }
    }
}

export default deleteProperty