/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/AppointmentViewSwitcher.tsx
 * Componente para cambiar entre vista Calendario y vista Lista para las citas.
 *
 * @version 1.1.0
 * @updated 2025-04-12
 */

'use client'

import { useTranslations } from 'next-intl'
import Switcher from '@/components/ui/Switcher'
import {
    TbCalendar,
    TbList
} from 'react-icons/tb'

interface AppointmentViewSwitcherProps {
    isCalendarView: boolean
    onChange: (checked: boolean) => void
}

const AppointmentViewSwitcher = ({
    isCalendarView,
    onChange,
}: AppointmentViewSwitcherProps) => {
    // Usando namespace "appointments" para traducciones
    const t = useTranslations()

    // Función para crear el contenido del switcher con iconos
    const withIcon = (component: React.ReactNode) => {
        return <div className="text-lg">{component}</div>
    }

    // Intentar obtener las traducciones, caer en valores por defecto si no existen
    let viewCalendarText = 'Vista Calendario'
    let viewListText = 'Vista de Lista'

    try {
        const calendarTranslation = t('appointment.views.calendar')
        if (calendarTranslation) {
            viewCalendarText = calendarTranslation
        }
    } catch {
        // Ignorar error si falla la traducción, usar valor por defecto
    }

    try {
        const listTranslation = t('appointment.views.list')
        if (listTranslation) {
            viewListText = listTranslation
        }
    } catch {
        // Ignorar error si falla la traducción, usar valor por defecto
    }

    return (
        <div className="flex flex-row items-center gap-2 flex-wrap justify-end">
            {/* Switch de vista calendario/lista con texto - solo visible en pantallas más grandes */}
            <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium">
                    {isCalendarView ? viewCalendarText : viewListText}
                </span>
                <Switcher checked={isCalendarView} onChange={onChange} />
            </div>

            {/* Switch de vista calendario/lista con iconos - visible en pantallas pequeñas */}
            <div className="flex sm:hidden items-center">
                <Switcher
                    checked={isCalendarView}
                    onChange={onChange}
                    unCheckedContent={withIcon(<TbList />)}
                    checkedContent={withIcon(<TbCalendar />)}
                />
            </div>
        </div>
    )
}

export default AppointmentViewSwitcher