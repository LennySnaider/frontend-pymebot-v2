/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_components/AppointmentListSelected.tsx
 * Componente cliente para gestionar citas seleccionadas con soporte i18n.
 * @version 1.1.1
 * @updated 2025-04-20 (Corrected TS errors for ConfirmDialog and Avatar)
 */

'use client'

import { useState } from 'react'
import StickyFooter from '@/components/shared/StickyFooter'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import RichTextEditor from '@/components/shared/RichTextEditor'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useAppointmentListStore } from '../_store/appointmentListStore'
import { useAppointmentStore } from '../../_store/appointmentStore' // Importar el store principal
import { TbChecks } from 'react-icons/tb'
import { useTranslations } from 'next-intl'

const AppointmentListSelected = () => {
    // Usar hook de internacionalización
    const t = useTranslations()

    // Estado y acciones del store de la lista
    const selectedAppointments = useAppointmentListStore(
        (state) => state.selectedAppointments,
    )
    const setSelectAllAppointments = useAppointmentListStore(
        (state) => state.setSelectAllAppointments,
    )

    // Acción de eliminación del store principal
    const deleteAppointmentAction = useAppointmentStore(
        (state) => state.deleteAppointment,
    )

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false) // Estado para el spinner de borrado
    const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false)
    const [sendMessageLoading, setSendMessageLoading] = useState(false)

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleCancel = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleConfirmDelete = async () => {
        setIsDeleting(true) // Mostrar spinner
        const appointmentIdsToDelete = selectedAppointments
            .map((app) => app.id)
            .filter((id): id is string => !!id)

        if (appointmentIdsToDelete.length === 0) {
            toast.push(
                <Notification type="warning">
                    No hay citas válidas seleccionadas para eliminar.
                </Notification>,
                { placement: 'top-center' },
            )
            setIsDeleting(false)
            setDeleteConfirmationOpen(false)
            return
        }

        let successCount = 0
        let errorCount = 0

        // Eliminar cada cita seleccionada llamando a la acción del store principal
        for (const appointmentId of appointmentIdsToDelete) {
            try {
                await deleteAppointmentAction(appointmentId)
                successCount++
            } catch (error) {
                console.error(`Error al eliminar cita ${appointmentId}:`, error)
                errorCount++
            }
        }

        setIsDeleting(false) // Ocultar spinner
        setDeleteConfirmationOpen(false) // Cerrar diálogo de confirmación
        setSelectAllAppointments([]) // Limpiar selección

        // Mostrar notificación resumen
        if (successCount > 0) {
            toast.push(
                <Notification type="success">
                    {successCount}{' '}
                    {successCount === 1 ? 'cita eliminada' : 'citas eliminadas'}{' '}
                    correctamente.
                </Notification>,
                { placement: 'top-center' },
            )
        }
        if (errorCount > 0) {
            toast.push(
                <Notification type="danger">
                    Error al eliminar {errorCount}{' '}
                    {errorCount === 1 ? 'cita' : 'citas'}.
                </Notification>,
                { placement: 'top-center' },
            )
        }

        // No necesitamos actualizar la lista localmente,
        // deleteAppointmentAction ya llama a fetchAppointments y refreshCalendarData
    }

    const handleSend = () => {
        setSendMessageLoading(true)
        setTimeout(() => {
            toast.push(
                <Notification type="success">
                    {t('appointments.messageSent')}
                </Notification>,
                { placement: 'top-center' },
            )
            setSendMessageLoading(false)
            setSendMessageDialogOpen(false)
            setSelectAllAppointments([])
        }, 500)
    }

    return (
        <>
            {selectedAppointments.length > 0 && (
                <StickyFooter
                    className=" flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                    stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
                    defaultClass="container mx-auto px-8 rounded-xl border border-gray-200 dark:border-gray-600 mt-4"
                >
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between">
                            <span>
                                {selectedAppointments.length > 0 && (
                                    <span className="flex items-center gap-2">
                                        <span className="text-lg text-primary">
                                            <TbChecks />
                                        </span>
                                        <span className="font-semibold flex items-center gap-1">
                                            <span className="heading-text">
                                                {selectedAppointments.length}{' '}
                                                {t('appointments.appointments')}
                                            </span>
                                            <span>
                                                {t('appointments.selected')}
                                            </span>
                                        </span>
                                    </span>
                                )}
                            </span>

                            <div className="flex items-center">
                                <Button
                                    size="sm"
                                    className="ltr:mr-3 rtl:ml-3"
                                    type="button"
                                    customColorClass={() =>
                                        'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error'
                                    }
                                    onClick={handleDelete}
                                    disabled={isDeleting} // Deshabilitar mientras se borra
                                >
                                    {t('common.delete')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    onClick={() =>
                                        setSendMessageDialogOpen(true)
                                    }
                                >
                                    {t('appointments.message')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </StickyFooter>
            )}
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={t('appointments.removeAppointments')}
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
                confirmButtonProps={{ loading: isDeleting }} // Corregido: Pasar loading al botón
            >
                <p>{t('appointments.removeConfirmation')}</p>
            </ConfirmDialog>
            <Dialog
                isOpen={sendMessageDialogOpen}
                onRequestClose={() => setSendMessageDialogOpen(false)}
                onClose={() => setSendMessageDialogOpen(false)}
            >
                <h5 className="mb-2">{t('appointments.sendMessage')}</h5>
                <p>{t('appointments.sendMessageDescription')}</p>
                <Avatar.Group
                    chained
                    omittedAvatarTooltip
                    className="mt-4"
                    maxCount={4}
                    omittedAvatarProps={{ size: 30 }}
                >
                    {selectedAppointments.map((appointment) => (
                        <Tooltip
                            key={appointment.id}
                            title={appointment.lead?.full_name || 'Cliente'}
                        >
                            {/* Corregido: Usar encadenamiento opcional y valor predeterminado */}
                            <Avatar
                                size={30}
                                src={appointment.lead?.profile_image ?? ''}
                                alt={appointment.lead?.full_name || 'Avatar'}
                            />
                        </Tooltip>
                    ))}
                </Avatar.Group>
                <div className="my-4">
                    <RichTextEditor content={''} />
                </div>
                <div className="ltr:justify-end flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => setSendMessageDialogOpen(false)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        loading={sendMessageLoading}
                        onClick={handleSend}
                    >
                        {t('common.send')}
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default AppointmentListSelected
