/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_components/AppointmentListActionTools.tsx
 * Componente cliente para gestionar acciones sobre la lista de citas con soporte i18n.
 * @version 1.1.0
 * @updated 2025-04-12
 */

'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { TbCloudDownload, TbCalendarPlus } from 'react-icons/tb'
import { useAppointmentListStore } from '../_store/appointmentListStore'
import AppointmentFormDialog from '../../_components/AppointmentFormDialog'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

const CSVLink = dynamic(() => import('react-csv').then((mod) => mod.CSVLink), {
    ssr: false,
})

const AppointmentListActionTools = () => {
    // Estado para controlar la apertura del diálogo de creación de citas
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
    
    // Usar hook de internacionalización para componentes cliente
    const t = useTranslations()

    const appointmentList = useAppointmentListStore((state) => state.appointmentList)
    
    // Manejadores para el diálogo de creación de citas
    const handleOpenNewAppointment = () => {
        setIsFormDialogOpen(true)
    }
    
    const handleCloseFormDialog = () => {
        setIsFormDialogOpen(false)
        // Refrescar la lista después de cerrar el formulario (por si hubo cambios)
        useAppointmentListStore.getState().fetchAppointments()
    }

    return (
        <>
            <div className="flex flex-col md:flex-row gap-3">
                <CSVLink
                    className="w-full"
                    filename="appointmentList.csv"
                    data={appointmentList}
                >
                    <Button
                        icon={<TbCloudDownload className="text-xl" />}
                        className="w-full"
                    >
                        {t('common.download')}
                    </Button>
                </CSVLink>
                <Button
                    variant="solid"
                    color="primary"
                    icon={<TbCalendarPlus className="text-xl" />}
                    onClick={handleOpenNewAppointment}
                >
                    {t('appointments.addNew')}
                </Button>
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

export default AppointmentListActionTools
