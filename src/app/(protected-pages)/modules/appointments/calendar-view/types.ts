/**
 * frontend/src/app/(protected-pages)/appointments/calendar-view/types.ts
 * Tipos extendidos para la integración de citas inmobiliarias en el calendario.
 * 
 * @version 1.0.0
 * @updated 2025-05-16
 */

import type { CalendarEvent } from '@/app/(protected-pages)/modules/calendar/types'
import type { PropertyType } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'

// Metadatos específicos para citas inmobiliarias
export interface AppointmentMeta {
  type: 'real-estate-appointment'
  leadId: string
  agentId: string
  propertyIds: string[]
  propertyType: PropertyType
  appointmentStatus: AppointmentStatus
}

// Estado de la cita
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'

// Extendemos el tipo CalendarEvent para citas inmobiliarias
export interface RealEstateAppointmentEvent extends CalendarEvent {
  meta: AppointmentMeta
  location?: string
  description?: string
}

// Formulario para programar citas
export interface AppointmentFormData {
  title: string
  startDate: Date
  endDate?: Date
  location: string
  leadId: string
  agentId: string
  propertyIds: string[]
  propertyType: PropertyType
  notes?: string
  status: AppointmentStatus
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