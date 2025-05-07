/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_components/AppointmentListTableTools.tsx
 * Componente cliente para herramientas de filtrado y búsqueda de citas con soporte i18n.
 * @version 1.0.0
 * @updated 2025-06-30
 */

'use client'

import AppointmentListSearch from './AppointmentListSearch'
import AppointmentListTableFilter from './AppointmentListTableFilter'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'

const AppointmentListTableTools = () => {
    const { onAppendQueryParams } = useAppendQueryParams()

    const handleInputChange = (query: string) => {
        onAppendQueryParams({
            query,
        })
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <AppointmentListSearch onInputChange={handleInputChange} />
            <AppointmentListTableFilter />
        </div>
    )
}

export default AppointmentListTableTools
