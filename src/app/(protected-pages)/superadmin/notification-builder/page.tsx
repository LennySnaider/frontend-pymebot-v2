/**
 * frontend/src/app/(protected-pages)/superadmin/notification-builder/page.tsx
 * Página para el constructor de notificaciones (SUPERADMIN)
 * @version 1.1.0
 * @updated 2025-04-30
 */

'use client'

import React, { useState, useEffect, useMemo, ReactNode } from 'react'
import { useTranslation } from '@/utils/hooks/useTranslation'
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import DataTable from '@/components/shared/DataTable'
import { Button, Drawer, Badge, toast, Notification } from '@/components/ui'
import { useSystemNotificationsStore, NotificationChannel } from '@/app/(protected-pages)/superadmin/notification-builder/_store/systemNotificationsStore'
import NotificationFormModal from '@/app/(protected-pages)/superadmin/notification-builder/_components/NotificationFormModal'
import type { ColumnDef } from '@tanstack/react-table'
import {
    PiPlusBold,
    PiQuestionBold,
    PiBellDuotone,
    PiGearDuotone,
    PiLightbulbDuotone,
    PiBellSlashDuotone,
    PiPencilSimpleBold,
    PiTrashSimpleBold,
    PiToggleLeft,
    PiToggleRight,
} from 'react-icons/pi'

// Interfaz para la plantilla de notificación
interface NotificationTemplate {
    id: string
    name: string
    description: string
    subject?: string
    body: string
    channel: NotificationChannel
    is_active: boolean
    variables?: string[]
    conditions?: Record<string, unknown>
    is_system: boolean
    created_at: string
    updated_at: string
}

const NotificationBuilderPage = () => {
    const t = useTranslation()
    const [infoDrawerOpen, setInfoDrawerOpen] = useState(false)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<
        NotificationTemplate | undefined
    >(undefined)

    // Use individual selectors instead of an object to avoid infinite loop
    const templates = useSystemNotificationsStore((state) => state.templates)
    const loading = useSystemNotificationsStore((state) => state.loading)
    const error = useSystemNotificationsStore((state) => state.error)
    const fetchTemplates = useSystemNotificationsStore(
        (state) => state.fetchTemplates,
    )
    const deleteTemplate = useSystemNotificationsStore(
        (state) => state.deleteTemplate,
    )
    const toggleTemplateStatus = useSystemNotificationsStore(
        (state) => state.toggleTemplateStatus,
    )

    // Load templates when the component mounts
    useEffect(() => {
        fetchTemplates()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const showInfoToast = (message: ReactNode) => {
        toast.push(
            <Notification
                title={t('notificationBuilder.toast.infoTitle') || 'Información'}
                type="info"
            >
                {message}
            </Notification>,
        )
    }

    const handleCreateTemplate = () => {
        setSelectedTemplate(undefined)
        setIsFormModalOpen(true)
    }

    const handleEdit = (templateId: string) => {
        const template = templates.find((t) => t.id === templateId)
        if (template) {
            setSelectedTemplate(template)
            setIsFormModalOpen(true)
        } else {
            showInfoToast(t('notificationBuilder.toast.templateNotFound') || 'Plantilla no encontrada')
        }
    }

    const handleDelete = async (templateId: string) => {
        // TODO: Usar un componente Modal de confirmación en lugar de window.confirm
        if (!window.confirm(t('notificationBuilder.confirmDelete.message') || '¿Está seguro de que desea eliminar esta plantilla?')) {
            return
        }

        try {
            await deleteTemplate(templateId)
            toast.push(
                <Notification
                    title={t('notificationBuilder.toast.success') || 'Éxito'}
                    type="success"
                >
                    {t('notificationBuilder.toast.templateDeleted') || 'Plantilla eliminada correctamente'}
                </Notification>,
            )
        } catch (error) {
            console.error('Error al eliminar la plantilla:', error)
            toast.push(
                <Notification
                    title={t('notificationBuilder.toast.error') || 'Error'}
                    type="danger"
                >
                    {t('notificationBuilder.toast.errorDeletingTemplate') || 'Error al eliminar la plantilla'}
                </Notification>,
            )
        }
    }

    const handleToggleStatus = async (templateId: string, currentStatus: boolean) => {
        try {
            await toggleTemplateStatus(templateId, !currentStatus)
            toast.push(
                <Notification
                    title={t('notificationBuilder.toast.success') || 'Éxito'}
                    type="success"
                >
                    {currentStatus 
                        ? (t('notificationBuilder.toast.templateDeactivated') || 'Plantilla desactivada correctamente')
                        : (t('notificationBuilder.toast.templateActivated') || 'Plantilla activada correctamente')
                    }
                </Notification>,
            )
        } catch (error) {
            console.error('Error al cambiar estado de la plantilla:', error)
            toast.push(
                <Notification
                    title={t('notificationBuilder.toast.error') || 'Error'}
                    type="danger"
                >
                    {t('notificationBuilder.toast.errorChangingStatus') || 'Error al cambiar el estado de la plantilla'}
                </Notification>,
            )
        }
    }

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false)
        setSelectedTemplate(undefined)
    }

    // Define columns for DataTable using TanStack Table's ColumnDef
    const columns = useMemo<ColumnDef<NotificationTemplate>[]>(
        () => [
            {
                header: t('notificationBuilder.table.header.name') || 'Nombre',
                accessorKey: 'name',
            },
            {
                header: t('notificationBuilder.table.header.description') || 'Descripción',
                accessorKey: 'description',
                cell: ({ row }) => {
                    const value = row.original.description || '-'
                    return (
                        <span title={value}>
                            {value.length > 50
                                ? value.substring(0, 47) + '...'
                                : value}
                        </span>
                    )
                },
            },
            {
                header: t('notificationBuilder.table.header.channel') || 'Canal',
                accessorKey: 'channel',
                cell: ({ row }) => {
                    const channel = row.original.channel
                    let color = 'blue';
                    switch (channel) {
                        case 'email': color = 'blue'; break;
                        case 'sms': color = 'green'; break;
                        case 'push': color = 'orange'; break;
                        case 'internal': color = 'purple'; break;
                        case 'webhook': color = 'red'; break;
                    }
                    return <Badge color={color}>{channel}</Badge>
                },
            },
            {
                header: t('notificationBuilder.table.header.active') || 'Activa',
                accessorKey: 'is_active',
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <Button
                            shape="circle"
                            variant="plain"
                            size="sm"
                            color={row.original.is_active ? 'green' : 'red'}
                            icon={row.original.is_active ? <PiToggleRight className="text-lg" /> : <PiToggleLeft className="text-lg" />}
                            onClick={() => handleToggleStatus(row.original.id, row.original.is_active)}
                            title={row.original.is_active ? 'Desactivar' : 'Activar'}
                            disabled={row.original.is_system} // No permitir cambiar el estado de plantillas del sistema
                        />
                    </div>
                ),
            },
            {
                header: t('notificationBuilder.table.header.system') || 'Sistema',
                accessorKey: 'is_system',
                cell: ({ row }) =>
                    row.original.is_system ? (
                        <Badge color="purple">{t('notificationBuilder.boolean.yes') || 'Sí'}</Badge>
                    ) : (
                        <Badge>{t('notificationBuilder.boolean.no') || 'No'}</Badge>
                    ),
            },
            {
                header: t('notificationBuilder.table.header.actions') || 'Acciones',
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex justify-end items-center gap-1">
                        <Button
                            shape="circle"
                            variant="plain"
                            size="sm"
                            icon={<PiPencilSimpleBold />}
                            onClick={() => handleEdit(row.original.id)}
                            title={t('notificationBuilder.actions.edit') || 'Editar'}
                        />
                        <Button
                            shape="circle"
                            variant="plain"
                            size="sm"
                            color="red"
                            icon={<PiTrashSimpleBold />}
                            onClick={() => handleDelete(row.original.id)}
                            title={t('notificationBuilder.actions.delete') || 'Eliminar'}
                            disabled={row.original.is_system} // No permitir eliminar plantillas del sistema
                        />
                    </div>
                ),
            },
        ],
        [t],
    )

    return (
        <>
            <HeaderBreadcrumbs
                heading={t('superadmin.notificationBuilder') || 'Constructor de Notificaciones'}
                links={[
                    { name: t('nav.dashboard.dashboard') || 'Dashboard', href: '/home' },
                    { name: t('nav.superadmin.tools') || 'Herramientas de Superadmin' },
                    { name: t('superadmin.notificationBuilder') || 'Constructor de Notificaciones' },
                ]}
                action={
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<PiPlusBold className="text-lg" />}
                            onClick={handleCreateTemplate}
                        >
                            Nueva Notificación
                        </Button>
                        <Button
                            shape="circle"
                            variant="plain"
                            size="sm"
                            icon={<PiQuestionBold className="text-lg" />}
                            onClick={() => setInfoDrawerOpen(true)}
                        />
                    </div>
                }
            />

            <AdaptiveCard
                className="mb-6"
                bodyClass="p-0"
                header={{
                    content: <h4>Plantillas de Notificación</h4>,
                }}
            >
                {/* Use DataTable component */}
                <DataTable
                    columns={columns}
                    data={templates}
                    loading={loading}
                    skeletonAvatarColumns={[]} 
                    skeletonAvatarProps={{ width: 28, height: 28 }}
                />
                {/* Render error message below table if needed */}
                {error && (
                    <div className="p-6 text-center text-red-600">
                        <p>{error}</p>
                        <Button onClick={fetchTemplates} className="mt-4">
                            {t('notificationBuilder.retry') || 'Reintentar'}
                        </Button>
                    </div>
                )}
                {/* Render no data message if not loading, no error, and no templates */}
                {!loading && !error && templates.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        <PiBellSlashDuotone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>
                            No hay plantillas de notificación creadas aún. Comienza
                            creando una nueva plantilla.
                        </p>
                        <Button
                            className="mt-4"
                            variant="solid"
                            icon={<PiPlusBold className="text-lg" />}
                            onClick={handleCreateTemplate}
                        >
                            Nueva Plantilla
                        </Button>
                    </div>
                )}
            </AdaptiveCard>

            {/* Info Drawer */}
            <Drawer
                title="Información sobre Notificaciones"
                isOpen={infoDrawerOpen}
                onClose={() => setInfoDrawerOpen(false)}
                onRequestClose={() => setInfoDrawerOpen(false)}
                width={580}
            >
                <div className="p-4">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <PiBellDuotone className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-600 mb-6">
                                El sistema de notificaciones permite configurar diversos tipos de alertas y mensajes para usuarios y sistemas conectados.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                                <PiLightbulbDuotone className="w-5 h-5 mr-2 text-amber-500" />
                                Información General
                            </h3>
                            <ul className="text-sm text-gray-600 space-y-2 pl-6 list-disc">
                                <li>
                                    Las plantillas de notificación permiten definir mensajes con formato y variables dinámicas.
                                </li>
                                <li>
                                    Cada plantilla se asocia a un canal específico: email, SMS, notificación interna, push o webhook.
                                </li>
                                <li>
                                    Las variables se insertan en el formato {'{variable_name}'} entre llaves dobles y se reemplazan en tiempo de envío.
                                </li>
                                <li>
                                    Las plantillas pueden activarse y desactivarse según sea necesario.
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                                <PiGearDuotone className="w-5 h-5 mr-2 text-blue-500" />
                                Administración
                            </h3>
                            <ul className="text-sm text-gray-600 space-y-2 pl-6 list-disc">
                                <li>
                                    Crea nuevas plantillas especificando canal, contenido y variables.
                                </li>
                                <li>
                                    Edita plantillas existentes para modificar su contenido o configuración.
                                </li>
                                <li>
                                    Activa o desactiva plantillas según necesidades operativas.
                                </li>
                                <li>
                                    Las plantillas de sistema no pueden ser eliminadas ni cambiar su canal.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="solid"
                            onClick={() => setInfoDrawerOpen(false)}
                        >
                            Entendido
                        </Button>
                    </div>
                </div>
            </Drawer>

            {/* Modal para crear/editar plantillas de notificación */}
            <NotificationFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                template={selectedTemplate}
            />
        </>
    )
}

export default NotificationBuilderPage