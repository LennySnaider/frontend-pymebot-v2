/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/ui/TimeSlotGrid.tsx
 * Componente para mostrar y seleccionar slots de tiempo disponibles para citas.
 * 
 * @version 2.1.0
 * @updated 2025-04-28
 */

import React from 'react'
import classNames from 'classnames'
import type { TimeSlot } from '../types'
import { TbClockOff } from 'react-icons/tb'

interface TimeSlotGridProps {
    timeSlots: TimeSlot[]
    selectedTimeSlot: string | null
    onTimeSlotSelect: (time: string) => void
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
    timeSlots,
    selectedTimeSlot,
    onTimeSlotSelect,
}) => {
    const availableSlots = timeSlots.filter((slot) => slot.available)

    return (
        <div className="w-full">
            {availableSlots.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <TbClockOff className="mx-auto h-8 w-8 mb-2 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-500 dark:text-gray-400">No hay horarios disponibles para esta fecha.</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Por favor, seleccione otra fecha.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                        <button
                            key={slot.time}
                            onClick={() => onTimeSlotSelect(slot.time)}
                            className={classNames(
                                'py-2 px-1 rounded-md text-center text-sm',
                                'transition-colors duration-150 ease-in-out',
                                {
                                    'bg-green-600 text-white font-medium': 
                                        selectedTimeSlot === slot.time,
                                    'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600': 
                                        selectedTimeSlot !== slot.time,
                                },
                            )}
                        >
                            {slot.time}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default TimeSlotGrid