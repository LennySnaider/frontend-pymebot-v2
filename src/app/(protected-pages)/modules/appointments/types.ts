/**
 * frontend/src/app/(protected-pages)/modules/appointments/types.ts
 * Tipos para el módulo de citas inmobiliarias.
 * 
 * @version 1.0.0
 * @updated 2025-05-16
 */

import type { PropertyType } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'

// Estado de la cita
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'

// Estructura principal de una cita
export interface Appointment {
    id: string
    leadId: string
    date: string
    time: string
    location: string
    propertyType: PropertyType
    agentId: string
    propertyIds?: string[]
    status: AppointmentStatus
    notes?: string
    createdAt: string
    updatedAt: string
}

// Metadatos para integración con calendario
export interface AppointmentMeta {
    type: 'real-estate-appointment'
    leadId: string
    agentId: string
    propertyIds: string[]
    propertyType: PropertyType
    appointmentStatus: AppointmentStatus
}

// Filtros para citas
export interface AppointmentFilters {
    agentId?: string
    propertyType?: PropertyType
    status?: AppointmentStatus
    dateRange?: {
        startDate: Date
        endDate: Date
    }
}

// Opciones para filtros
export interface AgentOption {
    id: string
    name: string
    avatar_url?: string
}

export interface PropertyTypeOption {
    value: PropertyType
    label: string
}

export interface StatusOption {
    value: AppointmentStatus
    label: string
    color: string
}