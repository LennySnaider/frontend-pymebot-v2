/**
 * frontend/src/components/shared/SafeSelect.tsx
 * Componente wrapper para React Select que evita errores de hidratación.
 * Específicamente soluciona el problema de aria-activedescendant entre servidor y cliente.
 *
 * @version 1.0.1
 * @updated 2025-06-25
 */

'use client'

import { useState, useEffect } from 'react'
import Select from '@/components/ui/Select'
import type { SelectProps } from '@/components/ui/Select/Select'
import type { GroupBase } from 'react-select'

/**
 * Wrapper para Select que solo renderiza el componente después
 * de la hidratación y previene errores de renderizado entre servidor y cliente
 */
function SafeSelect<
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
>(props: SelectProps<Option, IsMulti, Group>) {
    const [isMounted, setIsMounted] = useState(false)

    // Solo renderizamos el componente en el cliente para evitar problemas de hidratación
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Muestra un placeholder mientras se monta el componente
    if (!isMounted) {
        return (
            <div
                className={`h-9 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md ${props.invalid ? 'border border-red-500' : ''}`}
                aria-hidden="true"
            />
        )
    }

    // Cuando ya estamos en el cliente, renderizamos el componente real
    return <Select {...props} />
}

export default SafeSelect
