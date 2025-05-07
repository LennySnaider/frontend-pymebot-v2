/**
 * frontend/src/services/AppointmentService.ts
 * Servicio para gestionar las peticiones API relacionadas con citas inmobiliarias.
 * 
 * @version 1.0.0
 * @updated 2025-05-16
 */

import ApiService from './ApiService'
import type { Appointment } from '@/app/(protected-pages)/concepts/leads/leads-scrum/types'

/**
 * Obtiene disponibilidad del agente para un rango de fechas
 */
export async function getAgentAvailability<T>(
    agentId: string,
    startDate: string,
    endDate?: string
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/agents/${agentId}/availability`,
        method: 'get',
        params: { startDate, endDate },
    })
}

/**
 * Obtiene propiedades recomendadas para un lead basado en sus preferencias
 */
export async function getRecommendedProperties<T>(
    leadId: string,
    agentId?: string
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/leads/${leadId}/recommended-properties`,
        method: 'get',
        params: { agentId },
    })
}

/**
 * Crea una nueva cita
 */
export async function createAppointment<T>(
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/appointments',
        method: 'post',
        data: appointment,
    })
}

/**
 * Actualiza una cita existente
 */
export async function updateAppointment<T>(
    id: string,
    appointment: Partial<Appointment>
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/appointments/${id}`,
        method: 'put',
        data: appointment,
    })
}

/**
 * Cancela una cita
 */
export async function cancelAppointment<T>(
    id: string,
    reason?: string
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/appointments/${id}/cancel`,
        method: 'post',
        data: { reason },
    })
}

/**
 * Obtiene una cita por su ID
 */
export async function getAppointment<T>(
    id: string
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/appointments/${id}`,
        method: 'get',
    })
}

/**
 * Obtiene todas las citas de un agente
 */
export async function getAgentAppointments<T>(
    agentId: string,
    startDate?: string,
    endDate?: string
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/agents/${agentId}/appointments`,
        method: 'get',
        params: { startDate, endDate },
    })
}

/**
 * Obtiene todas las citas de un lead
 */
export async function getLeadAppointments<T>(
    leadId: string
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/leads/${leadId}/appointments`,
        method: 'get',
    })
}