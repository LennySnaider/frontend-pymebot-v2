/**
 * agentprop/src/app/(protected-pages)/superadmin/variable-builder/page.tsx // Corrected path
 * Página para la administración de variables del sistema (SUPERADMIN)
 * @version 1.2.0 // Updated version
 * @updated 2025-10-10 // Implementada funcionalidad de creación, edición y eliminación de variables
 */

'use client'

import React, { useState, useEffect, useMemo, ReactNode } from 'react'
import { useTranslation } from '@/utils/hooks/useTranslation' // Corrected: Call without namespace
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import DataTable from '@/components/shared/DataTable' // Corrected default import
import { Button, Drawer, Badge, toast, Notification } from '@/components/ui'
// Corrected store import path
import { useSystemVariablesStore } from '@/app/(protected-pages)/superadmin/variable-builder/_store/systemVariablesStore'
import VariableFormModal from '@/app/(protected-pages)/superadmin/variable-builder/_components/VariableFormModal'
import type { ColumnDef } from '@tanstack/react-table' // Import ColumnDef type if DataTable uses TanStack Table
import {
    PiPlusBold,
    PiQuestionBold,
    PiSlidersHorizontalDuotone,
    PiWrenchDuotone,
    PiInfoDuotone,
    PiPencilSimpleBold,
    PiTrashSimpleBold,
    PiEyeBold,
    PiEyeSlashBold,
    // PiSpinnerGap, // Removed unused import
} from 'react-icons/pi'

// Interface for SystemVariable (matching store)
interface SystemVariable {
    id: string
    name: string
    display_name: string
    type: string
    category_id?: string
    category_name?: string
    is_tenant_configurable: boolean
    is_sensitive: boolean
    default_value?: string
    updated_at: string
}

const VariableBuilderPage = () => {
    // Renamed component to match filename convention
    const t = useTranslation() // Corrected: Called without namespace argument
    const [infoDrawerOpen, setInfoDrawerOpen] = useState(false)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false)
    const [selectedVariable, setSelectedVariable] = useState<
        SystemVariable | undefined
    >(undefined)

    // Use individual selectors instead of an object to avoid infinite loop
    const variables = useSystemVariablesStore((state) => state.variables)
    const loading = useSystemVariablesStore((state) => state.loading)
    const error = useSystemVariablesStore((state) => state.error)
    const fetchVariables = useSystemVariablesStore(
        (state) => state.fetchVariables,
    )
    const deleteVariable = useSystemVariablesStore(
        (state) => state.deleteVariable,
    )

    // Cleaned useEffect
    useEffect(() => {
        fetchVariables()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // fetchVariables is stable according to the definition of Zustand

    const showInfoToast = (message: ReactNode) => {
        toast.push(
            // Using t() with single argument
            <Notification
                title={t('systemVariables.toast.infoTitle')}
                type="info"
            >
                {message}
            </Notification>,
        )
    }

    const handleCreateVariable = () => {
        setSelectedVariable(undefined)
        setIsFormModalOpen(true)
    }

    const handleEdit = (variableId: string) => {
        const variable = variables.find((v) => v.id === variableId)
        if (variable) {
            setSelectedVariable(variable)
            setIsFormModalOpen(true)
        } else {
            showInfoToast(t('systemVariables.toast.variableNotFound'))
        }
    }

    const handleDelete = async (variableId: string) => {
        // TODO: Usar un componente Modal de confirmación en lugar de window.confirm
        if (!window.confirm(t('systemVariables.confirmDelete.message'))) {
            return
        }

        try {
            await deleteVariable(variableId)
            toast.push(
                <Notification
                    title={t('systemVariables.toast.success')}
                    type="success"
                >
                    {t('systemVariables.toast.variableDeleted')}
                </Notification>,
            )
        } catch (error) {
            console.error('Error al eliminar la variable:', error)
            toast.push(
                <Notification
                    title={t('systemVariables.toast.error')}
                    type="danger"
                >
                    {t('systemVariables.toast.errorDeletingVariable')}
                </Notification>,
            )
        }
    }

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false)
        setSelectedVariable(undefined)
    }

    // Define columns for DataTable using TanStack Table's ColumnDef
    // Assuming keys are now nested under 'systemVariables' namespace in JSON files
    const columns = useMemo<ColumnDef<SystemVariable>[]>(
        () => [
            {
                header: t('systemVariables.table.header.internalName'),
                accessorKey: 'name',
                cell: ({ row }) => (
                    <span className="font-mono text-xs">
                        {row.original.name}
                    </span>
                ),
            },
            {
                header: t('systemVariables.table.header.displayName'),
                accessorKey: 'display_name',
            },
            {
                header: t('systemVariables.table.header.type'),
                accessorKey: 'type',
                cell: ({ row }) => <Badge>{row.original.type}</Badge>, // TODO: Traducir tipos
            },
            // { header: t('systemVariables.table.header.category'), accessorKey: 'category_name' }, // Si se añade join
            {
                header: t('systemVariables.table.header.configurable'),
                accessorKey: 'is_tenant_configurable',
                cell: ({ row }) =>
                    row.original.is_tenant_configurable ? (
                        <Badge>{t('systemVariables.boolean.yes')}</Badge>
                    ) : (
                        <Badge>{t('systemVariables.boolean.no')}</Badge>
                    ),
            },
            {
                header: t('systemVariables.table.header.sensitive'),
                accessorKey: 'is_sensitive',
                cell: ({ row }) =>
                    row.original.is_sensitive ? (
                        <PiEyeSlashBold
                            className="text-red-500 h-5 w-5"
                            title={t('systemVariables.sensitive.trueTooltip')}
                        />
                    ) : (
                        <PiEyeBold
                            className="text-gray-400 h-5 w-5"
                            title={t('systemVariables.sensitive.falseTooltip')}
                        />
                    ),
            },
            {
                header: t('systemVariables.table.header.defaultValue'),
                accessorKey: 'default_value',
                cell: ({ row }) => {
                    if (row.original.is_sensitive) {
                        return (
                            <span className="italic text-gray-400">
                                {t('systemVariables.defaultValue.hidden')}
                            </span>
                        )
                    }
                    const value = row.original.default_value || '-'
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
                header: t('systemVariables.table.header.actions'),
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex justify-end items-center gap-1">
                        <Button
                            shape="circle"
                            variant="plain"
                            size="sm"
                            icon={<PiPencilSimpleBold />}
                            onClick={() => handleEdit(row.original.id)}
                            title={t('systemVariables.actions.edit')}
                        />
                        <Button
                            shape="circle"
                            variant="plain"
                            size="sm"
                            color="red"
                            icon={<PiTrashSimpleBold />}
                            onClick={() => handleDelete(row.original.id)}
                            title={t('systemVariables.actions.delete')}
                        />
                    </div>
                ),
            },
        ],
        [t], // handleEdit, handleDelete are stable
    )

    // Removed the top informative card for consistency

    return (
        <>
            <HeaderBreadcrumbs
                heading={t('systemVariables.pageTitle')}
                links={[
                    // Assuming 'nav' namespace exists for these common keys
                    { name: t('nav.dashboard.dashboard'), href: '/home' },
                    { name: t('nav.superadmin.tools') },
                    { name: t('systemVariables.breadcrumbs.currentPage') }, // Use specific key if needed
                ]}
                action={
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<PiPlusBold className="text-lg" />}
                            onClick={handleCreateVariable}
                        >
                            {t('systemVariables.newVariableButton')}
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
                bodyClass="p-0" // DataTable likely handles its own padding
                header={{
                    content: <h4>{t('systemVariables.cardTitle')}</h4>,
                    // TODO: Add filters, search input here later
                }}
            >
                {/* Use DataTable component */}
                <DataTable
                    columns={columns}
                    data={variables}
                    loading={loading}
                    skeletonAvatarColumns={[0]} // Example: if first column had avatar
                    skeletonAvatarProps={{ width: 28, height: 28 }} // Example props
                    // TODO: Add pagination, sorting, filtering props if needed
                    // pagingData={{ pageIndex: 0, pageSize: 10, total: variables.length }}
                    // onPaginationChange={handlePaginationChange}
                    // onSort={handleSort}
                />
                {/* Render error message below table if needed, or handle in DataTable */}
                {error && (
                    <div className="p-6 text-center text-red-600">
                        <p>{error}</p>
                        <Button onClick={fetchVariables} className="mt-4">
                            {t('systemVariables.retry')}
                        </Button>
                    </div>
                )}
                {/* Render no data message if not loading, no error, and no variables */}
                {!loading && !error && variables.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        <PiSlidersHorizontalDuotone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>{t('systemVariables.noVariablesFound')}</p>
                        <Button
                            className="mt-4"
                            variant="default"
                            onClick={handleCreateVariable}
                        >
                            {t('systemVariables.createFirstVariable')}
                        </Button>
                    </div>
                )}
            </AdaptiveCard>

            {/* Info Drawer */}
            <Drawer
                title={t('systemVariables.infoDrawer.title')}
                isOpen={infoDrawerOpen}
                onClose={() => setInfoDrawerOpen(false)}
                onRequestClose={() => setInfoDrawerOpen(false)}
                width={580}
            >
                <div className="p-4">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            {/* Use relevant icon for variable builder */}
                            <PiSlidersHorizontalDuotone className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-600 mb-6">
                                {t('systemVariables.infoDrawer.description')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                <PiInfoDuotone className="w-5 h-5 mr-2 text-sky-500" />
                                {t(
                                    'systemVariables.infoDrawer.whatAreVariablesTitle',
                                )}
                            </h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-6 list-disc">
                                <li>
                                    {t(
                                        'systemVariables.infoDrawer.whatAreVariablesPoint1',
                                    )}
                                </li>
                                <li>
                                    {t(
                                        'systemVariables.infoDrawer.whatAreVariablesPoint2',
                                    )}
                                </li>
                                <li>
                                    {t(
                                        'systemVariables.infoDrawer.whatAreVariablesPoint3',
                                    )}
                                </li>
                                <li>
                                    {t(
                                        'systemVariables.infoDrawer.whatAreVariablesPoint4',
                                    )}
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                <PiWrenchDuotone className="w-5 h-5 mr-2 text-blue-500" />
                                {t(
                                    'systemVariables.infoDrawer.administrationTitle',
                                )}
                            </h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-6 list-disc">
                                <li>
                                    {t(
                                        'systemVariables.infoDrawer.administrationPoint1',
                                    )}
                                </li>
                                <li>
                                    {t(
                                        'systemVariables.infoDrawer.administrationPoint2',
                                    )}
                                </li>
                                <li>
                                    {t(
                                        'systemVariables.infoDrawer.administrationPoint3',
                                    )}
                                </li>
                                <li>
                                    {t(
                                        'systemVariables.infoDrawer.administrationPoint4',
                                    )}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="solid"
                            onClick={() => setInfoDrawerOpen(false)}
                        >
                            {t('systemVariables.infoDrawer.closeButton')}
                        </Button>
                    </div>
                </div>
            </Drawer>

            {/* Modal para crear/editar variables */}
            <VariableFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                variable={selectedVariable}
            />
        </>
    )
}

export default VariableBuilderPage // Renamed export
