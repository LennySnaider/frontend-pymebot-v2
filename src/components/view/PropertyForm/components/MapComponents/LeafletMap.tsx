/**
 * frontend/src/components/view/PropertyForm/components/MapComponents/LeafletMap.tsx
 * Componente de mapa con Leaflet para mostrar la ubicación de la propiedad.
 * Este componente se carga dinámicamente para evitar problemas de SSR.
 * Usa iconos personalizados de la librería react-icons en lugar de los PNG predeterminados.
 * 
 * @version 1.1.0
 * @updated 2025-06-27
 */

'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import '@/assets/styles/components/leaflet-map.css'
import L from 'leaflet'
import { renderToString } from 'react-dom/server'
import navigationIcon from '@/configs/navigation-icon.config'

// Propiedades para el componente de mapa
interface LeafletMapProps {
    lat: number
    lng: number
    popupText?: string
    zoom?: number
    iconColor?: string
    showPin?: boolean // Indica si se debe mostrar el pin en el mapa
}

// Función para crear un icono personalizado con los íconos de react-icons
const createCustomIcon = (color: string = '#3b82f6') => {
    // Renderizamos el ícono de react-icons a un string HTML
    const iconHtml = renderToString(
        <div style={{ 
            color: color, 
            fontSize: '36px',
            // El filtro de sombra se aplica desde CSS para mejor rendimiento
            // Las transiciones y animaciones también se manejan desde CSS
        }}>
            {navigationIcon.mapPin}
        </div>
    )

    // Creamos un icono personalizado de Leaflet usando DivIcon
    return L.divIcon({
        html: iconHtml,
        className: 'custom-map-pin-icon', // Clase CSS para personalización adicional
        iconSize: [36, 36], // Tamaño del icono
        iconAnchor: [18, 36], // Punto de anclaje (mitad del ancho, altura completa)
        popupAnchor: [0, -36] // Punto donde se abre el popup (centrado horizontalmente, arriba del icono)
    })
}

const LeafletMap = ({ lat, lng, popupText = '', zoom = 13, iconColor = '#3b82f6', showPin = true }: LeafletMapProps) => {
    // Referencia al contenedor del mapa
    const mapRef = useRef<HTMLDivElement>(null)
    // Referencia a la instancia del mapa
    const mapInstanceRef = useRef<L.Map | null>(null)
    
    useEffect(() => {
        // Si no hay contenedor de mapa, no hacer nada
        if (!mapRef.current) return
        
        // Cargar mapa solo si las coordenadas son válidas
        if (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001) {
            // Crear mapa si no existe
            if (!mapInstanceRef.current) {
                mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], zoom)
                
                // Añadir capa de OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstanceRef.current)
            } else {
                // Si ya existe el mapa, solo actualizar la vista
                mapInstanceRef.current.setView([lat, lng], zoom)
            }
            
            // Limpiar marcadores existentes
            mapInstanceRef.current.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapInstanceRef.current?.removeLayer(layer)
                }
            })
            
            // Crear icono personalizado con el color especificado
            const customIcon = createCustomIcon(iconColor)
            
            // Solo añadir marcador si showPin es true
            if (showPin) {
                // Añadir marcador con icono personalizado y popup
                const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current)
                
                if (popupText) {
                    marker.bindPopup(popupText).openPopup()
                }
            } else {
                // Si no mostramos pin, podemos agregar un círculo semi-transparente para indicar área aproximada
                L.circle([lat, lng], {
                    radius: 500, // 500 metros de radio
                    color: iconColor,
                    fillColor: iconColor,
                    fillOpacity: 0.2,
                    opacity: 0.5
                }).addTo(mapInstanceRef.current)
            }
        }
        
        // Cleanup al desmontar
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [lat, lng, popupText, zoom, iconColor])
    
    return <div ref={mapRef} className="h-full w-full" />
}

export default LeafletMap