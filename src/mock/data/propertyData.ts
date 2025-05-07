/**
 * frontend/src/mock/data/propertyData.ts
 * Datos de prueba para propiedades inmobiliarias.
 * 
 * @version 1.0.0
 * @updated 2025-06-01
 */

import { Property } from '@/components/view/PropertyForm/types'

// Datos de propiedades para pruebas y desarrollo
export const propertiesData: Property[] = [
    {
        id: 'property-1',
        name: 'Casa Moderna en Juriquilla',
        propertyCode: 'PROP-001',
        description: 'Hermosa casa moderna con acabados de lujo en la mejor zona de Juriquilla.',
        price: 4500000,
        currency: 'MXN',
        status: 'available',
        propertyType: 'house',
        operationType: 'sale',
        features: {
            bedrooms: 3,
            bathrooms: 3.5,
            area: 250,
            parkingSpots: 2,
            yearBuilt: 2020,
            hasPool: true,
            hasGarden: true,
            hasGarage: true,
            hasSecurity: true
        },
        location: {
            address: 'Calle Juriquilla 123',
            city: 'Querétaro',
            state: 'Querétaro',
            zipCode: '76230',
            country: 'México',
            coordinates: {
                lat: 20.6901,
                lng: -100.4450
            }
        },
        media: [
            {
                id: 'media-1',
                type: 'image',
                url: 'https://picsum.photos/800/600?random=1',
                isPrimary: true
            },
            {
                id: 'media-2',
                type: 'image',
                url: 'https://picsum.photos/800/600?random=2'
            }
        ],
        agentId: 'agent-1',
        createdAt: '2025-05-10T12:00:00Z',
        updatedAt: '2025-05-10T12:00:00Z'
    },
    {
        id: 'property-2',
        name: 'Apartamento en El Centro',
        propertyCode: 'PROP-002',
        description: 'Acogedor apartamento completamente remodelado en el centro histórico.',
        price: 2800000,
        currency: 'MXN',
        status: 'available',
        propertyType: 'apartment',
        operationType: 'sale',
        features: {
            bedrooms: 2,
            bathrooms: 1,
            area: 85,
            parkingSpots: 1,
            yearBuilt: 1980,
            hasPool: false,
            hasGarden: false,
            hasGarage: true,
            hasSecurity: true
        },
        location: {
            address: 'Av. 5 de Mayo 234',
            city: 'Querétaro',
            state: 'Querétaro',
            zipCode: '76000',
            country: 'México',
            coordinates: {
                lat: 20.5931,
                lng: -100.3895
            }
        },
        media: [
            {
                id: 'media-3',
                type: 'image',
                url: 'https://picsum.photos/800/600?random=3',
                isPrimary: true
            }
        ],
        agentId: 'agent-2',
        createdAt: '2025-05-11T14:30:00Z',
        updatedAt: '2025-05-11T14:30:00Z'
    },
    {
        id: 'property-3',
        name: 'Terreno en Zibatá',
        propertyCode: 'PROP-003',
        description: 'Amplio terreno con vista panorámica en el exclusivo fraccionamiento Zibatá.',
        price: 3200000,
        currency: 'MXN',
        status: 'available',
        propertyType: 'land',
        operationType: 'sale',
        features: {
            bedrooms: 0,
            bathrooms: 0,
            area: 500,
            parkingSpots: 0,
            yearBuilt: 0,
            hasPool: false,
            hasGarden: false,
            hasGarage: false,
            hasSecurity: true
        },
        location: {
            address: 'Circuito Zibatá 567',
            city: 'El Marqués',
            state: 'Querétaro',
            zipCode: '76246',
            country: 'México',
            coordinates: {
                lat: 20.7028,
                lng: -100.3601
            }
        },
        media: [
            {
                id: 'media-4',
                type: 'image',
                url: 'https://picsum.photos/800/600?random=4',
                isPrimary: true
            }
        ],
        agentId: 'agent-3',
        createdAt: '2025-05-12T09:15:00Z',
        updatedAt: '2025-05-12T09:15:00Z'
    }
]

// Exportar el array de propiedades para su uso en la aplicación
export default propertiesData