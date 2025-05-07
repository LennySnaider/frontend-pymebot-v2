/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_components/ModulesTab.tsx
 * Pestaña para gestión de módulos del sistema
 * @version 1.0.0
 * @created 2025-04-10
 */

'use client'

import React, { useState, useEffect } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { Button, Badge, toast, Notification } from '@/components/ui'
import DataTable from '@/components/shared/DataTable'
import { useModulesStore, Module } from '../_store/modulesStore'
import ModuleFormModal from './ModuleFormModal'
import {
    PiPlusBold,
    PiPencilSimpleBold,
    PiTrashSimpleBold,
    PiArrowsCounterClockwiseBold,
} from 'react-icons/pi'

const ModulesTab = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedModule, setSelectedModule] = useState<Module | null>(null)

    const { modules, loading, error, fetchModules, deleteModule } =
        useModulesStore()

    useEffect(() => {
        const loadModules = async () => {
            try {
                await fetchModules()
            } catch (error) {
                // El error ya se muestra a través del estado error del store
                console.error('Error al cargar módulos:', error)
                toast.push(
                    <Notification title="Error" type="danger">
                        Error al cargar los módulos. Intente nuevamente más
                        tarde.
                    </Notification>,
                )
            }
        }

        loadModules()
    }, [fetchModules])

    const handleCreate = () => {
        setSelectedModule(null)
        setIsModalOpen(true)
    }

    const handleEdit = (module: Module) => {
        setSelectedModule(module)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (
            !window.confirm('¿Está seguro de que desea eliminar este módulo?')
        ) {
            return
        }

        try {
            await deleteModule(id)
            toast.push(
                <Notification title="Éxito" type="success">
                    Módulo eliminado correctamente
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al eliminar el módulo
                </Notification>,
            )
        }
    }

    const handleReload = async () => {
        try {
            await fetchModules()
            toast.push(
                <Notification title="Éxito" type="success">
                    Módulos actualizados correctamente
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
            header: 'Módulo Core',
            accessorKey: 'is_core',
            cell: ({ row }) => (
                <Badge
                    content={row.original.is_core ? 'Sí' : 'No'}
                    className={
                        row.original.is_core ? 'bg-blue-500' : 'bg-gray-400'
                    }
                />
            ),
        },
        {
            header: 'Orden',
            accessorKey: 'order_index',
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
                        disabled={row.original.is_core}
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
                    content: <h4>Módulos del Sistema</h4>,
                    extra: (
                        <div className="flex space-x-2">
                            <Button
                                size="sm"
                                variant="twoTone"
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
                                Nuevo Módulo
                            </Button>
                        </div>
                    ),
                }}
            >
                <DataTable
                    columns={columns}
                    data={modules}
                    loading={loading}
                    skeletonAvatarColumns={[0]}
                    skeletonAvatarProps={{ width: 28, height: 28 }}
                />

                {error && (
                    <div className="p-4 text-center text-red-500">{error}</div>
                )}
            </AdaptiveCard>

            <ModuleFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                module={selectedModule}
            />
        </>
    )
}

export default ModulesTab
