/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/AppointmentCalendarHeader.tsx
 * Encabezado para la vista de calendario de citas con switcher para cambiar entre vistas y botón para crear nueva cita.
 *
 * @version 1.1.0
 * @updated 2025-04-12
 */

'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { TbPlus } from 'react-icons/tb'
import Button from '@/components/ui/Button'
import AppointmentViewSwitcher from './AppointmentViewSwitcher'
import AppointmentFormDialog from './AppointmentFormDialog'

export default function AppointmentCalendarHeader() {
    const t = useTranslations()
    const router = useRouter()
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)

    const handleViewChange = (isCalendarView: boolean) => {
        if (!isCalendarView) {
            router.push('/modules/appointments/list')
        }
    }

    const handleOpenNewAppointment = () => {
        setIsFormDialogOpen(true)
    }

    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false)
    }

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3>{t('nav.conceptsCRM.appointments')}</h3>
                <div className="flex gap-2">
                    <Button 
                        variant="solid" 
                        color="primary" 
                        size="sm" 
                        icon={<TbPlus />}
                        onClick={handleOpenNewAppointment}
                    >
                        Nueva Cita
                    </Button>
                    <AppointmentViewSwitcher 
                        isCalendarView={true} 
                        onChange={handleViewChange}
                    />
                </div>
            </div>

            {/* Diálogo para crear nueva cita */}
            <AppointmentFormDialog 
                isOpen={isFormDialogOpen}
                onClose={handleCloseFormDialog}
                isEditMode={false}
            />
        </>
    )
}