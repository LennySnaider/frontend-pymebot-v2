/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/types.ts
 * Tipos y interfaces para el módulo de gestión de leads inmobiliarios.
 * Incluye definiciones para leads, miembros, comentarios y columnas.
 *
 * @version 2.2.0
 * @updated 2025-05-20
 */

import type { Appointment as SchedulerAppointment } from '@/app/(protected-pages)/modules/appointments/_components/types'

export interface Comment {
    id: string
    name: string
    src: string
    message: string
    date: number | Date
}

export type Member = {
    id: string
    name: string
    email: string
    img: string
}

export type Ticket = {
    id: string
    name: string
    description: string
    cover: string
    members?: Member[]
    labels?: string[]
    attachments?: {
        id: string
        name: string
        src: string
        size: string
    }[]
    comments?: Comment[]
    dueDate: number | null
}

// Tipos de propiedad inmobiliaria
export type PropertyType = 'Apartamento' | 'Casa' | 'Local Comercial' | 'Oficina' | 'Terreno' | 'Nave Industrial'

// Estado de la cita
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed'

// Estructura para gestionar citas con clientes
export interface Appointment {
    id: string;
    leadId: string;
    date: string;
    time: string;
    location: string;
    propertyType: PropertyType;
    agentId: string;
    status: AppointmentStatus;
    notes?: string;
    followUpDate?: string;
    followUpNotes?: string;
    createdAt: string;
    updatedAt: string;
    propertyIds?: string[]; // Añadido para compatibilidad con AppointmentScheduler
}

// Funciones de conversión entre tipos de citas
export const convertToSchedulerAppointment = (appointment: Appointment): SchedulerAppointment => {
    return {
        id: appointment.id,
        entityId: appointment.leadId,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
        propertyType: appointment.propertyType,
        agentId: appointment.agentId,
        status: appointment.status === 'confirmed' ? 'scheduled' : appointment.status as "scheduled" | "completed" | "cancelled",
        notes: appointment.notes || '',
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        propertyIds: appointment.propertyIds || []
    }
}

export const convertFromSchedulerAppointment = (appointment: SchedulerAppointment): Appointment => {
    return {
        id: appointment.id,
        leadId: appointment.entityId,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
        propertyType: appointment.propertyType as PropertyType,
        agentId: appointment.agentId,
        status: appointment.status as AppointmentStatus,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        propertyIds: appointment.propertyIds
    }
}

// Nueva interfaz para los Leads que extiende Ticket
export interface Lead extends Ticket {
    metadata?: {
        email?: string
        phone?: string
        interest?: 'alto' | 'medio' | 'bajo'
        source?: string
        budget?: number
        propertyType?: string
        preferredZones?: string[]
        bedroomsNeeded?: number
        bathroomsNeeded?: number
        leadStatus?: string
        lastContactDate?: number
        nextContactDate?: number
        agentNotes?: string
    }
    contactCount?: number
    columnId?: string
    createdAt?: number
    // Añadimos la propiedad appointment para gestionar las citas
    appointment?: Appointment
    // Añadimos la propiedad stage para controlar el estado
    stage?: string
    // Añadimos propiedades convenientes para leads inmobiliarios
    email?: string
    phone?: string
    budget?: number
}

export type Members = Member[]

export type Columns = Record<string, Ticket[]>

export type LeadColumns = Record<string, Lead[]>

export type ProjectMembers = {
    participantMembers: Members
    allMembers: Members
}

export type SalesTeam = {
    activeAgents: Members
    allAgents: Members
}

// Tipo para las etapas del embudo de ventas
export interface FunnelStage {
    id: string
    name: string
    description?: string
    order: number
    color?: string
}

// Tipo para un embudo de ventas completo
export interface SalesFunnel {
    id: string
    name: string
    stages: FunnelStage[]
    leads: Lead[]
}