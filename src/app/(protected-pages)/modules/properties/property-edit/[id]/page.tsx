/**
 * frontend/src/app/(protected-pages)/modules/properties/property-edit/[id]/page.tsx
 * Página para editar una propiedad existente.
 * Modificado para verificar correctamente el formato de los datos mapeados.
 *
 * @version 2.3.0
 * @updated 2025-06-24
 */

import PropertyEdit from './_components/PropertyEdit'
import getProperty from '@/server/actions/properties/getProperty'
import { notFound } from 'next/navigation'
import type { Property } from '@/app/(protected-pages)/modules/properties/property-list/types'

type PageProps = {
    params: {
        id: string
    }
}

const PropertyEditPage = async ({ params }: PageProps) => {
    // Asegurar que params esté completamente resuelto
    const resolvedParams = await Promise.resolve(params)

    // Obtener la propiedad usando el server action (ya mapeada al formato del frontend)
    const property = await getProperty({ id: resolvedParams.id })

    // Si no se encuentra la propiedad, mostrar página 404
    if (!property) {
        notFound()
    }
    
    // Verificar si los datos están correctamente mapeados al formato del frontend
    console.log('Property data received for editing:', {
        id: property.id,
        name: property.name,
        propertyType: property.propertyType,
        // Verificar que las estructuras anidadas estén presentes
        features: property.features ? 'OK' : 'MISSING',
        location: property.location ? 'OK' : 'MISSING',
        // Verificar cantidad de imágenes
        mediaCount: property.media?.length || 0
    })

    return <PropertyEdit data={property as Property} />
}

export default PropertyEditPage
