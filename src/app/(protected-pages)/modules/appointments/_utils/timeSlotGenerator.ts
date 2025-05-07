import { format, addMinutes } from 'date-fns'

export interface TimeSlotGeneratorOptions {
    startTime: string // Formato: "HH:MM" (24h)
    endTime: string // Formato: "HH:MM" (24h)
    appointmentDuration: number // Duración en minutos
    breakDuration?: number // Duración del descanso entre citas en minutos (opcional)
}

// Función auxiliar para convertir string de tiempo a objeto Date
const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
}

export const generateTimeSlots = (
    options: TimeSlotGeneratorOptions,
): string[] => {
    const {
        startTime,
        endTime,
        appointmentDuration,
        breakDuration = 0,
    } = options

    // Validar duración
    if (appointmentDuration <= 0) {
        console.error('Appointment duration must be positive.')
        return []
    }

    // Convertir strings de tiempo a objetos Date
    const start = parseTime(startTime)
    const end = parseTime(endTime)

    // Validar horas
    if (start >= end) {
        console.error('Start time must be before end time.')
        return []
    }

    const slots: string[] = []
    let current = new Date(start)

    // Generar slots hasta alcanzar la hora de fin
    while (current < end) {
        // Añadir el slot actual
        slots.push(format(current, 'h:mm a')) // Formato 12h con AM/PM

        // Avanzar al siguiente slot (duración de la cita + descanso)
        current = addMinutes(current, appointmentDuration + breakDuration)
    }

    return slots
}
