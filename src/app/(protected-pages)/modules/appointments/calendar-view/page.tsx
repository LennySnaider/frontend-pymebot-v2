/**
 * frontend/src/app/(protected-pages)/modules/appointments/calendar-view/page.tsx
 * Página de vista de calendario para las citas con switcher para cambiar a vista de lista.
 * @version 1.1.0
 * @updated 2025-07-04
 */

import CalendarProvider from './_components/CalendarProvider'
import Calendar from './_components/Calendar'
// Eliminar importación de getCalendar y CalendarEvents
// Eliminar importación de getTranslations
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import AppointmentCalendarHeader from '../_components/AppointmentCalendarHeader'

export default async function Page() {
    // Eliminar llamada a getCalendar()
    // Eliminar llamada a getTranslations()

    return (
        // Eliminar prop 'events'
        <CalendarProvider>
            <Container>
                <AdaptiveCard className="mb-4">
                    <AppointmentCalendarHeader />
                </AdaptiveCard>
                <Calendar />
            </Container>
        </CalendarProvider>
    )
}
