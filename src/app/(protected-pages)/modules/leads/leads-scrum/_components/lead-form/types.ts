/**
 * Tipos compartidos para los componentes del formulario de leads
 */

import { Control } from 'react-hook-form'

// Tipo para las propiedades inmobiliarias
export interface Property {
    id: string
    title: string
    price: number
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    area?: number
    address?: string
    city?: string
    property_type?: string
}

// Tipo para los miembros del tablero (agentes)
export interface Member {
    id: string
    name: string
    email?: string
    img?: string
    role?: string
}

// Esquema del formulario con campos para leads
export interface FormSchema {
    name?: string
    email?: string
    phone?: string
    interest?: string
    source?: string
    notes?: string
    assignedAgent?: string
    selectedProperties?: string[]
}

// Tipo para opciones de Select
export interface SelectOption {
    value: string
    label: string
}

// Tipo para el control del formulario
export type FormControl = Control<FormSchema>
