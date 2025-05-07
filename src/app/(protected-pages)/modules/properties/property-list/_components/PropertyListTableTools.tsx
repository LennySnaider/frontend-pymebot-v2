/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_components/PropertyListTableTools.tsx
 * Componente de herramientas para la tabla de propiedades.
 *
 * @version 1.0.0
 * @updated 2025-05-20
 */

'use client'

import PropertyListSearch from './PropertyListSearch'
import PropertyTableFilter from './PropertyTableFilter'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'

const PropertyListTableTools = () => {
    const { onAppendQueryParams } = useAppendQueryParams()

    const handleInputChange = (query: string) => {
        onAppendQueryParams({
            query,
        })
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <PropertyListSearch onInputChange={handleInputChange} />
            <PropertyTableFilter />
        </div>
    )
}

export default PropertyListTableTools
