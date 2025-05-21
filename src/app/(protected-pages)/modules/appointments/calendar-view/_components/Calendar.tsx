/**
 * frontend/src/app/(protected-pages)/modules/appointments/calendar-view/_components/Calendar.tsx
 * Componente de calendario para visualizar y gestionar citas.
 *
 * @version 3.0.1
 * @updated 2025-04-20 (Removed debug logs)
 */

'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import CalendarView from '@/components/shared/CalendarView'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import AppointmentFormDialog from '../../_components/AppointmentFormDialog'
import AppointmentDetails from '../../_components/AppointmentDetails'
import AgentColorLegend from './AgentColorLegend'
import { useAppointmentStore } from '../../_store/appointmentStore'
import Spinner from '@/components/ui/Spinner'
import dayjs from 'dayjs'
import { toast } from '@/components/ui/toast'
import { Notification } from '@/components/ui'
import DebugAppointments from './debug-appointments'
import type { CalendarEvent } from '@/app/(protected-pages)/modules/calendar/types'
import FullCalendar from '@fullcalendar/react'
import type {
    EventDropArg,
    EventClickArg,
    DateSelectArg,
    EventContentArg,
} from '@fullcalendar/core/index.js'

const Calendar = () => {
    // Estados para diálogos - ensure form dialog starts closed
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<
        string | null
    >(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    
    // Debug logging
    useEffect(() => {
        console.log('Calendar: Dialog states:', {
            isFormDialogOpen,
            isDetailsDialogOpen,
            selectedAppointmentId,
            isEditMode
        })
    }, [isFormDialogOpen, isDetailsDialogOpen, selectedAppointmentId, isEditMode])

    // Estado local para eventos del calendario
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Referencia al calendario
    const calendarRef = useRef<FullCalendar>(null)

    // Función para cargar eventos (simplificada)
    const loadEvents = useCallback(async () => {
        setIsLoading(true)
        try {
            // Obtener fecha actual y calcular rango de un mes
            const today = dayjs()
            const startDate = today.startOf('month').format('YYYY-MM-DD')
            const endDate = today.endOf('month').format('YYYY-MM-DD')

            // Llamar directamente a la API sin actualizar el estado global
            const appointments = await useAppointmentStore
                .getState()
                .fetchCalendarAppointments(startDate, endDate)

            // Actualizar estado local
            setEvents(appointments)
        } catch (error) {
            // Error silencioso con notificación al usuario
            toast.push(
                <Notification type="danger">
                    Error al cargar las citas
                </Notification>,
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Cargar eventos al montar el componente
    useEffect(() => {
        loadEvents()
    }, [loadEvents])

    // Manejador para selección de celda (crear cita)
    const handleCellSelect = (event: DateSelectArg) => {
        const { start } = event
        const formattedDate = dayjs(start).format('YYYY-MM-DD')
        setSelectedDate(formattedDate)
        setIsEditMode(false)
        setSelectedAppointmentId(null)
        setIsFormDialogOpen(true)
    }

    // Manejador para clic en evento (ver detalles de cita)
    const handleEventClick = (arg: EventClickArg) => {
        const { extendedProps } = arg.event
        if (extendedProps.appointmentId) {
            setSelectedAppointmentId(extendedProps.appointmentId)
            // Asegurarse de que el formulario esté cerrado antes de abrir detalles
            setIsFormDialogOpen(false)
            setIsEditMode(false)
            // Abrir diálogo de detalles en lugar del formulario
            setIsDetailsDialogOpen(true)
        } else {
            toast.push(
                <Notification type="info">
                    Este evento no está asociado a una cita
                </Notification>,
            )
        }
    }

    // Manejador para arrastrar y soltar eventos
    const handleEventChange = async (arg: EventDropArg) => {
        const { start, extendedProps } = arg.event
        if (extendedProps.appointmentId) {
            try {
                const newDate = dayjs(start).format('YYYY-MM-DD')
                await useAppointmentStore
                    .getState()
                    .updateAppointment(extendedProps.appointmentId, {
                        appointment_date: newDate,
                    })
                toast.push(
                    <Notification type="success">
                        Cita reprogramada correctamente
                    </Notification>,
                )
                // Recargar eventos después de actualizar
                loadEvents()
            } catch (error) {
                // Error silencioso con notificación al usuario
                toast.push(
                    <Notification type="danger">
                        Error al reprogramar la cita
                    </Notification>,
                )
                arg.revert()
            }
        }
    }

    // Función para cerrar el formulario de cita
    const handleCloseFormDialog = useCallback(async () => {
        setIsFormDialogOpen(false)
        setSelectedAppointmentId(null)
        setSelectedDate(null)
        // Recargar eventos después de cerrar el diálogo
        loadEvents()
    }, [loadEvents])

    // Función para cerrar el diálogo de detalles
    const handleCloseDetailsDialog = useCallback(() => {
        setIsDetailsDialogOpen(false)
        setSelectedAppointmentId(null)
    }, [])

    // Función para editar desde el diálogo de detalles
    const handleEditFromDetails = useCallback(() => {
        // Primero cerrar el diálogo de detalles
        setIsDetailsDialogOpen(false)
        // Esperar un momento antes de abrir el diálogo de formulario
        setTimeout(() => {
            setIsEditMode(true)
            setIsFormDialogOpen(true)
        }, 100)
    }, [])

    return (
        <AdaptiveCard className="p-4">
            <DebugAppointments />
            {/* Leyenda de colores por agente */}
            <div className="mb-4 flex justify-end">
                <div className="w-48">
                    <AgentColorLegend />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-4">
                    <Spinner size={40} />
                </div>
            ) : (
                <CalendarView
                    ref={calendarRef}
                    editable
                    selectable
                    events={events}
                    eventClick={handleEventClick}
                    select={handleCellSelect}
                    eventDrop={handleEventChange}
                    headerToolbar={{
                        start: 'prev,next today',
                        center: 'title',
                        end: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    buttonText={{
                        today: 'Hoy',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día',
                    }}
                    views={{
                        dayGridMonth: { buttonText: 'Mes' },
                        timeGridWeek: { buttonText: 'Semana' },
                        timeGridDay: { buttonText: 'Día' },
                    }}
                    eventClassNames="w-full rounded-md overflow-hidden"
                    eventContent={(eventInfo: EventContentArg) => {
                        const { extendedProps } = eventInfo.event
                        const bgColor =
                            eventInfo.event.backgroundColor || '#bce9fb'
                        const timeText = eventInfo.timeText || ''
                        const agentAvatar = extendedProps?.agentAvatar || ''
                        const statusColor = extendedProps?.statusColor || 'blue'
                        const statusLabel =
                            extendedProps?.subtitle || 'Sin definir'

                        return {
                            html: `<div class="fc-event-main-frame" style="background-color: ${bgColor}; color: #333; padding: 4px 6px; border-radius: 5px; width: 100%; box-sizing: border-box; font-size: 0.85em;">
                                <div style="display: flex; align-items: center;">
                                    ${agentAvatar ? '<div style="margin-right: 6px;"><img src="' + agentAvatar + '" alt="Agent" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" /></div>' : ''}
                                    <div style="flex: 1;">
                                        ${timeText ? '<div style="font-weight: 500; font-size: 0.9em;">' + timeText + '</div>' : ''}
                                        <div class="fc-event-title fc-sticky" style="font-weight: 500; line-height: 1.3;">${eventInfo.event.title}</div>
                                        <div style="margin-top: 4px;">
                                            <span style="background-color: ${statusColor}; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 0.75em; font-weight: 500; display: inline-block;">${statusLabel}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>`,
                        }
                    }}
                />
            )}
            {/* Diálogo del formulario de cita */}
            <AppointmentFormDialog
                isOpen={isFormDialogOpen}
                onClose={handleCloseFormDialog}
                isEditMode={isEditMode}
                appointmentId={
                    isEditMode && selectedAppointmentId
                        ? selectedAppointmentId
                        : undefined
                }
                initialDate={selectedDate}
            />
            {/* Diálogo de detalles de cita */}
            <AppointmentDetails
                isOpen={isDetailsDialogOpen}
                onClose={handleCloseDetailsDialog}
                onEdit={handleEditFromDetails}
            />
        </AdaptiveCard>
    )
}

export default Calendar
