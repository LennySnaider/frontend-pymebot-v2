'use client'

import React from 'react'
import CalendarProvider from '../calendar-view/_components/CalendarProvider'
import AppointmentCalendarView from './AppointmentCalendarView'
interface AppointmentPageProps {
    initialEvents: any[]
}

const AppointmentPage: React.FC<AppointmentPageProps> = ({ initialEvents }) => {
    return (
        <CalendarProvider>
            <div className="h-full">
                <AppointmentCalendarView />
            </div>
        </CalendarProvider>
    )
}

export default AppointmentPage