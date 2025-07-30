/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/steps/DateTimeSelectionStep.tsx
 * Paso para seleccionar fecha y hora de cita, con validaciones mejoradas.
 * 
 * @version 3.2.0
 * @updated 2025-04-28
 */

import React from 'react'
import Calendar from '@/components/ui/DatePicker/Calendar'
import Spinner from '@/components/ui/Spinner'
import type { TimeSlot } from '../types'
import type { Dispatch, SetStateAction } from 'react'
import { format, isToday, isBefore, isSameDay, startOfDay } from 'date-fns'

interface DateTimeSelectionStepProps {
    selectedDate: string | null
    selectedTimeSlot: string | null
    availability: Record<string, TimeSlot[]>
    isLoadingAvailability: boolean
    handleDateSelection: (dateStr: string) => void
    handleTimeSlotSelection: (time: string) => void
    date: Date | null
    setDate: Dispatch<SetStateAction<Date | null>>
    formErrors: Record<string, string>
}

const DateTimeSelectionStep: React.FC<DateTimeSelectionStepProps> = ({
    selectedDate,
    selectedTimeSlot,
    availability,
    isLoadingAvailability,
    handleDateSelection,
    handleTimeSlotSelection,
    date,
    setDate,
    formErrors,
}) => {
    // Obtener los slots disponibles para la fecha seleccionada
    const availableSlots = selectedDate && availability[selectedDate] 
        ? availability[selectedDate].filter(slot => slot.available)
        : []

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calendario en la parte izquierda */}
                <div className="w-full">
                    <div className="flex justify-center items-center">
                        <div className="w-full max-w-[320px]">
                            <Calendar
                                value={date}
                                onChange={(newDate) => {
                                    if (newDate) {
                                        setDate(newDate)
                                        const dateStr = format(newDate, 'yyyy-MM-dd')
                                        handleDateSelection(dateStr)
                                    }
                                }}
                                // Deshabilitar fechas en el pasado, sin disponibilidad o días de descanso
                                disableDate={(currentDate) => {
                                    if (!currentDate) return true;
                                    
                                    // 1. Verificar si es una fecha pasada (permitimos hoy)
                                    const today = startOfDay(new Date());
                                    if (isBefore(currentDate, today) && !isSameDay(currentDate, today)) {
                                        return true;
                                    }
                                    
                                    const dateStr = format(currentDate, 'yyyy-MM-dd');
                                    
                                    // 2. Verificar si hay información de disponibilidad para esta fecha
                                    if (!availability[dateStr]) {
                                        // Si no tenemos info, asumimos que está disponible (se cargará bajo demanda)
                                        return false;
                                    }
                                    
                                    // 3. Verificar si es un día de descanso o sin disponibilidad
                                    if (
                                        availability[dateStr].length === 0 || 
                                        !availability[dateStr].some(slot => slot.available)
                                    ) {
                                        return true;
                                    }
                                    
                                    return false;
                                }}
                                className="dark:text-gray-100"
                            />
                        </div>
                    </div>
                </div>

                {/* Slots de tiempo en la parte derecha */}
                <div className="w-full relative">
                    {/* Overlay de carga */}
                    {isLoadingAvailability && (
                        <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex justify-center items-center z-20 rounded-md">
                            <Spinner size="lg" />
                        </div>
                    )}

                    <div className={isLoadingAvailability ? 'opacity-50 pointer-events-none' : ''}>
                        <p className="text-red-500 mb-2 font-medium text-sm">
                            Seleccione un horario disponible.
                        </p>
                        
                        {/* Grid de horarios */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                '09:00', '10:00', '11:00', 
                                '12:00', '13:00', '14:00', 
                                '15:00', '16:00', '17:00'
                            ].map((time) => {
                                // Verificar si el horario está disponible
                                const isAvailable = availableSlots.some(slot => slot.time === time);
                                
                                // Si es hoy, también debemos verificar que el horario no haya pasado ya
                                const isTimeInPast = (() => {
                                    if (!selectedDate) return false;
                                    const today = new Date();
                                    const selectedDateObj = new Date(selectedDate);
                                    
                                    if (!isSameDay(today, selectedDateObj)) return false;
                                    
                                    const [hours, minutes] = time.split(':').map(Number);
                                    const slotTime = new Date(selectedDate);
                                    slotTime.setHours(hours, minutes, 0, 0);
                                    
                                    return isBefore(slotTime, today);
                                })();
                                
                                const disabled = !isAvailable || isTimeInPast;
                                
                                return (
                                    <button
                                        key={time}
                                        onClick={() => {
                                            if (!disabled) {
                                                handleTimeSlotSelection(time);
                                            }
                                        }}
                                        disabled={disabled}
                                        className={`py-2 px-1 rounded-md text-center text-sm transition-colors
                                            ${selectedTimeSlot === time 
                                                ? 'bg-green-600 text-white font-medium' 
                                                : !disabled
                                                    ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <p className="text-red-500 mt-2 text-sm text-center">
                            Seleccione un horario disponible.
                        </p>

                        {formErrors.timeSlot && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.timeSlot}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DateTimeSelectionStep