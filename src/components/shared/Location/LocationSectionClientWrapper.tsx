/**
 * frontend/src/components/shared/location/LocationSectionClientWrapper.tsx
 * Componente wrapper para usar el LocationSection en el lado del cliente solamente
 * Evita problemas de hidratación separando la lógica del cliente/servidor
 * @version 1.0.0
 * @updated 2025-04-04
 */

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { LocationData } from '..'

// Importación dinámica del componente para evitar problemas de hidratación
const LocationSection = dynamic(
    () => import('../../view/PropertyForm/components/LocationSection'),
    {
        ssr: false, // Desactiva el SSR para este componente
        loading: () => (
            <Card className="p-6 flex justify-center items-center h-64">
                <Spinner size="lg" />
                <span className="ml-2">Cargando selector de ubicación...</span>
            </Card>
        ),
    },
)

interface LocationSectionClientWrapperProps {
    onLocationChange?: (locationData: LocationData) => void
    initialData?: LocationData
}

const LocationSectionClientWrapper: React.FC<
    LocationSectionClientWrapperProps
> = ({ onLocationChange, initialData }) => {
    // Mantener el estado en el cliente
    const [locationData, setLocationData] = useState<LocationData | undefined>(
        initialData,
    )

    // Función para manejar cambios de ubicación
    const handleLocationChange = (data: LocationData) => {
        setLocationData(data)
        if (typeof onLocationChange === 'function') {
            onLocationChange(data)
        }
    }

    return (
        <LocationSection
            onLocationChange={handleLocationChange}
            initialData={locationData}
        />
    )
}

export default LocationSectionClientWrapper
