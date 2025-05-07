/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_components/PropertyListTable.tsx
 * Componente para mostrar la tabla de propiedades inmobiliarias.
 * Incluye opciones para ver, editar y eliminar propiedades.
 *
 * @version 2.0.0
 * @updated 2025-06-12
 */

'use client'

import { useMemo, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Tooltip from '@/components/ui/Tooltip'
import DataTable from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import usePropertyListStore from '../_store/propertyListStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { useRouter } from 'next/navigation'
import {
    TbPencil,
    TbTrash,
    TbHome,
    TbBuilding,
    TbBuildingStore,
    TbBuildingSkyscraper,
    TbBuildingWarehouse,
    TbEye,
} from 'react-icons/tb'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'
import { NumericFormat } from 'react-number-format'
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { Property, PropertyType } from '../types'

type PropertyListTableProps = {
    propertyListTotal: number
    pageIndex?: number
    pageSize?: number
}

// Función para obtener el ícono según el tipo de propiedad
const getPropertyIcon = (type: PropertyType) => {
    switch (type) {
        case 'house':
            return <TbHome />
        case 'apartment':
            return <TbBuilding />
        case 'commercial':
            return <TbBuildingStore />
        case 'office':
            return <HiOutlineOfficeBuilding />
        case 'industrial':
            return <TbBuildingWarehouse />
        case 'land':
            return <TbBuildingSkyscraper />
        default:
            return <TbHome />
    }
}

// Función para obtener el nombre del tipo de propiedad en español
const getPropertyTypeName = (type: PropertyType) => {
    switch (type) {
        case 'house':
            return 'Casa'
        case 'apartment':
            return 'Departamento'
        case 'commercial':
            return 'Local Comercial'
        case 'office':
            return 'Oficina'
        case 'industrial':
            return 'Industrial'
        case 'land':
            return 'Terreno'
        default:
            return type
    }
}

// Función para obtener el color de badge según el estado de la propiedad
const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'available':
            return 'success'
        case 'sold':
            return 'danger'
        case 'rented':
            return 'warning'
        case 'pending':
            return 'primary'
        case 'reserved':
            return 'info'
        default:
            return 'default'
    }
}

// Función para obtener el nombre del estado en español
const getStatusName = (status: string) => {
    switch (status) {
        case 'available':
            return 'Disponible'
        case 'sold':
            return 'Vendida'
        case 'rented':
            return 'Rentada'
        case 'pending':
            return 'Pendiente'
        case 'reserved':
            return 'Reservada'
        default:
            return status
    }
}

const PropertyColumn = ({ row }: { row: Property }) => {
    // Agregamos comprobaciones para evitar acceder a propiedades de undefined
    const propertyIcon = getPropertyIcon(row.propertyType || 'house')
    const media = row.media || []
    const primaryImage = media.find((m) => m?.isPrimary)?.url || media[0]?.url

    return (
        <div className="flex items-center gap-2">
            <Avatar
                shape="round"
                size={60}
                src={primaryImage}
                icon={!primaryImage ? propertyIcon : undefined}
            />
            <div>
                <div
                    className="font-bold heading-text mb-1 hover:text-primary cursor-pointer"
                    onClick={() => {
                        // Usar la instancia de router para navegar a la página de detalles
                        // Necesitamos window.location debido al scope de la función
                        window.location.href = `/modules/properties/property-details/${row.id}`
                    }}
                >
                    {row.name}
                </div>
                <div className="flex items-center">
                    <span className="text-xs">
                        ID: {row.propertyCode || 'N/A'}
                    </span>
                    <span className="mx-2 text-xs text-gray-500">•</span>
                    <span className="text-xs">
                        {getPropertyTypeName(row.propertyType || 'house')}
                    </span>
                </div>
            </div>
        </div>
    )
}

const ActionColumn = ({
    onView,
    onEdit,
    onDelete,
}: {
    onView: () => void
    onEdit: () => void
    onDelete: () => void
}) => {
    return (
        <div className="flex items-center justify-end gap-3">
            <Tooltip title="Ver detalles">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold`}
                    role="button"
                    onClick={onView}
                >
                    <TbEye />
                </div>
            </Tooltip>
            <Tooltip title="Editar">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold`}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Eliminar">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold`}
                    role="button"
                    onClick={onDelete}
                >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    )
}

const PropertyListTable = ({
    propertyListTotal = 0,
    pageIndex = 1,
    pageSize = 10,
}: PropertyListTableProps) => {
    const router = useRouter()

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [toDeleteId, setToDeleteId] = useState('')

    // Obtener referencias directas al estado sin crear nuevos objetos/arrays
    const storeState = usePropertyListStore()
    const propertyList = storeState.propertyList || []
    const selectedProperties = storeState.selectedProperties || []
    const setSelectAllProperties = storeState.setSelectAllProperties
    const setPropertyList = storeState.setPropertyList
    const setSelectedProperty = storeState.setSelectedProperty
    const initialLoading = storeState.initialLoading

    const { onAppendQueryParams } = useAppendQueryParams()

    const handleCancel = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleDelete = (property: Property) => {
        setDeleteConfirmationOpen(true)
        setToDeleteId(property.id)
    }

    const handleView = (property: Property) => {
        router.push(`/modules/properties/property-details/${property.id}`)
    }

    const handleEdit = (property: Property) => {
        router.push(`/modules/properties/property-edit/${property.id}`)
    }

    const handleConfirmDelete = async () => {
        try {
            // Mostrar un indicador de carga para mejorar la experiencia de usuario
            storeState.setLoading(true)

            // Verificar que tenemos un ID válido para eliminar
            if (!toDeleteId) {
                console.error('Error: No hay ID para eliminar')
                throw new Error('No se especificó un ID para eliminar')
            }

            console.log(
                `Iniciando eliminación de propiedad con ID: ${toDeleteId}`,
            )

            // Llamar a la acción de servidor para eliminar la propiedad
            const result = await storeState.deleteData(toDeleteId)

            if (!result || !result.success) {
                throw new Error(
                    result?.error || 'Error al eliminar la propiedad',
                )
            }

            console.log(
                `Propiedad ${toDeleteId} eliminada correctamente del servidor`,
            )

            // Actualizar la UI solo después de confirmar eliminación en servidor
            const newPropertyList = propertyList.filter((property) => {
                return property.id !== toDeleteId
            })

            // Limpiar selecciones
            setSelectAllProperties([])

            // Actualizar la lista local
            setPropertyList(newPropertyList)

            // Cerrar el diálogo
            setDeleteConfirmationOpen(false)
            setToDeleteId('')

            // Recargar la lista completa para asegurar la sincronización
            storeState.getData()
        } catch (error) {
            console.error('Error al eliminar propiedad:', error)
            // Podríamos mostrar una notificación de error aquí
        } finally {
            storeState.setLoading(false)
        }
    }

    const columns: ColumnDef<Property>[] = useMemo(
        () => [
            {
                header: 'Propiedad',
                accessorKey: 'name',
                cell: (props) => {
                    const row = props.row.original
                    return <PropertyColumn row={row} />
                },
            },
            {
                header: 'Ubicación',
                accessorKey: 'location.city',
                cell: (props) => {
                    const { location } = props.row.original
                    return (
                        <div>
                            <div className="font-medium">
                                {location?.city || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {location?.state || ''}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Precio',
                accessorKey: 'price',
                cell: (props) => {
                    const {
                        price = 0,
                        currency = 'MXN',
                        operationType = 'sale',
                    } = props.row.original
                    return (
                        <div>
                            <div className="font-bold heading-text">
                                <NumericFormat
                                    displayType="text"
                                    value={price}
                                    thousandSeparator={true}
                                    prefix={
                                        currency === 'USD'
                                            ? '$'
                                            : currency === 'EUR'
                                              ? '€'
                                              : '$'
                                    }
                                    decimalScale={0}
                                />
                            </div>
                            <div className="text-xs text-gray-500">
                                {operationType === 'rent'
                                    ? 'Renta mensual'
                                    : 'Venta'}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Características',
                accessorKey: 'features',
                cell: (props) => {
                    const features = props.row.original.features || {
                        bedrooms: 0,
                        bathrooms: 0,
                        area: 0,
                    }
                    return (
                        <div className="flex gap-3">
                            {(features?.bedrooms ?? 0) > 0 && (
                                <div className="flex items-center">
                                    <span className="font-medium">
                                        {features?.bedrooms}
                                    </span>
                                    <span className="ml-1 text-xs text-gray-500">
                                        hab
                                    </span>
                                </div>
                            )}
                            {(features?.bathrooms ?? 0) > 0 && (
                                <div className="flex items-center">
                                    <span className="font-medium">
                                        {features.bathrooms}
                                    </span>
                                    <span className="ml-1 text-xs text-gray-500">
                                        baños
                                    </span>
                                </div>
                            )}
                            {(features?.area ?? 0) > 0 && (
                                <div className="flex items-center">
                                    <span className="font-medium">
                                        {features?.area}
                                    </span>
                                    <span className="ml-1 text-xs text-gray-500">
                                        m²
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                header: 'Estado',
                accessorKey: 'status',
                cell: (props) => {
                    const status = props.row.original.status || 'available'
                    return (
                        <div>
                            <Badge
                                className="mr-2"
                                content={getStatusName(status)}
                                color={getStatusBadgeColor(status)}
                            />
                        </div>
                    )
                },
            },
            {
                header: '',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleView(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
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

    const handleRowSelect = (checked: boolean, row: Property) => {
        setSelectedProperty(checked, row)
    }

    const handleAllRowSelect = (checked: boolean, rows: Row<Property>[]) => {
        if (checked) {
            const originalRows = rows.map((row) => row.original)
            setSelectAllProperties(originalRows)
        } else {
            setSelectAllProperties([])
        }
    }

    // Verificación adicional para protegernos contra un estado inicial nulo
    if (!storeState) {
        return <div>Cargando...</div>
    }

    return (
        <>
            <div suppressHydrationWarning>
                <DataTable
                    selectable
                    columns={columns}
                    data={propertyList}
                    noData={!propertyList || propertyList.length === 0}
                    skeletonAvatarColumns={[0]}
                    skeletonAvatarProps={{ width: 28, height: 28 }}
                    loading={initialLoading}
                    pagingData={{
                        total: propertyListTotal,
                        pageIndex,
                        pageSize,
                    }}
                    checkboxChecked={(row) =>
                        selectedProperties.some(
                            (selected) => selected?.id === row.id,
                        )
                    }
                    onPaginationChange={handlePaginationChange}
                    onSelectChange={handleSelectChange}
                    onSort={handleSort}
                    onCheckBoxChange={handleRowSelect}
                    onIndeterminateCheckBoxChange={handleAllRowSelect}
                />
            </div>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Eliminar propiedad"
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    ¿Estás seguro que deseas eliminar esta propiedad? Esta
                    acción no se puede deshacer.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default PropertyListTable
