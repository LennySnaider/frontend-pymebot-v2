/**
 * frontend/src/app/(protected-pages)/modules/properties/property-details/[id]/page.tsx
 * Página para mostrar los detalles de una propiedad inmobiliaria.
 *
 * @version 1.1.0
 * @updated 2025-07-15
 */

import PropertyDetails from './_components/PropertyDetails'

export default async function PropertyDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    // En NextJS 14, debemos esperar a que params se resuelva
    const resolvedParams = await params
    const propertyId = resolvedParams.id

    return <PropertyDetails id={propertyId} />
}
