/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_store/appointmentListStore.ts
 * Store Zustand para la gestión del estado de la lista de citas.
 * 
 * @version 1.2.0
 * @updated 2025-04-14
 */

import { create } from 'zustand'
import type { Appointment, Filter } from '../types'

export const initialFilterData: Filter = {
    status: ['scheduled', 'confirmed', 'rescheduled'],
    propertyType: [],
    agentId: '',
    dateRange: [null, null]
}

export type AppointmentListState = {
    initialLoading: boolean
    appointmentList: Appointment[]
    filterData: Filter
    selectedAppointments: Partial<Appointment>[]
    isLoading: boolean
    error: string | null
}

type AppointmentListAction = {
    setAppointmentList: (appointmentList: Appointment[]) => void
    setFilterData: (payload: Filter) => void
    setSelectedAppointments: (checked: boolean, appointment: Appointment) => void
    setSelectAllAppointments: (appointments: Appointment[]) => void
    setInitialLoading: (payload: boolean) => void
    fetchAppointments: (filters?: Record<string, any>) => Promise<void>
}

const initialState: AppointmentListState = {
    initialLoading: true,
    appointmentList: [],
    filterData: initialFilterData,
    selectedAppointments: [],
    isLoading: false,
    error: null
}

export const useAppointmentListStore = create<
    AppointmentListState & AppointmentListAction
>((set, get) => ({
    ...initialState,
    setFilterData: (payload) => set(() => ({ filterData: payload })),
    setSelectedAppointments: (checked, row) =>
        set((state) => {
            const prevData = state.selectedAppointments
            if (checked) {
                return { selectedAppointments: [...prevData, ...[row]] }
            } else {
                if (
                    prevData.some((prevAppointment) => row.id === prevAppointment.id)
                ) {
                    return {
                        selectedAppointments: prevData.filter(
                            (prevAppointment) => prevAppointment.id !== row.id,
                        ),
                    }
                }
                return { selectedAppointments: prevData }
            }
        }),
    setSelectAllAppointments: (row) => set(() => ({ selectedAppointments: row })),
    setAppointmentList: (appointmentList) => set(() => ({ appointmentList })),
    setInitialLoading: (payload) => set(() => ({ initialLoading: payload })),
    
    // Función para cargar citas desde el servidor utilizando la API REST en lugar de server actions directas
    // Esto evita el problema de pasar objetos como UUID que causaba errores
    fetchAppointments: async (filters = {}) => {
        set({ isLoading: true, error: null })
        
        try {
            // Convertir el formato de filtro del store al formato de la API
            const currentFilters = get().filterData
            const apiFilters: Record<string, any> = {
                ...filters,
                // Convertir array de estados a string si es necesario
                status: currentFilters.status?.length === 1 ? currentFilters.status[0] : undefined,
                property_type: currentFilters.propertyType?.length === 1 ? currentFilters.propertyType[0] : undefined,
                agent_id: currentFilters.agentId || undefined,
                fromDate: currentFilters.dateRange?.[0] ? new Date(currentFilters.dateRange[0]).toISOString().split('T')[0] : undefined,
                toDate: currentFilters.dateRange?.[1] ? new Date(currentFilters.dateRange[1]).toISOString().split('T')[0] : undefined
            }
            
            // Eliminar propiedades undefined
            Object.keys(apiFilters).forEach(key => {
                if (apiFilters[key] === undefined) {
                    delete apiFilters[key]
                }
            })
            
            console.log('Fetching appointments with filters:', apiFilters)
            
            // Llamar a la nueva API en lugar de la acción del servidor directamente
            const response = await fetch('/api/modules/appointments/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiFilters),
            })
            
            if (!response.ok) {
                // Si hay un error HTTP, lanzar una excepción
                const errorData = await response.json()
                throw new Error(errorData.error || `Error HTTP: ${response.status}`)
            }
            
            const result = await response.json()
            
            if (!result.success) {
                throw new Error(result.error || 'Error desconocido al obtener citas')
            }
            
            // Actualizar la lista de citas con los datos de la API
            set({ 
                appointmentList: result.data as Appointment[],
                isLoading: false 
            })
        } catch (error) {
            console.error('Error al cargar citas:', error)
            set({ 
                error: error instanceof Error ? error.message : 'Error al cargar las citas', 
                isLoading: false 
            })
        }
    }
}))