'use client'

import { useAppointmentStore } from '../../_store/appointmentStore'
import { useEffect } from 'react'

export default function DebugAppointments() {
    const store = useAppointmentStore()
    
    useEffect(() => {
        console.log('Debug Appointments Store State:', {
            isAppointmentDialogOpen: store.isAppointmentDialogOpen,
            isDetailsDialogOpen: store.isDetailsDialogOpen,
            selectedAppointment: store.selectedAppointment,
            isEditMode: store.isEditMode
        })
    }, [store])
    
    return (
        <div className="fixed bottom-4 right-4 bg-white border rounded p-4 shadow-lg text-xs">
            <h4 className="font-bold mb-2">Appointment Store Debug</h4>
            <p>Dialog Open: {store.isAppointmentDialogOpen ? 'YES' : 'NO'}</p>
            <p>Details Open: {store.isDetailsDialogOpen ? 'YES' : 'NO'}</p>
            <p>Edit Mode: {store.isEditMode ? 'YES' : 'NO'}</p>
            <p>Selected: {store.selectedAppointment?.id || 'NONE'}</p>
        </div>
    )
}