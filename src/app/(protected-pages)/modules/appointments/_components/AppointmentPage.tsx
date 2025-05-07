'use client'

import React from 'react'
import CalendarProvider from '../calendar-view/_components/CalendarProvider'
import AppointmentCalendarView from './AppointmentCalendarView'
import type { CalendarEvents } from '../calendar-view/types'

interface AppointmentPageProps {
    initialEvents: CalendarEvents
}

const AppointmentPage: React.FC<AppointmentPageProps> = ({ initialEvents }) => {
    return (
        <CalendarProvider events={initialEvents}>
            <div className="h-full">
                <AppointmentCalendarView />
            </div>
        </CalendarProvider>
    )
}

export default AppointmentPage