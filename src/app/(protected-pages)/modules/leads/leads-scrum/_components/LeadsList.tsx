/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadsList.tsx
 * Componente que muestra una vista tabular de los leads/prospectos
 * basado en el componente CustomerListTable de ECME.
 *
 * @version 1.1.0
 * @updated 2025-03-31
 */

'use client'

import { useMemo, useState } from 'react' // Añadir useState
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button' // Importar Button
import DataTable from '@/components/shared/DataTable'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import Link from 'next/link'
import ConfirmDialog from '@/components/shared/ConfirmDialog' // Importar ConfirmDialog
import {
    TbPencil,
    TbEye,
    TbMessageCircle,
    TbPaperclip,
    TbHome,
    TbBuildingSkyscraper,
    TbMap,
    TbTrash, // Importar icono de papelera
} from 'react-icons/tb'
import { MdOutlineApartment } from 'react-icons/md'
import type { OnSortParam, ColumnDef } from '@/components/shared/DataTable'
import type { Ticket, Lead } from '../types'
import { useTranslations } from 'next-intl'

// Props para incluir las tarjetas de estado final
interface LeadsListProps {
    confirmedCards?: Ticket[]
    closedCards?: Ticket[]
}

// Extender el tipo Ticket para incluir la propiedad status en la vista Lista
interface TicketWithStatus extends Ticket {
    status?: string
}

// Definición de colores para etiquetas según tipo
const labelColorMap: Record<string, string> = {
    Task: 'bg-blue-200 dark:bg-blue-200 text-gray-900 dark:text-gray-900',
    Bug: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
    'Live issue':
        'bg-amber-200 dark:bg-amber-200 text-gray-900 dark:text-gray-900',
    'Low priority':
        'bg-gray-200 dark:bg-gray-200 text-gray-900 dark:text-gray-900',
    // Agregar traducciones
    Tarea: 'bg-blue-200 dark:bg-blue-200 text-gray-900 dark:text-gray-900',
    Incidencia:
        'bg-amber-200 dark:bg-amber-200 text-gray-900 dark:text-gray-900',
    'Baja prioridad':
        'bg-gray-200 dark:bg-gray-200 text-gray-900 dark:text-gray-900',
}

// Función para obtener iniciales de un nombre
const getInitials = (name: string): string => {
    if (!name) return '?'

    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

    return (
        parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase()
}

// Componente para mostrar el nombre del lead
const NameColumn = ({ row }: { row: TicketWithStatus }) => {
    // Determinar si hay una imagen de avatar disponible
    const hasAvatar =
        row.members && row.members.length > 0 && row.members[0]?.img

    return (
        <div className="flex items-center">
            {hasAvatar ? (
                <Avatar size={40} shape="circle" src={row.members?.[0].img} />
            ) : (
                <Avatar
                    size={40}
                    shape="circle"
                    className="bg-gray-200 text-gray-600"
                >
                    {getInitials(row.name)}
                </Avatar>
            )}
            <Link
                className="hover:text-primary ml-2 rtl:mr-2 font-semibold text-gray-900 dark:text-gray-100"
                href="#"
            >
                {row.name}
            </Link>
        </div>
    )
}

// Componente para mostrar las etiquetas del lead
const LabelsColumn = ({ labels }: { labels: string[] }) => {
    const t = useTranslations('scrumboard.tickets.types')

    // Función para traducir etiquetas
    const getTranslatedLabel = (label: string): string => {
        const labelKeyMap: Record<string, string> = {
            Task: 'task',
            Bug: 'bug',
            'Live issue': 'liveIssue',
            'Low priority': 'lowPriority',
        }

        if (labelKeyMap[label]) {
            try {
                return t(labelKeyMap[label])
            } catch {
                return label
            }
        }
        return label
    }

    return (
        <div className="flex flex-wrap gap-1">
            {labels.map((label, index) => {
                const translatedLabel = getTranslatedLabel(label)
                return (
                    <Tag
                        key={label + index}
                        className={`${labelColorMap[label] || labelColorMap[translatedLabel] || 'bg-gray-200'}`}
                    >
                        {translatedLabel}
                    </Tag>
                )
            })}
        </div>
    )
}

// Componente para mostrar los miembros asignados
const MembersColumn = ({
    members,
}: {
    members: Array<{ id: string; name: string; img?: string }>
}) => {
    return (
        <div className="flex items-center">
            <Avatar.Group
                chained
                maxCount={3}
                omittedAvatarProps={{ size: 25 }}
            >
                {members.map((member) => (
                    <Tooltip key={member.id} title={member.name}>
                        {member.img ? (
                            <Avatar size={25} src={member.img} />
                        ) : (
                            <Avatar
                                size={25}
                                className="bg-gray-200 text-gray-600"
                            >
                                {getInitials(member.name)}
                            </Avatar>
                        )}
                    </Tooltip>
                ))}
            </Avatar.Group>
        </div>
    )
}

// Columna de acciones
const ActionColumn = ({
    onEdit,
    onViewDetail,
    onDelete, // Agregar manejador para eliminar
}: {
    onEdit: () => void
    onViewDetail: () => void
    onDelete: () => void // Definir el tipo del manejador
}) => {
    return (
        <div className="flex justify-end text-lg">
            <Tooltip title="Editar">
                <Button
                    shape="circle"
                    variant="plain"
                    size="sm"
                    icon={<TbPencil />}
                    onClick={onEdit}
                />
            </Tooltip>
            <Tooltip title="Ver Detalles">
                <Button
                    shape="circle"
                    variant="plain"
                    size="sm"
                    icon={<TbEye />}
                    onClick={onViewDetail}
                />
            </Tooltip>
            <Tooltip title="Eliminar">
                <Button
                    shape="circle"
                    variant="plain"
                    size="sm"
                    icon={<TbTrash />}
                    onClick={onDelete}
                    className="text-red-500 hover:text-red-700"
                />
            </Tooltip>
        </div>
    )
}

const LeadsList = ({
    confirmedCards = [],
    closedCards = [],
}: LeadsListProps) => {
    const t = useTranslations('scrumboard')
    
    // Estado para el diálogo de confirmación de eliminación
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null)

    // Obtener datos del store
    const { columns, filteredColumns, searchQuery } = useSalesFunnelStore()

    // Valores predeterminados para las etiquetas de estado final
    let confirmedText = 'Confirmado'
    let closedText = 'Cerrado'

    // Intentar obtener traducciones
    try {
        const confirmedTranslation = t('columns.finalStates.confirmed')
        if (confirmedTranslation) {
            confirmedText = confirmedTranslation
        }
    } catch {
        // Ignorar error si falla la traducción, usar valor por defecto
    }

    try {
        const closedTranslation = t('columns.finalStates.closed')
        if (closedTranslation) {
            closedText = closedTranslation
        }
    } catch {
        // Ignorar error si falla la traducción, usar valor por defecto
    }

    // Aplanar todas las tarjetas en una sola lista para mostrarlas en la tabla
    const allTickets = useMemo(() => {
        const tickets: TicketWithStatus[] = []
        
        // Usar las columnas filtradas si hay una búsqueda activa
        const activeColumns = filteredColumns && searchQuery ? filteredColumns : columns;
        
        // Agregar tarjetas de las columnas normales
        Object.keys(activeColumns).forEach((columnKey) => {
            // Verificar que la columna exista antes de iterar
            if (activeColumns[columnKey]) {
                activeColumns[columnKey].forEach((ticket) => {
                    tickets.push({
                        ...ticket,
                        status: columnKey, // Añadir el estado (columna) como propiedad
                    })
                })
            }
        })

        // Agregar tarjetas confirmadas
        confirmedCards.forEach((ticket) => {
            tickets.push({
                ...ticket,
                status: confirmedText,
            })
        })

        // Agregar tarjetas cerradas
        closedCards.forEach((ticket) => {
            tickets.push({
                ...ticket,
                status: closedText,
            })
        })

        return tickets
    }, [columns, filteredColumns, searchQuery, confirmedCards, closedCards, confirmedText, closedText])

    const { onAppendQueryParams } = useAppendQueryParams()

    // Manejadores de acciones
    const handleEdit = (ticket: TicketWithStatus) => {
        console.log('Editar ticket:', ticket)
        // Abrir el diálogo de edición del lead
        useSalesFunnelStore.setState({
            dialogOpen: true,
            dialogView: 'LEAD',
            selectedLeadId: ticket.id,
        })
    }

    const handleViewDetails = (ticket: TicketWithStatus) => {
        console.log('Ver detalles de ticket:', ticket)
        // Navegar a la página de detalles del lead
        if (ticket.id) {
            window.location.href = `/modules/leads/leads-details/${ticket.id}`
        }
    }

    // Abrir el diálogo de confirmación de eliminación
    const handleDeleteConfirmation = (ticket: TicketWithStatus) => {
        setLeadToDelete(ticket.id)
        setDeleteDialogOpen(true)
    }

    // Confirmar la eliminación del lead
    const handleConfirmDelete = async () => {
        if (leadToDelete) {
            try {
                console.log(`Eliminando lead: ${leadToDelete}`)
                
                // Llamar al endpoint de eliminación
                const response = await fetch(`/api/leads/delete/${leadToDelete}`, {
                    method: 'DELETE',
                })
                
                const result = await response.json()
                
                if (!response.ok) {
                    throw new Error(result.error || 'Error al eliminar el lead')
                }
                
                console.log('Lead eliminado con éxito:', result)
                
                // Actualizar UI eliminando el lead de las columnas
                const newColumns = { ...columns }
                
                // Buscar y eliminar el lead de todas las columnas
                Object.keys(newColumns).forEach(columnKey => {
                    newColumns[columnKey] = newColumns[columnKey].filter(
                        lead => lead.id !== leadToDelete
                    )
                })
                
                // Actualizar el estado
                useSalesFunnelStore.setState({ columns: newColumns })
                
                // Mostrar notificación de éxito usando toast
                if (typeof window !== 'undefined') {
                    import('@/components/ui/toast').then(({ default: toast }) => {
                        import('@/components/ui/Notification').then(({ default: Notification }) => {
                            toast.push(
                                <Notification type="success">
                                    Lead eliminado correctamente
                                </Notification>,
                                { placement: 'top-center' }
                            )
                        })
                    })
                }
            } catch (error) {
                console.error('Error al eliminar lead:', error)
                
                // Mostrar notificación de error
                if (typeof window !== 'undefined') {
                    import('@/components/ui/toast').then(({ default: toast }) => {
                        import('@/components/ui/Notification').then(({ default: Notification }) => {
                            toast.push(
                                <Notification type="danger">
                                    {error instanceof Error ? error.message : 'Error al eliminar el lead'}
                                </Notification>,
                                { placement: 'top-center' }
                            )
                        })
                    })
                }
            } finally {
                // Cerrar el diálogo y limpiar el estado
                setDeleteDialogOpen(false)
                setLeadToDelete(null)
            }
        }
    }

    // Cancelar eliminación
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false)
        setLeadToDelete(null)
    }

    // Componente para mostrar el icono del tipo de propiedad
    const PropertyTypeIcon = ({ type }: { type: string }) => {
        switch (type?.toLowerCase()) {
            case 'casa':
            case 'house':
                return <TbHome className="text-lg mr-2" />
            case 'apartamento':
            case 'apartment':
                return <MdOutlineApartment className="text-lg mr-2" />
            case 'terreno':
            case 'land':
                return <TbMap className="text-lg mr-2" />
            case 'local comercial':
            case 'commercial':
            case 'oficina':
            case 'office':
                return <TbBuildingSkyscraper className="text-lg mr-2" />
            default:
                return <TbHome className="text-lg mr-2" />
        }
    }

    // Componente para mostrar el tipo de propiedad
    const PropertyTypeColumn = ({
        propertyType,
    }: {
        propertyType?: string
    }) => {
        if (!propertyType)
            return <span className="text-gray-400">No especificado</span>

        return (
            <div className="flex items-center">
                <PropertyTypeIcon type={propertyType} />
                <span>{propertyType}</span>
            </div>
        )
    }

    // Componente para mostrar la ubicación
    const LocationColumn = ({
        preferredZones,
    }: {
        preferredZones?: string[]
    }) => {
        if (!preferredZones || preferredZones.length === 0) {
            return <span className="text-gray-400">No especificada</span>
        }

        return (
            <div className="flex flex-wrap gap-1">
                {preferredZones.map((zone, index) => (
                    <Tag
                        key={index}
                        className="bg-indigo-100 text-indigo-600 dark:bg-indigo-100 dark:text-indigo-600"
                    >
                        {zone}
                    </Tag>
                ))}
            </div>
        )
    }

    // Definición de columnas para la tabla
    const tableColumns: ColumnDef<TicketWithStatus>[] = useMemo(
        () => [
            {
                header: t('list.columns.name', { defaultValue: 'Nombre' }),
                accessorKey: 'name',
                cell: (props) => {
                    const row = props.row.original
                    return <NameColumn row={row} />
                },
            },
            {
                header: t('list.columns.status', { defaultValue: 'Estado' }),
                accessorKey: 'status',
                cell: (props) => {
                    const status = props.row.original.status || ''
                    let statusColor = 'bg-gray-200 text-gray-900'

                    // Asignar colores según estado
                    if (
                        status ===
                            t('columns.defaultNames.toDo', {
                                defaultValue: 'Por Hacer',
                            }) ||
                        status === 'toDo'
                    ) {
                        statusColor = 'bg-blue-200 text-gray-900'
                    } else if (
                        status ===
                            t('columns.defaultNames.inProgress', {
                                defaultValue: 'En Progreso',
                            }) ||
                        status === 'inProgress'
                    ) {
                        statusColor = 'bg-amber-200 text-gray-900'
                    } else if (
                        status ===
                            t('columns.defaultNames.toReview', {
                                defaultValue: 'Para Revisar',
                            }) ||
                        status === 'toReview'
                    ) {
                        statusColor = 'bg-purple-200 text-gray-900'
                    } else if (
                        status ===
                            t('columns.defaultNames.completed', {
                                defaultValue: 'Completado',
                            }) ||
                        status === 'completed'
                    ) {
                        statusColor = 'bg-green-200 text-gray-900'
                    } else if (status === confirmedText) {
                        statusColor = 'bg-emerald-200 text-emerald-900'
                    } else if (status === closedText) {
                        statusColor = 'bg-red-200 text-red-900'
                    }

                    return <Tag className={statusColor}>{status}</Tag>
                },
            },
            {
                header: 'Propiedad',
                accessorKey: 'propertyType',
                cell: (props) => {
                    const lead = props.row.original as Lead
                    const propertyType = lead.metadata?.propertyType
                    return <PropertyTypeColumn propertyType={propertyType} />
                },
            },
            {
                header: 'Ubicación',
                accessorKey: 'location',
                cell: (props) => {
                    const lead = props.row.original as Lead
                    const preferredZones = lead.metadata?.preferredZones
                    return <LocationColumn preferredZones={preferredZones} />
                },
            },
            {
                header: t('list.columns.labels', { defaultValue: 'Etiquetas' }),
                accessorKey: 'labels',
                cell: (props) => {
                    const { labels } = props.row.original
                    if (!labels || labels.length === 0) return null
                    return <LabelsColumn labels={labels} />
                },
            },
            {
                header: 'Asignado a',
                accessorKey: 'members',
                cell: (props) => {
                    const { members } = props.row.original
                    if (!members || members.length === 0)
                        return (
                            <span className="text-gray-400">No asignado</span>
                        )
                    return <MembersColumn members={members} />
                },
            },
            {
                header: 'Interacciones',
                id: 'interactions',
                cell: (props) => {
                    const { comments, attachments } = props.row.original
                    const hasComments = comments && comments.length > 0
                    const hasAttachments = attachments && attachments.length > 0

                    if (!hasComments && !hasAttachments) {
                        return (
                            <span className="text-gray-400">
                                Sin interacciones
                            </span>
                        )
                    }

                    return (
                        <div className="flex items-center gap-3">
                            {hasComments && (
                                <div className="flex items-center gap-1">
                                    <TbMessageCircle className="text-base" />
                                    <span>{comments.length}</span>
                                </div>
                            )}
                            {hasAttachments && (
                                <div className="flex items-center gap-1">
                                    <TbPaperclip className="text-base" />
                                    <span>{attachments.length}</span>
                                </div>
                            )}
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
                        onDelete={() => handleDeleteConfirmation(props.row.original)}
                    />
                ),
            },
        ],
        [t, confirmedText, closedText],
    )

    // Manejadores para la tabla
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

    return (
        <>
            <DataTable
                columns={tableColumns}
                data={allTickets}
                noData={allTickets.length === 0}
                skeletonAvatarColumns={[0, 3]}
                skeletonAvatarProps={{ width: 28, height: 28 }}
                loading={false}
                pagingData={{
                    total: allTickets.length,
                    pageIndex: 1,
                    pageSize: 10,
                }}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectChange}
                onSort={handleSort}
            />
            
            {/* Diálogo de confirmación para eliminar leads */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                type="danger"
                title="Eliminar prospecto"
                confirmButtonColor="red-600"
                confirmText="Eliminar"
                cancelText="Cancelar"
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    ¿Está seguro de que desea eliminar este prospecto? Esta acción no se puede deshacer
                    y todos los datos asociados se perderán permanentemente.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default LeadsList
