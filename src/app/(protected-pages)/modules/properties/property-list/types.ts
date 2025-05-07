/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/types.ts
 * Definición de tipos para las propiedades.
 * 
 * @version 2.0.0
 * @updated 2025-06-22
 */

export type PropertyType = 'house' | 'apartment' | 'land' | 'commercial' | 'office' | 'industrial';

export type PropertyStatus = 'available' | 'sold' | 'rented' | 'pending' | 'reserved';

export type OperationType = 'sale' | 'rent' | 'all';

export interface PropertyFeatures {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    parkingSpots?: number;
    yearBuilt?: number;
    hasPool?: boolean;
    hasGarden?: boolean;
    hasGarage?: boolean;
    hasSecurity?: boolean;
    securitySystem?: boolean;
    otherFeatures?: string[];
}

export interface PropertyLocation {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    colony?: string;
    showApproximateLocation?: boolean;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface PropertyMedia {
    id: string;
    type: string;
    url: string;
    title?: string;
    isPrimary?: boolean;
    displayOrder?: number;
    // Propiedades para el recorte
    cropZoom?: number;
    cropPosition?: { x: number; y: number };
    croppedAreaPixels?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    _storagePath?: string;
    _file?: File;
}

export interface Property {
    id: string;
    name: string;
    propertyCode?: string;
    description?: string;
    propertyType: PropertyType;
    status: PropertyStatus;
    operationType?: OperationType;
    price: number;
    currency: string;
    features?: PropertyFeatures;
    location?: PropertyLocation;
    // Valor original de show_approximate_location para verificaciones directas
    show_approximate_location?: boolean | string;
    media?: PropertyMedia[];
    agentId?: string;
    // Campos extendidos para la ficha técnica (no están en la DB, se añaden en runtime)
    agentName?: string;
    agentEmail?: string;
    agentPhone?: string;
    createdAt?: string;
    updatedAt?: string;
    tenant_id?: string;
}