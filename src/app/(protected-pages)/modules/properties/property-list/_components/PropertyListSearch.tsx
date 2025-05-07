/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_components/PropertyListSearch.tsx
 * Componente de búsqueda para filtrar propiedades.
 *
 * @version 1.0.0
 * @updated 2025-05-20
 */

'use client'

import Input from '@/components/ui/Input'
import useDebounce from '@/utils/hooks/useDebounce'
import { TbSearch } from 'react-icons/tb'
import type { ChangeEvent } from 'react'

type PropertyListSearchProps = {
    onInputChange: (value: string) => void
}

const PropertyListSearch = (props: PropertyListSearchProps) => {
    const { onInputChange } = props

    function handleDebounceFn(value: string) {
        onInputChange?.(value)
    }

    const debounceFn = useDebounce(handleDebounceFn, 500)

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        debounceFn(e.target.value)
    }

    return (
        <Input
            placeholder="Buscar propiedad"
            suffix={<TbSearch className="text-lg" />}
            onChange={handleInputChange}
        />
    )
}

export default PropertyListSearch
