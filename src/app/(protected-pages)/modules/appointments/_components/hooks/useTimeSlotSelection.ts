import { useState, useCallback } from 'react'
import type { TimeSlot } from '../types' // Ajustar ruta si es necesario

// TODO: Implementar lógica completa del hook
export const useTimeSlotSelection = (initialDate: Date | null = null) => {
    const [date, setDate] = useState<Date | null>(initialDate)
    const [selectedDate, setSelectedDate] = useState<string>('') // Formato YYYY-MM-DD
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
    const [availability, setAvailability] = useState<
        Record<string, TimeSlot[]>
    >({})
    const [isLoadingAvailability, setIsLoadingAvailability] =
        useState<boolean>(false)

    // TODO: Implementar carga de disponibilidad (getAgentAvailability)
    const loadAvailability = useCallback(
        async (/* params */) => {
            setIsLoadingAvailability(true)
            // Simular carga
            await new Promise((resolve) => setTimeout(resolve, 500))
            setAvailability({}) // Placeholder
            setIsLoadingAvailability(false)
        },
        [],
    )

    const handleDateSelection = (dateStr: string) => {
        setSelectedDate(dateStr)
        setSelectedTimeSlot('') // Reset time slot when date changes
    }

    const handleTimeSlotSelection = (time: string) => {
        setSelectedTimeSlot(time)
    }

    return {
        date,
        setDate,
        selectedDate,
        selectedTimeSlot,
        availability,
        isLoadingAvailability,
        loadAvailability,
        handleDateSelection,
        handleTimeSlotSelection,
    }
}
