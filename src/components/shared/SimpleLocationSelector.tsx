'use client'

/**
 * frontend/src/components/shared/SimpleLocationSelector.tsx
 * Componente simplificado para selección de ubicación en México
 * Utiliza el hook useSepomexApi para gestionar datos
 * @version 1.0.0
 * @updated 2025-04-04
 */

import React, { useEffect, useState } from 'react'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import toast from '@/components/ui/toast'
import useSepomexApi from '@/utils/hooks/useSepomexApi'

interface SimpleLocationSelectorProps {
    onStateChange?: (state: string) => void
    onMunicipalityChange?: (municipality: string) => void
    initialState?: string
    initialMunicipality?: string
    className?: string
}

const SimpleLocationSelector: React.FC<SimpleLocationSelectorProps> = ({
    onStateChange,
    onMunicipalityChange,
    initialState = '',
    initialMunicipality = '',
    className = '',
}) => {
    // Obtenemos funciones del hook de Sepomex
    const { loading, error, getStates, getMunicipalities } = useSepomexApi()

    // Estados para las listas de opciones
    const [states, setStates] = useState<string[]>([])
    const [municipalities, setMunicipalities] = useState<string[]>([])

    // Estados para los valores seleccionados
    const [selectedState, setSelectedState] = useState<string>(initialState)
    const [selectedMunicipality, setSelectedMunicipality] =
        useState<string>(initialMunicipality)

    // Mostrar errores en toast
    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    // Cargar estados al montar el componente
    useEffect(() => {
        const loadStates = async () => {
            const statesData = await getStates()
            setStates(statesData)

            // Si hay un estado inicial y no tenemos municipios, los cargamos
            if (initialState && !municipalities.length) {
                const municipalitiesData = await getMunicipalities(initialState)
                setMunicipalities(municipalitiesData)
            }
        }

        loadStates()
    }, [getStates, getMunicipalities, initialState])

    // Cargar municipios cuando se selecciona un estado
    useEffect(() => {
        if (selectedState) {
            const loadMunicipalities = async () => {
                const municipalitiesData =
                    await getMunicipalities(selectedState)
                setMunicipalities(municipalitiesData)

                // Notificar cambio al padre
                if (onStateChange) {
                    onStateChange(selectedState)
                }

                // Reset municipio si cambió el estado
                if (selectedState !== initialState) {
                    setSelectedMunicipality('')
                    if (onMunicipalityChange) {
                        onMunicipalityChange('')
                    }
                }
            }

            loadMunicipalities()
        }
    }, [
        selectedState,
        getMunicipalities,
        onStateChange,
        initialState,
        onMunicipalityChange,
    ])

    // Notificar cambio de municipio
    useEffect(() => {
        if (selectedMunicipality && onMunicipalityChange) {
            onMunicipalityChange(selectedMunicipality)
        }
    }, [selectedMunicipality, onMunicipalityChange])

    return (
        <div className={`flex flex-col md:flex-row gap-4 ${className}`}>
            {/* Estado */}
            <div className="flex-1">
                <Select
                    isLoading={loading}
                    placeholder="Seleccione un estado"
                    options={states.map((state) => ({
                        label: state,
                        value: state,
                    }))}
                    onChange={(option) => setSelectedState(option?.value || '')}
                    value={
                        selectedState
                            ? { label: selectedState, value: selectedState }
                            : null
                    }
                    instanceId="simple-state-select"
                    className="w-full"
                />
                {loading && !states.length && (
                    <div className="flex justify-center mt-2">
                        <Spinner size="sm" />
                    </div>
                )}
            </div>

            {/* Municipio/Ciudad */}
            <div className="flex-1">
                <Select
                    isLoading={
                        loading && selectedState && !municipalities.length
                    }
                    placeholder="Seleccione un municipio"
                    options={municipalities.map((mun) => ({
                        label: mun,
                        value: mun,
                    }))}
                    onChange={(option) =>
                        setSelectedMunicipality(option?.value || '')
                    }
                    value={
                        selectedMunicipality
                            ? {
                                  label: selectedMunicipality,
                                  value: selectedMunicipality,
                              }
                            : null
                    }
                    isDisabled={
                        !selectedState || (loading && !municipalities.length)
                    }
                    instanceId="simple-municipality-select"
                    className="w-full"
                />
                {loading && selectedState && !municipalities.length && (
                    <div className="flex justify-center mt-2">
                        <Spinner size="sm" />
                    </div>
                )}
            </div>
        </div>
    )
}

export default SimpleLocationSelector
