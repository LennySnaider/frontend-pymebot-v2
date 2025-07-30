'use client'

import React from 'react'
import dynamic from 'next/dynamic'
// Importamos dinámicamente AppointmentPage
const AppointmentPage = dynamic(
    () => import('./AppointmentPage'),
    { ssr: false }
)

interface AppointmentPageWrapperProps {
    initialEvents: any[]
}

const AppointmentPageWrapper: React.FC<AppointmentPageWrapperProps> = ({ initialEvents }) => {
    return <AppointmentPage initialEvents={initialEvents} />
}

export default AppointmentPageWrapper