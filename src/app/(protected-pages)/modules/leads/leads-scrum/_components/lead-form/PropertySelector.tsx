/**
 * PropertySelector.tsx
 * Componente para seleccionar propiedades inmobiliarias en el formulario de leads
 * Simplificado y oculto para su uso en primer contacto y con chatbot
 * 
 * @version 2.0.0
 * @updated 2025-04-14
 */

import React from 'react'
import { Controller } from 'react-hook-form'
import { FormControl } from './types'

interface PropertySelectorProps {
    control: FormControl
    availableProperties: any[]
    isLoadingProperties: boolean
    loadAvailableProperties: () => void
    handlePropertySelect: (propertyId: string) => void
}

/**
 * PropertySelector - Versión Simplificada
 * Este componente ha sido reducido a su mínima expresión para ocultar la 
 * funcionalidad de selección de propiedades, pero mantiene la compatibilidad
 * con el formulario y guarda siempre ['no-property'] como valor.
 */
const PropertySelector: React.FC<PropertySelectorProps> = ({
    control,
}) => {
    // Componente invisible pero funcional
    return (
        <div style={{ display: 'none' }}>
            <Controller
                name="selectedProperties"
                control={control}
                defaultValue={['no-property']}
                render={({ field }) => (
                    <input
                        type="hidden"
                        {...field}
                        value={JSON.stringify(['no-property'])}
                    />
                )}
            />
        </div>
    )
}

export default PropertySelector
