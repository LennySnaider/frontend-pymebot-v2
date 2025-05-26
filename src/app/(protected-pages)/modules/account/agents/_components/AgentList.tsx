/**
 * Lista de agentes con tabla y acciones
 */

'use client'

import { useMemo, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import { useAgentContext } from './AgentProvider'
import type { Agent } from '../types'
import type { ColumnDef } from '@tanstack/react-table'
import { HiPencil, HiTrash, HiDotsVertical } from 'react-icons/hi'
import { TbClock } from 'react-icons/tb'
import Dropdown from '@/components/ui/Dropdown'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import AgentAvailabilityDialog from './AgentAvailabilityDialog'

interface AgentListProps {
    pageIndex: number
    pageSize: number
}

export default function AgentList({ pageIndex, pageSize }: AgentListProps) {
    const router = useRouter()
    const { agents, totalAgents, openEditDialog } = useAgentContext()
    const [availabilityDialog, setAvailabilityDialog] = useState<{
        isOpen: boolean
        agentId: string
        agentName: string
        availability?: any
    }>({
        isOpen: false,
        agentId: '',
        agentName: '',
        availability: {}
    })
    
    const columns = useMemo<ColumnDef<Agent>[]>(
        () => [
            {
                header: 'Agente',
                accessorKey: 'full_name',
                cell: ({ row }) => {
                    const agent = row.original
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar 
                                size={32}
                                src={agent.avatar_url}
                                shape="circle"
                            />
                            <div>
                                <div className="font-medium">{agent.full_name}</div>
                                <div className="text-sm text-gray-500">{agent.email}</div>
                            </div>
                        </div>
                    )
                }
            },
            {
                header: 'Teléfono',
                accessorKey: 'phone',
                cell: ({ getValue }) => {
                    const phone = getValue() as string
                    return phone || '-'
                }
            },
            {
                header: 'Estado',
                accessorKey: 'status',
                cell: ({ getValue }) => {
                    const status = getValue() as string
                    const color = status === 'active' ? 'green' : 
                                 status === 'inactive' ? 'gray' : 'red'
                    const label = status === 'active' ? 'Activo' :
                                 status === 'inactive' ? 'Inactivo' : 'Suspendido'
                    
                    return <Tag color={color}>{label}</Tag>
                }
            },
            {
                header: 'Especialización',
                accessorKey: 'specialization',
                cell: ({ getValue }) => {
                    const spec = getValue() as string
                    return spec || 'General'
                }
            },
            {
                header: 'Leads Activos',
                accessorKey: 'active_leads',
                cell: ({ getValue }) => {
                    const leads = getValue() as number
                    return leads || 0
                }
            },
            {
                header: 'Acciones',
                id: 'actions',
                cell: ({ row }) => {
                    const agent = row.original
                    
                    return (
                        <Dropdown
                            renderTitle={
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<HiDotsVertical />}
                                />
                            }
                        >
                            <Dropdown.Item 
                                eventKey="edit"
                                onClick={() => openEditDialog(agent)}
                            >
                                <span className="flex items-center gap-2">
                                    <HiPencil />
                                    Editar
                                </span>
                            </Dropdown.Item>
                            <Dropdown.Item 
                                eventKey="view"
                                onClick={() => router.push(`/modules/account/agents/${agent.id}`)}
                            >
                                Ver detalles
                            </Dropdown.Item>
                            <Dropdown.Item 
                                eventKey="availability"
                                onClick={() => {
                                    setAvailabilityDialog({
                                        isOpen: true,
                                        agentId: agent.id,
                                        agentName: agent.full_name,
                                        availability: agent.availability || {}
                                    })
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    <TbClock />
                                    Configurar disponibilidad
                                </span>
                            </Dropdown.Item>
                            <Dropdown.Item 
                                eventKey="delete"
                                className="text-red-600"
                            >
                                <span className="flex items-center gap-2">
                                    <HiTrash />
                                    Eliminar
                                </span>
                            </Dropdown.Item>
                        </Dropdown>
                    )
                }
            }
        ],
        [openEditDialog, router]
    )
    
    const handlePaginationChange = (page: number) => {
        router.push(`?pageIndex=${page}&pageSize=${pageSize}`)
    }
    
    const handlePageSizeChange = (size: number) => {
        router.push(`?pageIndex=1&pageSize=${size}`)
    }
    
    return (
        <>
            <Table
                columns={columns}
                data={agents}
                pagingData={{
                    total: totalAgents,
                    pageIndex: pageIndex - 1, // La tabla usa índice basado en 0
                    pageSize: pageSize,
                }}
                onPaginationChange={(pagination) => {
                    if (pagination.pageIndex !== undefined) {
                        handlePaginationChange(pagination.pageIndex + 1)
                    }
                    if (pagination.pageSize !== undefined) {
                        handlePageSizeChange(pagination.pageSize)
                    }
                }}
            />
            
            <AgentAvailabilityDialog
                isOpen={availabilityDialog.isOpen}
                onClose={() => setAvailabilityDialog(prev => ({ ...prev, isOpen: false }))}
                agentId={availabilityDialog.agentId}
                agentName={availabilityDialog.agentName}
                currentAvailability={availabilityDialog.availability}
            />
        </>
    )
}