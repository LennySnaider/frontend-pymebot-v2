/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/page.tsx
 * Página principal de listado de citas con soporte de internacionalización
 * y switcher para cambiar entre vistas de lista y calendario.
 * @version 1.4.3
 * @updated 2025-04-20 (Explicitly typed page props)
 */

import { getTranslations } from 'next-intl/server'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import AppointmentListProvider from './_components/AppointmentListProvider'
import AppointmentListTable from './_components/AppointmentListTable'
// import AppointmentListActionTools from './_components/AppointmentListActionTools' // No se usa aquí directamente
import AppointmentListTableTools from './_components/AppointmentListTableTools'
import AppointmentListSelected from './_components/AppointmentListSelected'
import AppointmentListHeader from './_components/AppointmentListHeader'
import getAppointments from '@/server/actions/appointments/getAppointments'
import type { AppointmentData } from '@/server/actions/appointments/getAppointments' // Importar tipo
// Eliminar importación de PageProps
// import type { PageProps } from '@/@types/common'

export default async function Page({
    searchParams,
}: {
    params?: any;
    searchParams?: any;
}) {
    // Usar getTranslations en lugar de useTranslations para componentes asíncronos
    const t = await getTranslations()

    // searchParams ya es un objeto sincrónico en esta configuración
    // Ahora podemos acceder a las propiedades de forma segura
    const agentId = searchParams?.agentId as string | undefined
    const status = searchParams?.status as string | undefined
    const propertyType = searchParams?.propertyType as string | undefined
    const fromDate = searchParams?.fromDate as string | undefined
    const toDate = searchParams?.toDate as string | undefined
    const pageIndexParam = searchParams?.pageIndex as string | undefined
    const pageSizeParam = searchParams?.pageSize as string | undefined

    // Mapear parámetros de búsqueda a filtros de la API, asegurándose de que sean strings o undefined
    const apiFilters: Record<string, string | undefined> = {
        agent_id: agentId,
        status: status,
        property_type: propertyType,
        fromDate: fromDate,
        toDate: toDate,
    }

    // Filtrar undefined para evitar problemas
    Object.keys(apiFilters).forEach((key) => {
        if (apiFilters[key] === undefined) {
            delete apiFilters[key]
        }
    })

    // Obtener datos de citas con manejo de errores y tipo explícito
    let appointmentData: AppointmentData[] = []
    try {
        console.log('Obteniendo datos de citas con filtros:', apiFilters)

        // Usar getAppointments con filtros normalizados
        appointmentData = await getAppointments(apiFilters)
        console.log(`Se obtuvieron ${appointmentData.length} citas`)
    } catch (error) {
        console.error('Error al obtener citas en la página:', error)
        // En caso de error, usar un array vacío y seguir adelante
        appointmentData = []
    }

    // Calcular paginación
    const pageIndex = parseInt(pageIndexParam || '1') || 1
    const pageSize = parseInt(pageSizeParam || '10') || 10
    const total = appointmentData.length
    // const start = (pageIndex - 1) * pageSize // Ya no se usa start
    // const end = start + pageSize // Ya no se usa end

    // Ya no necesitamos paginar aquí, se hace en el cliente o se pide a la API

    return (
        // Ya no pasamos datos iniciales al Provider, se cargan desde el store
        <AppointmentListProvider>
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col gap-4">
                        <AppointmentListHeader />
                        <AppointmentListTableTools />
                        {total === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-gray-500">
                                    {t('common.noData')}
                                </p>
                            </div>
                        ) : (
                            <AppointmentListTable
                                appointmentListTotal={total}
                                pageIndex={pageIndex}
                                pageSize={pageSize}
                            />
                        )}
                    </div>
                </AdaptiveCard>
            </Container>
            <AppointmentListSelected />
        </AppointmentListProvider>
    )
}
