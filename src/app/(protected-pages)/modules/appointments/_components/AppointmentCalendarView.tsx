/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/AppointmentCalendarView.tsx
 * Componente de vista de calendario para citas.
 *
 * @version 2.0.0
 * @updated 2025-06-25
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import Calendar from '@/components/shared/CalendarView'
import { useAppointmentStore } from '../_store/appointmentStore'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import AppointmentFormDialog from './AppointmentFormDialog'
import AppointmentDetails from './AppointmentDetails'
import Spinner from '@/components/ui/Spinner'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const AppointmentCalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    
    const { 
        calendarAppointments, 
        isLoading, 
        error, 
        fetchCalendarAppointments,
        selectedAppointment,
        isDetailsDialogOpen,
        openDetailsDialog,
        closeDetailsDialog,
        selectAppointment
    } = useAppointmentStore()
    
    // Función para cargar las citas del mes actual
    const loadAppointmentsForCurrentMonth = useCallback(async () => {
        try {
            const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
            const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')
            
            await fetchCalendarAppointments(startDate, endDate)
        } catch (error) {
            console.error('Error al cargar citas del mes:', error)
            toast.push(
                <Notification type="danger">
                    Error al cargar las citas del mes
                </Notification>,
                { placement: 'top-center' }
            )
        }
    }, [currentDate, fetchCalendarAppointments])
    
    // Cargar citas cuando cambia el mes
    useEffect(() => {
        loadAppointmentsForCurrentMonth()
    }, [loadAppointmentsForCurrentMonth])
    
    // Manejar cambio de mes
    const handleChangeMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => 
            direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
        )
    }
    
    // Manejar clic en evento
    const handleEventClick = (info: any) => {
        const appointmentId = info.event.id
        openDetailsDialog(appointmentId)
    }
    
    // Manejar clic en día del calendario
    const handleDateClick = (info: any) => {
        // Al hacer clic en una fecha, abrir diálogo de creación
        setIsEditMode(false)
        setIsFormDialogOpen(true)
        
        // Pre-seleccionar la fecha
        const clickedDate = new Date(info.date)
        // En un caso real, pasaríamos esta fecha al formulario
    }
    
    // Renderizar color del evento según estado
    const handleEventClassNames = (info: any) => {
        const status = info.event.extendedProps.status || 'scheduled'
        
        const baseClasses = 'border-0 rounded'
        
        switch (status) {
            case 'scheduled':
                return `${baseClasses} bg-blue-500 hover:bg-blue-600`
            case 'confirmed':
                return `${baseClasses} bg-green-500 hover:bg-green-600`
            case 'completed':
                return `${baseClasses} bg-purple-500 hover:bg-purple-600`
            case 'cancelled':
                return `${baseClasses} bg-red-500 hover:bg-red-600`
            case 'rescheduled':
                return `${baseClasses} bg-orange-500 hover:bg-orange-600`
            default:
                return `${baseClasses} bg-gray-500 hover:bg-gray-600`
        }
    }
    
    // Editar cita seleccionada
    const handleEditAppointment = () => {
        setIsEditMode(true)
        setIsFormDialogOpen(true)
        closeDetailsDialog()
    }
    
    return (
        <div className="h-full flex flex-col">
            {isLoading && (
                <div className="flex justify-center p-4">
                    <Spinner />
                </div>
            )}
            
            {error && (
                <div className="p-4 text-red-500 text-center">
                    {error}
                </div>
            )}
            
            <div className="flex-grow">
                <Calendar 
                    events={calendarAppointments}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    eventClassNames={handleEventClassNames}
                    initialDate={currentDate}
                    editable={false}
                    selectable={true}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                />
            </div>
            
            {/* Diálogo de creación/edición de cita */}
            <AppointmentFormDialog 
                isOpen={isFormDialogOpen}
                onClose={() => setIsFormDialogOpen(false)}
                appointmentId={isEditMode ? selectedAppointment?.id || undefined : undefined}
                isEditMode={isEditMode}
            />
            
            {/* Diálogo de detalles de cita */}
            <AppointmentDetails 
                isOpen={isDetailsDialogOpen}
                onClose={closeDetailsDialog}
                onEdit={handleEditAppointment}
            />
        </div>
    )
}

export default AppointmentCalendarView
