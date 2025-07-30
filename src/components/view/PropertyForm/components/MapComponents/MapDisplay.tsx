/**
 * frontend/src/components/view/PropertyForm/components/MapComponents/MapDisplay.tsx
 * Componente para mostrar las coordenadas de la propiedad en un mapa.
 * Utiliza Leaflet para visualizar la ubicación en un mapa interactivo.
 * 
 * @version 1.0.0
 * @updated 2025-06-26
 */

'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { useFormContext } from 'react-hook-form'
import { PiEyeSlash } from 'react-icons/pi'
import dynamic from 'next/dynamic'

// Coordenadas por defecto (centro de México)
const DEFAULT_COORDS = {
    lat: 19.4326,
    lng: -99.1332
}

// Importar Leaflet dinámicamente (sin SSR) para evitar errores de hidratación
const MapWithNoSSR = dynamic(() => import('./LeafletMap'), { 
    ssr: false,
    loading: () => (
        <div className="h-64 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
            <p className="text-gray-500">Cargando mapa...</p>
        </div>
    )
})

interface MapDisplayProps {
    showApproximateLocation?: boolean;
}

const MapDisplay = ({ showApproximateLocation = false }: MapDisplayProps) => {
    const { watch } = useFormContext() || {}
    
    // Observar las coordenadas en el formulario - usar coordenadas por defecto como fallback
    const lat = watch?.('location.coordinates.lat') || DEFAULT_COORDS.lat
    const lng = watch?.('location.coordinates.lng') || DEFAULT_COORDS.lng
    
    // Observar información de dirección para mostrar en el mapa
    const address = watch?.('location.address') || ''
    const city = watch?.('location.city') || ''
    const state = watch?.('location.state') || ''
    const colony = watch?.('location.colony') || ''
    
    // Indicador para saber si se han establecido coordenadas válidas
    const [hasValidCoordinates, setHasValidCoordinates] = useState(false)
    
    // Verificar si las coordenadas son válidas
    useEffect(() => {
        // Coordenadas se consideran válidas si son diferentes de 0,0 o muy cercanas a 0,0
        const isValid = 
            (lat !== 0 || lng !== 0) && 
            (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001)
        
        setHasValidCoordinates(isValid)
    }, [lat, lng])
    
    // Formatear la dirección completa para mostrar, con opción aproximada
    const fullAddress = showApproximateLocation
        ? `Col. ${colony || 'N/A'}, ${city}, ${state}` // Solo colonia, ciudad y estado si es aproximada
        : `${address}${colony ? `, Col. ${colony}` : ''}, ${city}, ${state}` // Dirección completa si es exacta
    
    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Ubicación en Mapa</h2>
            
            {hasValidCoordinates ? (
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                            <p className="text-sm">{fullAddress}</p>
                            {showApproximateLocation && (
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 flex items-center">
                                    <PiEyeSlash className="mr-1" /> Ubicación aproximada
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Coordenadas: {showApproximateLocation 
                                ? `${lat.toFixed(2)}..., ${lng.toFixed(2)}...` // Coordenadas truncadas si es aproximada 
                                : `${lat.toFixed(6)}, ${lng.toFixed(6)}`} {/* Coordenadas exactas */}
                        </p>
                    </div>
                    
                    {/* Mapa con las coordenadas */}
                    <div className="h-64 rounded-lg overflow-hidden">
                        <MapWithNoSSR 
                            lat={lat} 
                            lng={lng} 
                            popupText={fullAddress} 
                            zoom={showApproximateLocation ? 13 : 15} // Zoom más alejado si es ubicación aproximada
                            showPin={!showApproximateLocation} // No mostrar pin si es ubicación aproximada
                        />
                    </div>
                </div>
            ) : (
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-gray-500 text-center p-4">
                        <p className="mb-2">
                            Las coordenadas se mostrarán aquí cuando completes la dirección, ciudad y estado.
                        </p>
                        <p className="text-sm">
                            Haz clic en el botón &quot;Geocodificar&quot; para obtener las coordenadas exactas de la dirección.
                        </p>
                    </div>
                </div>
            )}
        </Card>
    )
}

export default MapDisplay