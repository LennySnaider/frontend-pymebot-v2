/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-details/[id]/types.ts
 * Definición de tipos para los prospectos (leads) y sus detalles
 * 
 * @version 1.0.0
 * @updated 2025-07-04
 */

export interface Lead {
    id: string
    name: string
    email: string
    phone: string
    img?: string
    role?: string
    lastOnline?: string
    status: string
    status_color?: string
    tags?: string[]
    
    // Campos específicos de Lead
    stage: string
    source: string
    interest_level: string
    budget_min: number
    budget_max: number
    property_type: string
    preferred_zones?: string[]
    bedrooms_needed?: number
    bathrooms_needed?: number
    features_needed?: string[]
    notes?: string
    agent?: {
        id: string
        name: string
        email: string
        [key: string]: any
    }
    last_contact_date?: string
    next_contact_date?: string
    contact_count?: number
    created_at?: string
    updated_at?: string
    tenant_id?: string
    
    // Relaciones
    appointments?: Appointment[]
    
    // Campos para compatibilidad con Customer
    personalInfo?: {
        location?: string
        title?: string
        birthday?: string
        phoneNumber?: string
        dialCode?: string
        address?: string
        postcode?: string
        city?: string
        country?: string
        facebook?: string
        twitter?: string
        pinterest?: string
        linkedIn?: string
    }
    
    orderHistory?: {
        id: string
        item: string
        status: string
        amount: number
        date: number
    }[]
    
    paymentMethod?: {
        cardHolderName: string
        cardType: string
        expMonth: string
        expYear: string
        last4Number: string
        primary: boolean
    }[]
    
    subscription?: {
        plan: string
        status: string
        billing: string
        nextPaymentDate: number
        amount: number
    }[]
    
    totalSpending?: number
}

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
    lead?: any
    agent?: any
    properties?: any[]
}

export interface LeadActivity {
    id: string
    lead_id: string
    agent_id?: string
    activity_type: string
    description: string
    created_at: string
    updated_at: string
    tenant_id: string
    metadata?: any
}

export interface Property {
    id: string
    name: string
    description?: string
    price?: number
    currency?: string
    images?: string[]
}