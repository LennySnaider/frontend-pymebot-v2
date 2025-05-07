/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_components/AppointmentListProvider.tsx
 * Proveedor de contexto para la lista de citas usando Zustand
 * @version 1.2.0
 * @updated 2025-04-20 (Load initial data via store fetch)
 */

'use client'

import { useEffect } from 'react'
import { useAppointmentListStore } from '../_store/appointmentListStore'
import type { Appointment } from '../types' // Asegúrate de que este tipo sea correcto
import type { CommonProps } from '@/@types/common'

// Ya no necesitamos la prop appointmentList aquí
interface AppointmentListProviderProps extends CommonProps {}

const AppointmentListProvider = ({
    children,
}: AppointmentListProviderProps) => {
    const {
        // Ya no usamos setAppointmentList aquí
        setInitialLoading,
        fetchAppointments,
        // Obtener el estado actual para evitar llamadas innecesarias
        initialLoading,
        appointmentList,
    } = useAppointmentListStore()

    // Cargar datos iniciales desde la API al montar
    useEffect(() => {
        // Solo cargar si no hay datos y no se está cargando ya
        if (initialLoading && appointmentList.length === 0) {
            console.log(
                'AppointmentListProvider: Fetching initial appointments from API...',
            )
            fetchAppointments() // Llama a la función del store para cargar datos
                .catch((error) => {
                    console.error(
                        'AppointmentListProvider: Error fetching initial appointments:',
                        error,
                    )
                    // Manejar el error si es necesario (e.g., mostrar notificación)
                })
                .finally(() => {
                    setInitialLoading(false) // Marcar carga inicial como completada
                })
        } else {
            // Si ya hay datos o no es la carga inicial, solo asegurarse de que initialLoading sea false
            if (initialLoading) {
                setInitialLoading(false)
            }
        }
        // Depender solo de fetchAppointments y setInitialLoading (estables)
        // y initialLoading para re-evaluar si es necesario
    }, [
        fetchAppointments,
        setInitialLoading,
        initialLoading,
        appointmentList.length,
    ])

    // Exponer la función fetchAppointments para que pueda ser llamada por otros componentes (opcional, para debug)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            // @ts-ignore
            window.__debug_fetchAppointments = fetchAppointments
        }
        return () => {
            if (process.env.NODE_ENV === 'development') {
                // @ts-ignore
                delete window.__debug_fetchAppointments
            }
        }
    }, [fetchAppointments])

    return <>{children}</>
}

export default AppointmentListProvider
