/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/types.ts
 * Tipos para la gestión de citas en la aplicación.
 *
 * @version 1.0.0
 * @updated 2025-06-30
 */

export interface Appointment {
    id: string
    lead_id: string
    agent_id?: string
    appointment_date: string
    appointment_time: string
    location: string
    property_type?: string
    status: string
    notes?: string
    property_ids?: string[]
    follow_up_date?: string
    follow_up_notes?: string
    created_at: string
    updated_at: string
    tenant_id: string
    // Relaciones
    lead?: {
        id: string
        full_name: string
        email?: string
        phone?: string
        profile_image?: string // Añadir profile_image opcional
    }
    agent?: {
        id: string
        name: string
        email: string
        profile_image?: string
    }
    properties?: Array<{
        id: string
        name: string
        price: number
        currency: string
        location?: string | any
    }>
}

export interface Filter {
    status: string[]
    propertyType: string[]
    agentId: string
    dateRange: [string | null, string | null]
}

export type AppointmentStatus =
    | 'scheduled'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'rescheduled'
