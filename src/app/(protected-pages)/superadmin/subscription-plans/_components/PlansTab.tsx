/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_components/PlansTab.tsx
 * Pestaña para gestión de planes de suscripción
 * @version 1.1.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { Button, Badge, toast, Notification } from '@/components/ui'
import DataTable from '@/components/shared/DataTable'
import { Plan, usePlansStore } from '../_store/plansStore'
import PlanFormModal from './PlanFormModal'
import {
    PiPlusBold,
    PiPencilSimpleBold,
    PiTrashSimpleBold,
    PiArrowsCounterClockwiseBold,
    PiListBold
} from 'react-icons/pi'
import ModuleAssignmentsModal from './ModuleAssignmentsModal'

const PlansTab = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false)
    const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

    const { plans, loadingPlans, error, fetchPlans, deletePlan } = usePlansStore()

    useEffect(() => {
        const loadPlans = async () => {
            try {
                await fetchPlans()
            } catch (error) {
                // El error ya se muestra a través del estado error del store
                console.error('Error al cargar planes:', error)
            }
        }

        loadPlans()
    }, [fetchPlans])

    const handleCreate = () => {
        setSelectedPlan(null)
        setIsFormModalOpen(true)
    }

    const handleEdit = (plan: Plan) => {
        setSelectedPlan(plan)
        setIsFormModalOpen(true)
    }

    const handleManageModules = (plan: Plan) => {
        setSelectedPlan(plan)
        setIsAssignmentsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (
            !window.confirm('¿Está seguro de que desea eliminar este plan?')
        ) {
            return
        }

        try {
            await deletePlan(id)
            toast.push(
                <Notification title="Éxito" type="success">
                    Plan eliminado correctamente
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al eliminar el plan
                </Notification>,
            )
        }
    }

    const handleReload = async () => {
        try {
            await fetchPlans()
            toast.push(
                <Notification title="Éxito" type="success">
                    Planes actualizados correctamente
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al cargar los planes
                </Notification>,
            )
        }
    }

    // Formateador de precios
    const formatPrice = (price: number, cycle: string) => {
        const formatter = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
        })
        
        const suffixMap: Record<string, string> = {
            'monthly': '/mes',
            'yearly': '/año',
            'one_time': ' (pago único)'
        }
        
        return `${formatter.format(price)}${suffixMap[cycle] || ''}`
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
            header: 'Precio',
            accessorKey: 'price',
            cell: ({ row }) => (
                <span>
                    {formatPrice(row.original.price_monthly, 'monthly')}
                </span>
            ),
        },
        {
            header: 'Usuarios',
            accessorKey: 'max_users',
            cell: ({ row }) => (
                <span>{row.original.max_users}</span>
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
            header: 'Acciones',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<PiListBold />}
                        onClick={() => handleManageModules(row.original)}
                        title="Gestionar módulos"
                    />
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<PiPencilSimpleBold />}
                        onClick={() => handleEdit(row.original)}
                        title="Editar plan"
                    />
                    <Button
                        size="xs"
                        variant="plain"
                        color="red"
                        icon={<PiTrashSimpleBold />}
                        onClick={() => handleDelete(row.original.id)}
                        title="Eliminar plan"
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
                    content: <h4>Planes de Suscripción</h4>,
                    extra: (
                        <div className="flex space-x-2">
                            <Button
                                size="sm"
                                variant="twoTone"
                                icon={<PiArrowsCounterClockwiseBold />}
                                onClick={handleReload}
                                loading={loadingPlans}
                            >
                                Actualizar
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<PiPlusBold />}
                                onClick={handleCreate}
                            >
                                Nuevo Plan
                            </Button>
                        </div>
                    ),
                }}
            >
                {plans.length === 0 && !loadingPlans ? (
                    <div className="p-6 text-center text-gray-500">
                        No hay planes de suscripción. Cree uno nuevo con el botón &quot;Nuevo Plan&quot;.
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={plans}
                        loading={loadingPlans}
                        skeletonAvatarColumns={[0]}
                        skeletonAvatarProps={{ width: 28, height: 28 }}
                    />
                )}

                {error && (
                    <div className="p-4 text-center text-red-500">{error}</div>
                )}
            </AdaptiveCard>

            <PlanFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                plan={selectedPlan}
            />

            <ModuleAssignmentsModal
                isOpen={isAssignmentsModalOpen}
                onClose={() => setIsAssignmentsModalOpen(false)}
                plan={selectedPlan}
            />
        </>
    )
}

export default PlansTab
