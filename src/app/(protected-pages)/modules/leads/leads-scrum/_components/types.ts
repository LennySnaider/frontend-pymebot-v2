// frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/types.ts
export interface Member {
    id: string
    name: string
    img?: string
}

export interface Comment {
    id: string
    name: string
    src?: string
    message: string
    date: Date | number
}

export interface SimpleAttachment {
    id: string
    name: string
    src?: string
    size: string
    type: string
}

export interface Property {
    id: string
    name?: string
    title?: string
    code?: string
    location?: string
    address?: string
    city?: string
    colony?: string
    price: number
    currency: string
    propertyType?: string
    property_type?: string
    bedrooms?: number
    bathrooms?: number
    area?: number
    description?: string
    media?: unknown[] // Cambiado any[] a unknown[]
    status?: string
}

export interface LeadMetadata {
    propertyType?: string
    budget?: number
    email?: string
    phone?: string
    preferredZones?: string[]
    agentNotes?: string
    selectedProperty?: string
    budgetMax?: number
    bedroomsNeeded?: number
    bathroomsNeeded?: number
    featuresNeeded?: string
    source?: string
    interest?: string
    nextContactDate?: string
}

export interface Lead {
    id: string
    name: string
    description?: string
    attachments?: SimpleAttachment[]
    members?: Member[]
    comments?: Comment[]
    labels?: string[]
    contactCount?: number
    dueDate?: Date | number
    columnId?: string
    metadata?: LeadMetadata
    email?: string
    phone?: string
    budget?: number
    property_ids?: string[] // Añadido para manejar propiedades de interés
}
