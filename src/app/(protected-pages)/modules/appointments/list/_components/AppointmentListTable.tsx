/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_components/AppointmentListTable.tsx
 * Componente de tabla para mostrar listado de citas con funcionalidades de ordenación,
 * paginación y selección.
 * @version 1.0.0
 * @updated 2025-06-30
 */

'use client'

import { useMemo, useEffect, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import DataTable from '@/components/shared/DataTable'
import { useAppointmentListStore } from '../_store/appointmentListStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TbPencil, TbEye } from 'react-icons/tb'
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { Appointment } from '../types'
import { formatCurrency } from '@/utils/formatCurrency'

type AppointmentListTableProps = {
    appointmentListTotal: number
    pageIndex?: number
    pageSize?: number
}

const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-200 dark:bg-blue-200 text-gray-900 dark:text-gray-900',
    confirmed: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    completed: 'bg-purple-200 dark:bg-purple-200 text-gray-900 dark:text-gray-900',
    cancelled: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
    rescheduled: 'bg-amber-200 dark:bg-amber-200 text-gray-900 dark:text-gray-900',
}

const LeadColumn = ({ row }: { row: Appointment }) => {
    return (
        <div className="flex items-center">
            <Avatar size={40} shape="circle" src={row.lead?.profile_image || ''} />
            <Link
                className={`hover:text-primary ml-2 rtl:mr-2 font-semibold text-gray-900 dark:text-gray-100`}
                href={`/modules/leads/leads-details/${row.lead_id}`}
            >
                {row.lead?.full_name || 'Cliente sin nombre'}
            </Link>
        </div>
    )
}

const AgentColumn = ({ row }: { row: Appointment }) => {
    if (!row.agent) return <span className="text-gray-500">No asignado</span>
    
    return (
        <div className="flex items-center">
            <Avatar size={40} shape="circle" src={row.agent?.profile_image || ''} />
            <Link
                className={`hover:text-primary ml-2 rtl:mr-2 font-semibold text-gray-900 dark:text-gray-100`}
                href={`/modules/agents/agent-details/${row.agent_id}`}
            >
                {row.agent?.name || 'Agente sin nombre'}
            </Link>
        </div>
    )
}

const PropertyColumn = ({ row }: { row: Appointment }) => {
    if (!row.properties || row.properties.length === 0) {
        return <span className="text-gray-500">Sin propiedades</span>
    }
    
    // Si hay más de una propiedad, mostrar la primera con indicador
    const property = row.properties[0]
    const hasMore = row.properties.length > 1
    
    return (
        <div className="flex items-center">
            <Link
                className={`hover:text-primary font-semibold text-gray-900 dark:text-gray-100`}
                href={`/modules/properties/property-details/${property.id}`}
            >
                {property.name}
                {hasMore && <span className="ml-1 text-gray-500">(+{row.properties.length - 1})</span>}
            </Link>
        </div>
    )
}

const ActionColumn = ({
    onEdit,
    onViewDetail,
}: {
    onEdit: () => void
    onViewDetail: () => void
}) => {
    return (
        <div className="flex items-center gap-3">
            <Tooltip title="Editar">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold`}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Ver detalles">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold`}
                    role="button"
                    onClick={onViewDetail}
                >
                    <TbEye />
                </div>
            </Tooltip>
        </div>
    )
}

const AppointmentListTable = ({
    appointmentListTotal,
    pageIndex = 1,
    pageSize = 10,
}: AppointmentListTableProps) => {
    const router = useRouter()
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)

    const appointmentList = useAppointmentListStore((state) => state.appointmentList)
    const selectedAppointments = useAppointmentListStore(
        (state) => state.selectedAppointments
    )
    const isInitialLoading = useAppointmentListStore(
        (state) => state.initialLoading
    )
    const setSelectedAppointments = useAppointmentListStore(
        (state) => state.setSelectedAppointments
    )
    const setSelectAllAppointments = useAppointmentListStore(
        (state) => state.setSelectAllAppointments
    )

    // Verificar si el usuario es superadmin
    useEffect(() => {
        // Verificamos si alguna cita tiene tenant_id diferente
        // Esta es una forma simple de detectar si es superadmin viendo multiple tenants
        if (appointmentList.length > 1) {
            const uniqueTenants = new Set(appointmentList.map(appointment => appointment.tenant_id))
            if (uniqueTenants.size > 1) {
                setIsSuperAdmin(true)
            }
        }
    }, [appointmentList])

    const { onAppendQueryParams } = useAppendQueryParams()

    const handleEdit = (appointment: Appointment) => {
        router.push(`/modules/appointments/appointment-edit/${appointment.id}`)
    }

    const handleViewDetails = (appointment: Appointment) => {
        router.push(`/modules/appointments/appointment-details/${appointment.id}`)
    }

    const columns: ColumnDef<Appointment>[] = useMemo(
        () => [
            {
                header: 'Fecha',
                accessorKey: 'appointment_date',
                cell: (props) => {
                    const row = props.row.original
                    const date = new Date(row.appointment_date)
                    return (
                        <div>
                            {date.toLocaleDateString('es-MX')}
                            <div className="text-sm text-gray-500">
                                {row.appointment_time}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Prospecto',
                accessorKey: 'lead_id',
                cell: (props) => {
                    const row = props.row.original
                    return <LeadColumn row={row} />
                },
            },
            {
                header: 'Agente',
                accessorKey: 'agent_id',
                cell: (props) => {
                    const row = props.row.original
                    return <AgentColumn row={row} />
                },
            },
            {
                header: 'Propiedad',
                accessorKey: 'property_ids',
                cell: (props) => {
                    const row = props.row.original
                    return <PropertyColumn row={row} />
                },
            },
            {
                header: 'Ubicación',
                accessorKey: 'location',
                cell: (props) => {
                    return <span>{props.row.original.location}</span>
                },
            },
            // Columna Tenant - solo visible para superadmin
            ...(isSuperAdmin ? [{
                header: 'Tenant',
                accessorKey: 'tenant_id',
                cell: (props) => {
                    return <span className="text-xs text-gray-500">{props.row.original.tenant_id}</span>
                },
            }] : []),
            {
                header: 'Estado',
                accessorKey: 'status',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[row.status]}>
                                <span className="capitalize">{row.status}</span>
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: '',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onViewDetail={() =>
                            handleViewDetails(props.row.original)
                        }
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    const handlePaginationChange = (page: number) => {
        onAppendQueryParams({
            pageIndex: String(page),
        })
    }

    const handleSelectChange = (value: number) => {
        onAppendQueryParams({
            pageSize: String(value),
            pageIndex: '1',
        })
    }

    const handleSort = (sort: OnSortParam) => {
        onAppendQueryParams({
            order: sort.order,
            sortKey: sort.key,
        })
    }

    const handleRowSelect = (checked: boolean, row: Appointment) => {
        setSelectedAppointments(checked, row)
    }

    const handleAllRowSelect = (checked: boolean, rows: Row<Appointment>[]) => {
        if (checked) {
            const originalRows = rows.map((row) => row.original)
            setSelectAllAppointments(originalRows)
        } else {
            setSelectAllAppointments([])
        }
    }

    return (
        <DataTable
            selectable
            columns={columns}
            data={appointmentList}
            noData={appointmentList.length === 0}
            skeletonAvatarColumns={[1, 2]}
            skeletonAvatarProps={{ width: 28, height: 28 }}
            loading={isInitialLoading}
            pagingData={{
                total: appointmentListTotal,
                pageIndex,
                pageSize,
            }}
            checkboxChecked={(row) =>
                selectedAppointments.some((selected) => selected.id === row.id)
            }
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onCheckBoxChange={handleRowSelect}
            onIndeterminateCheckBoxChange={handleAllRowSelect}
        />
    )
}

export default AppointmentListTable
