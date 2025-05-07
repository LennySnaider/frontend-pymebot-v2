/**
 * frontend/src/app/(protected-pages)/modules/appointments/_store/appointmentStore.ts
 * Store Zustand para la gestión de citas en la aplicación. Proporciona funciones para obtener, crear,
 * actualizar y eliminar citas, así como gestionar el estado del diálogo de programación.
 *
 * @version 2.1.6
 * @updated 2025-04-20 (fetchCalendarAppointments no longer updates global state)
 */

import { create } from 'zustand'
import {
    AppointmentData,
    getAppointments,
} from '@/server/actions/appointments/getAppointments'
import { getAppointmentById } from '@/server/actions/appointments/getAppointmentById'
import { createAppointment } from '@/server/actions/appointments/createAppointment'
import { updateAppointment } from '@/server/actions/appointments/updateAppointment'
import {
    updateAppointmentStatus,
    AppointmentStatus,
} from '@/server/actions/appointments/updateAppointmentStatus'
import { deleteAppointment } from '@/server/actions/appointments/deleteAppointment'
import { getAppointmentsByDateRange } from '@/server/actions/appointments/getAppointmentsByDateRange'
import { getAgentAvailability } from '@/server/actions/getAgentAvailability'
import { getPropertiesForAppointment } from '@/server/actions/properties/getPropertiesForAppointment'
import type { Property } from '@/server/actions/properties/getPropertiesForAppointment'
import type { TimeSlot } from '@/app/(protected-pages)/modules/appointments/_components/types'
import type { CalendarEvent } from '@/app/(protected-pages)/modules/calendar/types' // Usado para el tipo de retorno, aunque el objeto creado es más complejo
import { getAgentColor } from '@/app/(protected-pages)/modules/appointments/calendar-view/_store/agentColors'
// import dayjs from 'dayjs' // No se usa

export interface AppointmentState {
    appointments: AppointmentData[]
    calendarAppointments: CalendarEvent[] // Mantenemos este tipo para el estado, aunque la función devuelva un tipo más rico
    selectedAppointment: AppointmentData | null
    isLoading: boolean
    error: string | null
    isAppointmentDialogOpen: boolean
    isEditMode: boolean
    isDetailsDialogOpen: boolean
    filters: {
        agent_id?: string
        lead_id?: string
        status?: string
        property_type?: string
        fromDate?: string
        toDate?: string
    }
    availableAgents: { id: string; name: string; avatar?: string }[]
    availablePropertyTypes: { value: string; label: string }[]
    availableStatuses: { value: string; label: string; color: string }[]
    fetchAppointments: (filters?: Record<string, unknown>) => Promise<void>
    fetchAppointmentById: (id: string) => Promise<AppointmentData | null>
    // La función devuelve un array de objetos compatibles con FullCalendar Event Input
    fetchCalendarAppointments: (
        startDate: string,
        endDate: string,
    ) => Promise<any[]> // Usar any[] temporalmente para evitar conflicto de tipos complejo
    refreshCalendarData: () => Promise<void> // Nueva función auxiliar
    addAppointment: (appointment: Omit<AppointmentData, 'id'>) => Promise<void>
    updateAppointment: (
        id: string,
        appointment: Partial<AppointmentData>,
    ) => Promise<void>
    updateAppointmentStatus: (
        id: string,
        status: AppointmentStatus,
        notes?: string,
    ) => Promise<void>
    deleteAppointment: (id: string) => Promise<void>
    openAppointmentDialog: (isEdit: boolean, appointmentId?: string) => void
    closeAppointmentDialog: () => void
    openDetailsDialog: (appointmentId: string) => Promise<void>
    closeDetailsDialog: () => void
    selectAppointment: (appointment: AppointmentData | null) => void
    updateFilters: (newFilters: Partial<AppointmentState['filters']>) => void
    resetFilters: () => void
    getRecommendedProperties: (
        leadId: string,
        agentId?: string,
    ) => Promise<Property[]>
    getAgentAvailability: (
        agentId: string,
        startDate: string,
    ) => Promise<Record<string, TimeSlot[]>>
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
    appointments: [],
    calendarAppointments: [],
    selectedAppointment: null,
    isLoading: false,
    error: null,
    isAppointmentDialogOpen: false,
    isEditMode: false,
    isDetailsDialogOpen: false,
    filters: {},
    availableAgents: [],
    availablePropertyTypes: [
        { value: 'Casa', label: 'Casa' },
        { value: 'Apartamento', label: 'Apartamento' },
        { value: 'Local Comercial', label: 'Local Comercial' },
        { value: 'Oficina', label: 'Oficina' },
        { value: 'Terreno', label: 'Terreno' },
        { value: 'Nave Industrial', label: 'Nave Industrial' },
    ],
    availableStatuses: [
        { value: 'scheduled', label: 'Programada', color: 'blue' },
        { value: 'confirmed', label: 'Confirmada', color: 'green' },
        { value: 'completed', label: 'Completada', color: 'purple' },
        { value: 'cancelled', label: 'Cancelada', color: 'red' },
        { value: 'rescheduled', label: 'Reprogramada', color: 'orange' },
    ],

    fetchAppointments: async (filters = {}) => {
        const state = get()
        const combinedFilters = { ...state.filters, ...filters }
        set({ isLoading: true, error: null })
        try {
            const appointments = await getAppointments(combinedFilters)
            set({ appointments, isLoading: false })
        } catch (error) {
            console.error('Error al cargar citas:', error)
            set({
                error: 'Error al cargar las citas. Por favor, inténtelo de nuevo.',
                isLoading: false,
            })
        }
    },

    fetchAppointmentById: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            const appointment = await getAppointmentById(id)
            set({ isLoading: false })
            return appointment
        } catch (error) {
            console.error('Error al obtener cita:', error)
            set({
                error: 'Error al obtener la cita. Por favor, inténtelo de nuevo.',
                isLoading: false,
            })
            return null
        }
    },

    // Cargar citas para el calendario y DEVOLVERLAS (SIN ACTUALIZAR ESTADO GLOBAL)
    fetchCalendarAppointments: async (
        startDate: string,
        endDate: string,
    ): Promise<any[]> => {
        // ELIMINADO: No actualizar isLoading ni error
        // ELIMINADO: No hacer log
        let formattedAppointments: any[] = [] // Variable para devolver

        try {
            const { agent_id } = get().filters
            const appointments = await getAppointmentsByDateRange(
                startDate,
                endDate,
                agent_id,
            )

            formattedAppointments = appointments.map((appointment) => {
                let formattedTimeStr
                try {
                    const timeStr = appointment.appointment_time || '12:00'
                    const parts = timeStr.split(':')
                    const hh = parts[0].padStart(2, '0')
                    const mm = (parts[1] ?? '00').padStart(2, '0')
                    formattedTimeStr = `${hh}:${mm}`
                    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
                    if (!timeRegex.test(formattedTimeStr)) {
                        formattedTimeStr = '12:00'
                    }
                } catch (error) {
                    // Manejar error silenciosamente
                    formattedTimeStr = '12:00'
                }

                let endTimeStr
                try {
                    const timeParts = formattedTimeStr.split(':')
                    const hours = parseInt(timeParts[0])
                    const minutes = timeParts[1]
                    if (!isNaN(hours) && hours >= 0 && hours < 24) {
                        endTimeStr =
                            hours < 23
                                ? `${String(hours + 1).padStart(2, '0')}:${minutes}` // Asegurar formato HH
                                : formattedTimeStr
                    } else {
                        endTimeStr = '13:00'
                    }
                } catch (error) {
                    // Manejar error silenciosamente
                    endTimeStr = '13:00'
                }

                const statusLabel =
                    get().availableStatuses.find(
                        (s) => s.value === appointment.status,
                    )?.label ||
                    appointment.status ||
                    'Sin estado'
                const statusColor =
                    get().availableStatuses.find(
                        (s) => s.value === appointment.status,
                    )?.color || 'blue'
                const agentAvatar = appointment.agent?.profile_image || ''
                const finalEventColor = appointment.agent_id
                    ? getAgentColor(appointment.agent_id)
                    : statusColor

                // Construir el objeto compatible con FullCalendar Event Input
                const eventObject = {
                    id: appointment.id,
                    title: appointment.leadName || 'Sin cliente',
                    start: `${appointment.appointment_date}T${formattedTimeStr}`,
                    end: `${appointment.appointment_date}T${endTimeStr}`,
                    eventColor: finalEventColor,
                    backgroundColor: finalEventColor,
                    textColor: '#333333',
                    extendedProps: {
                        appointmentId: appointment.id,
                        agentId: appointment.agent_id,
                        agentName: appointment.agentName,
                        agentAvatar: agentAvatar,
                        leadName: appointment.leadName,
                        location: appointment.location,
                        status: appointment.status,
                        statusColor: statusColor,
                        subtitle: statusLabel,
                    },
                }
                return eventObject
            })

            // ELIMINADO: No actualizar el estado del store
            return formattedAppointments // Devolver los eventos
        } catch (error) {
            // Manejar error silenciosamente
            return [] // Devolver array vacío en caso de error
        }
    },

    // Función auxiliar para refrescar los datos del calendario
    refreshCalendarData: async () => {
        // Obtener fechas actuales para refrescar el calendario
        const today = new Date()
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
            .toISOString()
            .split('T')[0]
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            .toISOString()
            .split('T')[0]

        // Llamar a fetchCalendarAppointments para actualizar los datos del calendario
        await get().fetchCalendarAppointments(startDate, endDate)
    },

    addAppointment: async (appointmentData) => {
        set({ isLoading: true, error: null })
        try {
            await createAppointment(appointmentData)

            // 1. Actualizar la lista de citas
            await get().fetchAppointments()

            // 2. Actualizar también el calendario usando la función auxiliar
            await get().refreshCalendarData()

            set({ isLoading: false })
        } catch (error) {
            console.error('Error al crear cita:', error)
            set({
                error: 'Error al crear la cita. Por favor, inténtelo de nuevo.',
                isLoading: false,
            })
            throw error
        }
    },

    updateAppointment: async (id, appointmentData) => {
        set({ isLoading: true, error: null })
        try {
            await updateAppointment(id, appointmentData)

            // 1. Actualizar la lista de citas
            await get().fetchAppointments()

            // 2. Actualizar también el calendario usando la función auxiliar
            await get().refreshCalendarData()

            set({ isLoading: false })
        } catch (error) {
            console.error('Error al actualizar cita:', error)
            set({
                error: 'Error al actualizar la cita. Por favor, inténtelo de nuevo.',
                isLoading: false,
            })
            throw error
        }
    },

    updateAppointmentStatus: async (id, status, notes) => {
        set({ isLoading: true, error: null })
        try {
            const result = await updateAppointmentStatus(
                id,
                status as AppointmentStatus,
                notes,
            )
            if (!result.success) {
                throw new Error(result.error)
            }

            // 1. Actualizar la lista de citas
            await get().fetchAppointments()

            // 2. Actualizar también el calendario usando la función auxiliar
            await get().refreshCalendarData()

            set({ isLoading: false })
        } catch (error) {
            console.error('Error al actualizar estado de cita:', error)
            set({
                error: 'Error al actualizar el estado de la cita.',
                isLoading: false,
            })
            throw error
        }
    },

    deleteAppointment: async (id) => {
        set({ isLoading: true, error: null })
        try {
            await deleteAppointment(id)

            // 1. Actualizar la lista de citas
            await get().fetchAppointments()

            // 2. Actualizar también el calendario usando la función auxiliar
            await get().refreshCalendarData()

            set({ isLoading: false })
        } catch (error) {
            console.error('Error al eliminar cita:', error)
            set({
                error: 'Error al eliminar la cita. Por favor, inténtelo de nuevo.',
                isLoading: false,
            })
            throw error
        }
    },

    openAppointmentDialog: (isEdit, appointmentId) => {
        if (isEdit && appointmentId) {
            get()
                .fetchAppointmentById(appointmentId)
                .then((appointment) => {
                    if (appointment) {
                        set({
                            selectedAppointment: appointment,
                            isAppointmentDialogOpen: true,
                            isEditMode: true,
                        })
                    }
                })
        } else {
            set({
                selectedAppointment: null,
                isAppointmentDialogOpen: true,
                isEditMode: false,
            })
        }
    },

    closeAppointmentDialog: () => {
        set({
            isAppointmentDialogOpen: false,
            selectedAppointment: null,
        })
    },

    openDetailsDialog: async (appointmentId) => {
        try {
            const appointment = await get().fetchAppointmentById(appointmentId)
            if (appointment) {
                set({
                    selectedAppointment: appointment,
                    isDetailsDialogOpen: true,
                })
            }
        } catch (error) {
            console.error('Error al abrir detalles de cita:', error)
        }
    },

    closeDetailsDialog: () => {
        set({
            isDetailsDialogOpen: false,
            selectedAppointment: null,
        })
    },

    selectAppointment: (appointment) => {
        set({ selectedAppointment: appointment })
    },

    updateFilters: (newFilters) => {
        const currentFilters = get().filters
        const updatedFilters = { ...currentFilters, ...newFilters }
        set({ filters: updatedFilters })
        get().fetchAppointments()
    },

    resetFilters: () => {
        set({ filters: {} })
        get().fetchAppointments()
    },

    getRecommendedProperties: async (leadId, agentId) => {
        try {
            return await getPropertiesForAppointment(leadId, agentId)
        } catch (error) {
            console.error('Error al obtener propiedades recomendadas:', error)
            throw error
        }
    },

    getAgentAvailability: async (agentId, startDate) => {
        try {
            return await getAgentAvailability(agentId, startDate)
        } catch (error) {
            console.error('Error al obtener disponibilidad del agente:', error)
            throw error
        }
    },
}))

export default useAppointmentStore
