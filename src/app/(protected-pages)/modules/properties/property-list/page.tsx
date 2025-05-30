/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/page.tsx
 * Página principal para el listado de propiedades.
 * Actualizada para manejar datos de respaldo y mensajes de error.
 *
 * @version 2.4.0
 * @updated 2025-07-14
 */

import { getProperties } from '@/server/actions/properties/getProperties'
import PropertyListProvider from './_components/PropertyListProvider'
import { cookies } from 'next/headers'
import type { Property } from './types'

export const revalidate = 0

interface PageProps {
    searchParams?: {
        page?: string
        limit?: string
        [key: string]: string | undefined
    }
}

const Page = async ({ searchParams: rawSearchParams }: PageProps) => {
    // Asegurar que searchParams esté completamente resuelto
    const searchParams = await Promise.resolve(rawSearchParams || {})

    // Usar valores predeterminados si no se especifican
    const page = searchParams.page ? parseInt(searchParams.page, 10) : 1
    const limit = searchParams.limit ? parseInt(searchParams.limit, 10) : 10

    // Construir parámetros de consulta
    // Crear un objeto nuevo en lugar de expandir searchParams para evitar problemas con objetos dinámicos
    const queryParams = {
        page,
        limit,
    }

    // Añadir otros parámetros de búsqueda si existen
    Object.keys(searchParams).forEach((key) => {
        if (key !== 'page' && key !== 'limit') {
            queryParams[key] = searchParams[key]
        }
    })

    // Verificar si hay una cookie para forzar revalidación
    const cookieStore = await cookies()
    const revalidateProperties = cookieStore.get('revalidate_properties')

    // Borrar la cookie después de leerla para evitar revalidaciones innecesarias
    if (revalidateProperties) {
        cookieStore.delete('revalidate_properties')
    }

    // Obtener datos de propiedades (ya mapeados por la acción del servidor)
    const propertiesData = await getProperties(queryParams)

    // Loguear para depuración (limitando la salida para no saturar la consola)
    console.log(
        `Datos de propiedades recibidos: ${propertiesData.properties?.length || 0} propiedades, total: ${propertiesData.total}`,
    )

    if (propertiesData.properties?.length > 0) {
        // Verificar que los datos estén en el formato correcto
        const firstProperty = propertiesData.properties[0] as Property
        console.log('Formato de primera propiedad:', {
            id: firstProperty.id,
            name: firstProperty.name,
            propertyType: firstProperty.propertyType,
            features: firstProperty.features ? 'OK' : 'NO MAPEADO',
            location: firstProperty.location ? 'OK' : 'NO MAPEADO',
        })
    } else {
        console.log('No se encontraron propiedades')
    }

    // Verificar si estamos usando datos de ejemplo y crear un mensaje informativo
    const errorMsg = propertiesData.isMockData 
        ? 'Usando datos de ejemplo debido a problemas de conexión con la base de datos.' 
        : propertiesData.error 
            ? propertiesData.error 
            : undefined;

    // Asegurarse de que el initialData tiene el formato correcto esperado por el Provider
    return (
        <PropertyListProvider
            initialData={{
                properties: propertiesData.properties || [],
                total: propertiesData.total || 0,
                error: errorMsg,
                isMockData: propertiesData.isMockData
            }}
        />
    )
}

export default Page
