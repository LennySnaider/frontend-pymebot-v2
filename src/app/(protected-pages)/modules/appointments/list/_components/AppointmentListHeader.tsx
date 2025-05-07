/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_components/AppointmentListHeader.tsx
 * Encabezado para la vista de lista de citas con switcher para cambiar entre vistas.
 *
 * @version 1.0.0
 * @updated 2025-07-04
 */

'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import AppointmentViewSwitcher from '../../_components/AppointmentViewSwitcher'
import AppointmentListActionTools from './AppointmentListActionTools'

export default function AppointmentListHeader() {
    const t = useTranslations()
    const router = useRouter()

    const handleViewChange = (isCalendarView: boolean) => {
        if (isCalendarView) {
            router.push('/modules/appointments/calendar-view')
        }
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h3>{t('nav.conceptsCRM.appointments')}</h3>
            <div className="flex items-center gap-2">
                <AppointmentListActionTools />
                <AppointmentViewSwitcher 
                    isCalendarView={false} 
                    onChange={handleViewChange}
                />
            </div>
        </div>
    )
}