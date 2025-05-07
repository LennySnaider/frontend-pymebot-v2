/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_components/VerticalsTab.tsx
 * Pestaña para gestión de verticales de negocio
 * @version 1.1.0
 * @updated 2025-04-14
 */

'use client'

import React, { useState, useEffect } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { Button, Badge, toast, Notification } from '@/components/ui'
import DataTable from '@/components/shared/DataTable'
import { useVerticalsStore, Vertical } from '../_store/verticalsStore'
import VerticalFormModal from './VerticalFormModal'
import {
    PiPlusBold,
    PiPencilSimpleBold,
    PiTrashSimpleBold,
    PiArrowsCounterClockwiseBold,
    PiBuildingsBold,
} from 'react-icons/pi'

const VerticalsTab = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedVertical, setSelectedVertical] = useState<Vertical | null>(
        null,
    )

    const { verticals, loading, error, fetchVerticals, deleteVertical } =
        useVerticalsStore()

    useEffect(() => {
        const loadVerticals = async () => {
            try {
                await fetchVerticals()
            } catch (error) {
                // El error ya se muestra a través del estado error del store
                console.error('Error al cargar verticales:', error)
                toast.push(
                    <Notification title="Error" type="danger">
                        Error al cargar las verticales. Intente nuevamente más
                        tarde.
                    </Notification>,
                )
            }
        }

        loadVerticals()
    }, [fetchVerticals])

    const handleCreate = () => {
        setSelectedVertical(null)
        setIsModalOpen(true)
    }

    const handleEdit = (vertical: Vertical) => {
        setSelectedVertical(vertical)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (
            !window.confirm('¿Está seguro de que desea eliminar esta vertical?')
        ) {
            return
        }

        try {
            await deleteVertical(id)
            toast.push(
                <Notification title="Éxito" type="success">
                    Vertical eliminada correctamente
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al eliminar la vertical
                </Notification>,
            )
        }
    }

    const handleReload = async () => {
        try {
            await fetchVerticals()
            toast.push(
                <Notification title="Éxito" type="success">
                    Verticales actualizadas correctamente
                </Notification>,
            )
        } catch (error) {
            // El toast ya se muestra en el hook useEffect
        }
    }

    const columns = [
        {
            header: 'Nombre',
            accessorKey: 'name',
            cell: ({ row }) => (
                <div>
                    <div>{row.original.name}</div>
                    <div className="text-xs text-gray-500">
                        {row.original.brand_name}
                    </div>
                </div>
            ),
        },
        {
            header: 'Código',
            accessorKey: 'code',
            cell: ({ row }) => (
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                    {row.original.code}
                </code>
            ),
        },
        {
            header: 'Estado',
            accessorKey: 'is_active',
            cell: ({ row }) => (
                <Badge
                    content={row.original.is_active ? 'Activo' : 'Inactivo'}
                    className={
                        row.original.is_active
                            ? 'bg-emerald-500'
                            : 'bg-gray-400'
                    }
                />
            ),
        },
        {
            header: 'Módulos',
            accessorKey: 'modules',
            cell: ({ row }) => (
                <div className="text-sm">
                    {row.original.modules?.length || 0} módulos asignados
                </div>
            ),
        },
        {
            header: 'Categorías',
            accessorKey: 'categories',
            cell: ({ row }) => (
                <div className="text-sm">
                    {row.original.categories?.length || 0} categorías
                </div>
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<PiPencilSimpleBold />}
                        onClick={() => handleEdit(row.original)}
                    />
                    <Button
                        size="xs"
                        variant="plain"
                        color="red"
                        icon={<PiTrashSimpleBold />}
                        onClick={() => handleDelete(row.original.id)}
                    />
                </div>
            ),
        },
    ]

    return (
        <>
            <AdaptiveCard
                className="mb-6"
                bodyClass="p-0"
                header={{
                    content: <h4>Verticales de Negocio</h4>,
                    extra: (
                        <div className="flex space-x-2">
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<PiArrowsCounterClockwiseBold />}
                                onClick={handleReload}
                                loading={loading}
                            >
                                Actualizar
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<PiPlusBold />}
                                onClick={handleCreate}
                            >
                                Nueva Vertical
                            </Button>
                        </div>
                    ),
                }}
            >
                <DataTable
                    columns={columns}
                    data={verticals}
                    loading={loading}
                    skeletonAvatarColumns={[0]}
                    skeletonAvatarProps={{ width: 28, height: 28 }}
                />

                {error && (
                    <div className="p-4 text-center text-red-500">{error}</div>
                )}
            </AdaptiveCard>

            <VerticalFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                vertical={selectedVertical}
            />
        </>
    )
}

export default VerticalsTab
