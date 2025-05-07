/**
 * frontend/src/components/view/PropertyForm/components/ColoniaSelector/index.tsx
 * Componente para seleccionar colonias/barrios con autocompletado y validación.
 * Soluciona el problema de no guardar correctamente el campo de colonia.
 *
 * @version 1.1.0
 * @updated 2025-06-25
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { Controller } from 'react-hook-form'
import debounce from 'lodash/debounce'
import { Control } from 'react-hook-form'
import type { PropertyFormSchema } from '../../types'

interface ColoniaSelectorProps {
    control: Control<PropertyFormSchema>
    initialValue?: string
    city?: string
    state?: string
    invalid?: boolean
    errorMessage?: string
}

// Tipo para opciones del select
type ColoniaOption = {
    value: string
    label: string
}

const ColoniaSelector = ({
    control,
    initialValue,
    city,
    state,
    invalid,
    errorMessage,
}: ColoniaSelectorProps) => {
    const [options, setOptions] = useState<ColoniaOption[]>([])
    const [loading, setLoading] = useState(false)
    const [inputValue, setInputValue] = useState(initialValue || '')
    const [showInput, setShowInput] = useState(false)

    // Estado para controlar si el componente está montado
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        if (initialValue) {
            setInputValue(initialValue)
        }
    }, [initialValue])

    // Función para buscar colonias basadas en ciudad y estado
    const fetchColonias = useCallback(
        async (searchText: string) => {
            // Solo buscar si tenemos ciudad y estado
            if (!city || !state) {
                return []
            }

            try {
                setLoading(true)

                // En un caso real, aquí haríamos una llamada a la API
                // Para este ejemplo, simulamos algunas opciones basadas en el texto de búsqueda
                await new Promise((resolve) => setTimeout(resolve, 500))

                const simulatedOptions = [
                    { value: 'centro', label: 'Centro' },
                    { value: 'reforma', label: 'Reforma' },
                    { value: 'polanco', label: 'Polanco' },
                    { value: 'condesa', label: 'Condesa' },
                    { value: 'roma', label: 'Roma Norte' },
                    { value: 'roma-sur', label: 'Roma Sur' },
                    { value: 'del-valle', label: 'Del Valle' },
                    { value: 'narvarte', label: 'Narvarte' },
                    { value: 'napoles', label: 'Nápoles' },
                ].filter((option) =>
                    option.label
                        .toLowerCase()
                        .includes(searchText.toLowerCase()),
                )

                // Agregar la opción "Otra" para permitir entrada manual
                simulatedOptions.push({
                    value: 'other',
                    label: '+ Agregar otra colonia',
                })

                return simulatedOptions
            } catch (error) {
                console.error('Error al buscar colonias:', error)
                return []
            } finally {
                setLoading(false)
            }
        },
        [city, state],
    )

    // Debounce para evitar demasiadas llamadas
    const debouncedFetchColonias = useCallback(
        debounce((searchText: string) => {
            fetchColonias(searchText).then((results) => {
                setOptions(results)
            })
        }, 300),
        [fetchColonias],
    )

    // Actualizar opciones cuando cambia ciudad o estado
    useEffect(() => {
        if (city && state) {
            debouncedFetchColonias('')
        } else {
            setOptions([])
        }
    }, [city, state, debouncedFetchColonias])

    // Manejar búsqueda en el Select
    const handleInputChange = (newValue: string) => {
        setInputValue(newValue)
        debouncedFetchColonias(newValue)
    }

    // Manejar selección de una opción
    const handleSelectChange = (
        onChange: (value: string) => void,
        selectedOption: ColoniaOption | null,
    ) => {
        if (!selectedOption) {
            onChange('')
            return
        }

        if (selectedOption.value === 'other') {
            // Si selecciona "otra", mostrar input de texto
            setShowInput(true)
            onChange(inputValue) // Mantener el valor actual en el formulario
        } else {
            // Si selecciona una colonia existente, usar el texto de la etiqueta
            setShowInput(false)
            onChange(selectedOption.label)
        }
    }

    // Si el componente no está montado, no renderizamos nada para evitar errores de hidratación
    if (!isMounted) {
        return (
            <div className="h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
        )
    }

    return (
        <Controller
            name="location.colony"
            control={control}
            render={({ field }) => (
                <div>
                    {!showInput ? (
                        <Select
                            options={options}
                            placeholder="Selecciona o busca tu colonia"
                            // Encuentra la opción que coincide con el valor del campo por su etiqueta o valor
                            value={
                                options.find(
                                    (option) =>
                                        option.label === field.value ||
                                        option.value === field.value,
                                ) || null
                            }
                            isSearchable
                            isClearable
                            onInputChange={handleInputChange}
                            onChange={(option) => {
                                // Asegurarnos de que estamos pasando un string, no un objeto
                                handleSelectChange(field.onChange, option)
                            }}
                            isDisabled={!city || !state}
                            isLoading={loading}
                            menuPlacement="auto"
                            className={invalid ? 'border-red-500' : ''}
                            classNames={{
                                control: () =>
                                    invalid ? 'border-red-500' : '',
                            }}
                        />
                    ) : (
                        <div className="flex flex-col space-y-2">
                            <Input
                                value={field.value || ''}
                                onChange={(e) => {
                                    // Asegurar que siempre pasamos un string al campo
                                    field.onChange(e.target.value)
                                }}
                                placeholder="Escribe el nombre de la colonia"
                                suffix={
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-primary"
                                        onClick={() => setShowInput(false)}
                                        title="Volver al selector"
                                    >
                                        ↩
                                    </button>
                                }
                                invalid={invalid}
                            />
                        </div>
                    )}
                    {invalid && errorMessage && (
                        <div className="text-red-500 text-xs mt-1">
                            {errorMessage}
                        </div>
                    )}
                </div>
            )}
        />
    )
}

export default ColoniaSelector
