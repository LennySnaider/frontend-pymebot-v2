'use client'

import React, { useState } from 'react'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import classNames from 'classnames'

interface CalendarViewProps {
    selectedDate: string | null // Formato YYYY-MM-DD
    availableDates: string[] // Array de fechas disponibles en formato YYYY-MM-DD
    onDateSelect: (dateStr: string) => void
}

const CalendarView: React.FC<CalendarViewProps> = ({
    selectedDate,
    availableDates,
    onDateSelect,
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { locale: es }) // Empezar semana en Lunes
    const endDate = endOfWeek(monthEnd, { locale: es }) // Terminar semana en Domingo

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const prevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1))
    }

    const nextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1))
    }

    const handleDayClick = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        if (availableDates.includes(dateStr)) {
            onDateSelect(dateStr)
        }
    }

    // Convertir selectedDate a objeto Date para comparación
    const selectedDateObj = selectedDate ? parseISO(selectedDate) : null

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow">
            {/* Header: Mes y Navegación */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex space-x-1">
                    <button
                        onClick={prevMonth}
                        className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Mes anterior"
                    >
                        <TbChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Mes siguiente"
                    >
                        <TbChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {/* Ajustar para empezar en Lunes */}
                {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(
                    (day) => (
                        <div key={day}>{day}</div>
                    ),
                )}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isAvailable =
                        isCurrentMonth && availableDates.includes(dateStr)
                    const isSelected =
                        selectedDateObj && isSameDay(day, selectedDateObj)

                    return (
                        <button
                            key={dateStr}
                            onClick={() => handleDayClick(day)}
                            disabled={!isAvailable}
                            className={classNames(
                                'h-8 w-8 rounded-full flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500',
                                {
                                    'text-gray-900 dark:text-white':
                                        isCurrentMonth,
                                    'text-gray-400 dark:text-gray-500':
                                        !isCurrentMonth,
                                    'bg-primary-500 text-white font-semibold':
                                        isSelected,
                                    'hover:bg-primary-100 dark:hover:bg-primary-900':
                                        isAvailable && !isSelected,
                                    'cursor-not-allowed opacity-50':
                                        !isAvailable,
                                    'font-medium': isAvailable, // Marcar días disponibles
                                },
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    )
                })}
            </div>
            {/* Leyenda (Opcional) */}
            {/* <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block w-3 h-3 rounded-full bg-primary-500 mr-1 align-middle"></span> Seleccionado
                <span className="inline-block w-3 h-3 rounded-full border border-gray-400 dark:border-gray-600 ml-3 mr-1 align-middle"></span> Disponible
            </div> */}
        </div>
    )
}

export default CalendarView
