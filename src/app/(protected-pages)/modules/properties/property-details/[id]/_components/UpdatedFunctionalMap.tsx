/**
 * frontend/src/app/(protected-pages)/modules/properties/property-details/[id]/_components/UpdatedFunctionalMap.tsx
 * Componente mejorado de mapa para la vista de detalles de propiedad
 * Respeta la configuración de ubicación aproximada
 * 
 * @version 1.2.0
 * @updated 2025-07-15
 */

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { TbMapPin, TbMap } from 'react-icons/tb'

// Tipos para la propiedad y configuraciones
interface FunctionalMapProps {
    property: any; // La información completa de la propiedad
    latitude: number;
    longitude: number;
}

// Cargar componentes de react-leaflet de forma dinámica para evitar problemas SSR
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
)

const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
)

const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
)

const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
)

const Circle = dynamic(
    () => import('react-leaflet').then((mod) => mod.Circle),
    { ssr: false }
)

const UpdatedFunctionalMap = ({ property, latitude, longitude }: FunctionalMapProps) => {
    // Estado para controlar el montaje en cliente
    const [isMounted, setIsMounted] = useState(false);
    
    // IMPORTANTE: Usamos estado local para evitar errores de hidratación
    // Para evitar discrepancias entre server y cliente, calculamos el valor en useEffect
    const [showApproximateLocation, setShowApproximateLocation] = useState(false);
    
    // Formatear la dirección en función de la configuración de privacidad
    const formatAddress = () => {
        if (!property?.location) return "Ubicación de la propiedad";
        
        const address = property.location.address || '';
        const colony = property.location.colony || '';
        const city = property.location.city || '';
        const state = property.location.state || '';
        
        return showApproximateLocation
            ? `Col. ${colony || 'N/A'}, ${city}, ${state}` 
            : `${address}${colony ? `, Col. ${colony}` : ''}, ${city}, ${state}`;
    };

    // Solo montar el mapa en el cliente
    useEffect(() => {
        setIsMounted(true);
        
        // Configuración dinámica de iconos de Leaflet
        if (typeof window !== 'undefined') {
            import('leaflet').then(L => {
                delete L.Icon.Default.prototype._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                });
            });
        }
    }, []);
    
    // Actualizar el estado local en un efecto que solo se ejecuta en el cliente
    useEffect(() => {
        // Verificar si se debe mostrar ubicación aproximada
        // Revisamos múltiples fuentes para garantizar la compatibilidad
        const isApproximate = 
            property?.location?.showApproximateLocation === true || 
            property?.location?.showApproximateLocation === "true" || 
            property?.show_approximate_location === true ||
            property?.show_approximate_location === "true";
            
        setShowApproximateLocation(isApproximate);
        
        // Debugging detallado para encontrar la causa del problema
        console.log('UpdatedFunctionalMap - Valores de ubicación aproximada (DETALLADO):', {
            'property.id': property?.id,
            'property.location completo': property?.location,
            'tipo de showApproximateLocation': typeof property?.location?.showApproximateLocation,
            'valor raw de showApproximateLocation': property?.location?.showApproximateLocation,
            'show_approximate_location directo': property?.show_approximate_location,
            'valor final usado': isApproximate
        });
        
        // También hacer el logging de la decisión final aquí para mantener el orden de los hooks
        console.log('🚩 Decisión final en UpdatedFunctionalMap:', {
            'showApproximateLocation': isApproximate,
            'se muestra dirección exacta': !isApproximate
        });
    }, [property]);

    if (!latitude || !longitude) {
        return (
            <div className="h-[400px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <TbMap className="text-5xl mx-auto mb-2 text-gray-400" />
                    <p>No hay coordenadas disponibles para mostrar el mapa</p>
                </div>
            </div>
        );
    }

    // Si no estamos en cliente todavía, mostramos un placeholder
    if (!isMounted) {
        return (
            <div className="h-[400px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <TbMap className="text-5xl mx-auto mb-2 text-gray-400" />
                    <p>Cargando mapa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Información de dirección */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm mb-2 sm:mb-0">{formatAddress()}</p>
                    {showApproximateLocation && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 flex items-center self-start">
                            <TbMapPin className="mr-1" /> Ubicación aproximada
                        </span>
                    )}
                </div>
                {/* Solo mostrar coordenadas si NO es ubicación aproximada */}
                {!showApproximateLocation && (
                    <p className="text-xs text-gray-500 mt-1">
                        Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                )}
            </div>
            
            {/* Mapa con las coordenadas */}
            <div className="h-[400px] rounded-lg overflow-hidden">
                <MapContainer
                    center={[latitude, longitude]}
                    zoom={showApproximateLocation ? 13 : 15}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {!showApproximateLocation ? (
                        // Marcador normal si es ubicación exacta
                        <Marker position={[latitude, longitude]}>
                            <Popup>{formatAddress()}</Popup>
                        </Marker>
                    ) : (
                        // Círculo para ubicación aproximada
                        <Circle
                            center={[latitude, longitude]}
                            radius={500}
                            pathOptions={{ 
                                fillColor: '#3b82f6', 
                                fillOpacity: 0.2,
                                color: '#3b82f6',
                                opacity: 0.5
                            }}
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default UpdatedFunctionalMap;