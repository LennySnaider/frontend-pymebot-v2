/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/types.ts
 * Interfaces y tipos para el módulo de citas.
 *
 * @version 1.0.0
 * @updated 2025-04-19
 */

// Interfaces genéricas para entidades
export interface EntityData {
    id: string
    name: string
    email?: string
    phone?: string
    budget?: number
    propertyType?: string // Tipo de propiedad de interés
    location?: string // Ubicación preferida
    interestedPropertyIds?: string[] // IDs de propiedades de interés
    [key: string]: any
}

// Interfaz para propiedades inmobiliarias
export interface Property {
    id: string
    title: string // Cambiado de name a title
    description: string
    price: number
    currency: string
    status: 'available' | 'sold' | 'rented' | 'pending'
    propertyType: string
    features: {
        bedrooms: number
        bathrooms: number
        area: number
        hasGarage?: boolean
        hasPool?: boolean
        hasGarden?: boolean
    }
    latitude?: number // Cambiado de location a latitude/longitude
    longitude?: number
    agentId: string
    // media: { // Eliminado, las imágenes están en un bucket
    //     id: string
    //     type: 'image' | 'video'
    //     url: string
    //     isPrimary?: boolean
    // }[]
}

// Interfaz para selección de agentes
export interface AgentOption {
    value: string
    label: string
}

// Interfaz para slots de tiempo
export interface TimeSlot {
    date: string
    time: string
    available: boolean
}

// Interfaz para citas
export interface Appointment {
    id: string
    entityId: string
    date: string
    time: string
    location: string
    notes: string
    propertyType: string
    agentId: string
    status: 'scheduled' | 'completed' | 'cancelled'
    createdAt: string
    updatedAt: string
    propertyIds: string[]
}

// Interfaz para opciones de tipo de propiedad (usado en ReviewStep y potencialmente otros)
export interface PropertyTypeOption {
    value: string
    label: string
}
