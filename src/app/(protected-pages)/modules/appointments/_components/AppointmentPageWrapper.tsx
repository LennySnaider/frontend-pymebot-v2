'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { CalendarEvents } from '../calendar-view/types'

// Importamos dinámicamente AppointmentPage
const AppointmentPage = dynamic(
    () => import('./AppointmentPage'),
    { ssr: false }
)

interface AppointmentPageWrapperProps {
    initialEvents: CalendarEvents
}

const AppointmentPageWrapper: React.FC<AppointmentPageWrapperProps> = ({ initialEvents }) => {
    return <AppointmentPage initialEvents={initialEvents} />
}

export default AppointmentPageWrapper