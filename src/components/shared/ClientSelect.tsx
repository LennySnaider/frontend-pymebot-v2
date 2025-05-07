/**
 * frontend/src/components/shared/ClientSelect.tsx
 * Componente seguro para react-select que evita errores de hidratación.
 *
 * @version 1.1.0
 * @updated 2025-06-10
 */

'use client'

import React, { useId } from 'react'
import Select from '@/components/ui/Select'
import ClientOnly from './ClientOnly'
import type { Props as ReactSelectProps } from 'react-select'

// Extiende las props de react-select con las que necesitamos
type ClientSelectProps = ReactSelectProps & {
    instanceId?: string
}

/**
 * Componente Select que se renderiza solo en el cliente y maneja correctamente
 * los valores para evitar problemas de hidratación entre servidor y cliente.
 */
const ClientSelect = ({
    instanceId,
    defaultValue,
    value,
    ...restProps
}: ClientSelectProps) => {
    // Usar useId para garantizar IDs únicos
    const uniqueId = useId().replace(/:/g, '')
    const selectId = instanceId || `select-${uniqueId}`

    // Configurar los estilos del portal del menú para que siempre esté visible
    const menuPortalStyles = {
        zIndex: 9999,
        // Otras propiedades para asegurar visibilidad
        position: 'absolute' as const,
    }

    return (
        <ClientOnly>
            <Select
                instanceId={selectId}
                styles={{
                    menuPortal: (base) => ({
                        ...base,
                        ...menuPortalStyles,
                    }),
                }}
                // Siempre abrir el menú hacia abajo para evitar problemas con el portal
                menuPlacement="auto"
                // Asegurar que el menú se muestre en un portal para evitar recortes
                menuPortalTarget={
                    typeof document !== 'undefined' ? document.body : undefined
                }
                // Pasar el valor o defaultValue solo si están definidos
                {...(value !== undefined ? { value } : {})}
                {...(defaultValue !== undefined ? { defaultValue } : {})}
                // Resto de props
                {...restProps}
            />
        </ClientOnly>
    )
}

export default ClientSelect
