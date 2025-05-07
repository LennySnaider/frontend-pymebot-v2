'use client'
import { useEffect } from 'react'
import { useCalendar } from '../_store/calendarStore'
import type { CommonProps } from '@/@types/common'
// Eliminar importación de CalendarEvents ya que la prop 'events' no se usa

// Eliminar la interfaz vacía CalendarProviderProps

// Usar CommonProps directamente en la firma del componente
const CalendarProvider = ({ children }: CommonProps) => {
    // Eliminar 'setData' ya que no se usa
    const setInitialLoading = useCalendar((state) => state.setInitialLoading)
    const syncWithAppointments = useCalendar(
        (state) => state.syncWithAppointments,
    )

    useEffect(() => {
        // Este efecto debe ejecutarse solo una vez al montar para la sincronización inicial.
        // La lógica de actualizar con la prop 'events' puede ser redundante o necesitar revisión,
        // pero la clave para romper el bucle es no llamar a syncWithAppointments repetidamente.

        console.log(
            'CalendarProvider: Montado. Realizando sincronización inicial.',
        )

        // Llamar a syncWithAppointments solo al montar
        syncWithAppointments()
            .then(() => {
                console.log(
                    'CalendarProvider: Sincronización inicial completada',
                )
            })
            .catch((error) => {
                console.error(
                    'CalendarProvider: Error en sincronización inicial',
                    error,
                )
            })
            .finally(() => {
                // Asegurarse de que el estado de carga se actualice después de la sincronización inicial
                setInitialLoading(false)
            })

        // Ejecutar solo al montar el componente.
        // Las funciones del store son estables según la documentación de Zustand,
        // pero incluirlas aquí sigue las reglas de linting si no se usa el array vacío.
        // Usaremos el array vacío para asegurar que se ejecute solo una vez.
    }, [])

    return <>{children}</>
}

export default CalendarProvider
