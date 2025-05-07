/**
 * frontend/src/app/(protected-pages)/modules/appointments/calendar-view/_store/calendarStore.ts
 * Store para gestionar los eventos de calendario, sincronizados con las citas del sistema.
 *
 * @version 2.1.3 - Reverted refactoring
 * @updated 2025-04-20
 */

import { create } from 'zustand'
import { useAppointmentStore } from '../../_store/appointmentStore'
import dayjs from 'dayjs'
import type { CalendarEvent } from '@/app/(protected-pages)/modules/calendar/types'
// No necesitamos FullCalendar aquí ahora
type CalendarEvents = CalendarEvent[]

export type CalendarViewType =
    | 'month'
    | 'week'
    | 'day' // Tipos internos simplificados
    | 'dayGridMonth'
    | 'timeGridWeek'
    | 'timeGridDay' // Tipos de FullCalendar

type CalendarState = {
    data: CalendarEvents
    initialLoading: boolean
    currentReferenceDate: string // formato YYYY-MM-DD
    currentView: CalendarViewType
}

// No necesitamos ViewOrDateChangePayload

type CalendarAction = {
    setData: (data: CalendarEvents) => void
    setInitialLoading: (initialLoading: boolean) => void
    setCurrentReferenceDate: (date: string) => void
    setCurrentView: (view: CalendarViewType) => void
    syncWithAppointments: (
        refDateStr?: string,
        view?: CalendarViewType,
    ) => Promise<void>
    // handleViewOrDateChange eliminada
}

const initialState: CalendarState = {
    data: [],
    initialLoading: true,
    currentReferenceDate: dayjs().format('YYYY-MM-DD'),
    currentView: 'dayGridMonth',
}

export const useCalendar = create<CalendarState & CalendarAction>(
    (set, get) => ({
        ...initialState,
        setData: (data) => set(() => ({ data })),
        setInitialLoading: (initialLoading) => set(() => ({ initialLoading })),
        setCurrentReferenceDate: (date) =>
            set(() => ({ currentReferenceDate: date })),
        setCurrentView: (view) => set(() => ({ currentView: view })),

        syncWithAppointments: async (refDateStr, view) => {
            set({ initialLoading: true }) // Poner initialLoading aquí de nuevo
            try {
                const dateToUse = refDateStr || get().currentReferenceDate
                const viewToUse = view || get().currentView

                let startDate, endDate
                const refDate = dayjs(dateToUse)

                if (viewToUse === 'month' || viewToUse === 'dayGridMonth') {
                    startDate = refDate.startOf('month').format('YYYY-MM-DD')
                    endDate = refDate.endOf('month').format('YYYY-MM-DD')
                } else if (
                    viewToUse === 'week' ||
                    viewToUse === 'timeGridWeek'
                ) {
                    startDate = refDate.startOf('week').format('YYYY-MM-DD')
                    endDate = refDate.endOf('week').format('YYYY-MM-DD')
                } else if (viewToUse === 'day' || viewToUse === 'timeGridDay') {
                    startDate = refDate.format('YYYY-MM-DD')
                    endDate = refDate.format('YYYY-MM-DD')
                } else {
                    startDate = refDate.startOf('month').format('YYYY-MM-DD')
                    endDate = refDate.endOf('month').format('YYYY-MM-DD')
                }

                await useAppointmentStore
                    .getState()
                    .fetchCalendarAppointments(startDate, endDate)

                const calendarEvents =
                    useAppointmentStore.getState().calendarAppointments

                if (calendarEvents.length > 0 || get().data.length > 0) {
                    set({ data: calendarEvents })
                }
            } catch (error) {
                // Error silencioso, no relanzar
            } finally {
                set({ initialLoading: false }) // Asegurar que initialLoading se ponga a false
            }
        },
        // handleViewOrDateChange eliminada
    }),
)
