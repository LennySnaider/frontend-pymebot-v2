'use client'

/**
 * frontend/src/app/(protected-pages)/superadmin/verticals-manager/_components/VerticalTypesManager.tsx
 * Componente para la gestión avanzada de tipos de verticales
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React, { useState, useEffect } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { Button, Badge, toast, Notification, Select } from '@/components/ui'
import DataTable from '@/components/shared/DataTable'
import { Vertical } from '@/app/(protected-pages)/superadmin/subscription-plans/_store/verticalsStore'
import { VerticalType, useVerticalTypesStore } from '../_store/verticalTypesStore'
import VerticalTypeFormModal from './VerticalTypeFormModal'
import VerticalTypeSettingsModal from './VerticalTypeSettingsModal'
import VerticalTypeCloneModal from './VerticalTypeCloneModal'
import {
    PiPlusBold,
    PiPencilSimpleBold,
    PiTrashSimpleBold,
    PiArrowsCounterClockwiseBold,
    PiGearSixBold,
    PiCopyBold,
    PiBuilding,
    PiBuildings,
    PiHouse,
    PiStorefront,
    PiUser,
    PiUsers,
    PiCalendar,
    PiClock,
    PiTag,
    PiStar,
    PiQuestion
} from 'react-icons/pi'

interface VerticalTypesManagerProps {
    verticals: Vertical[]
}

const VerticalTypesManager = ({ verticals }: VerticalTypesManagerProps) => {
    const [selectedVerticalId, setSelectedVerticalId] = useState<string>('')
    const [isFormModalOpen, setIsFormModalOpen] = useState(false)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    const [isCloningModalOpen, setIsCloningModalOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<VerticalType | null>(null)
    
    // Función para renderizar el ícono correcto
    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case 'building':
                return <PiBuilding />;
            case 'buildings':
                return <PiBuildings />;
            case 'house':
                return <PiHouse />;
            case 'storefront':
                return <PiStorefront />;
            case 'user':
                return <PiUser />;
            case 'users':
                return <PiUsers />;
            case 'calendar':
                return <PiCalendar />;
            case 'clock':
                return <PiClock />;
            case 'tag':
                return <PiTag />;
            case 'star':
                return <PiStar />;
            default:
                return <PiQuestion />;
        }
    }
    
    const { 
        types, 
        typesGroupedByVertical, 
        loading, 
        error,
        fetchTypes,
        fetchTypesByVertical,
        deleteType
    } = useVerticalTypesStore()
    
    // Cargar todos los tipos al montar el componente
    useEffect(() => {
        const loadTypes = async () => {
            try {
                await fetchTypes()
                
                // Si hay verticales, seleccionar la primera por defecto
                if (verticals && verticals.length > 0 && !selectedVerticalId) {
                    setSelectedVerticalId(verticals[0].id)
                }
            } catch (error) {
                console.error('Error al cargar tipos:', error)
                toast.push(
                    <Notification title="Error" type="danger">
                        Error al cargar los tipos. Intente nuevamente más tarde.
                    </Notification>
                )
            }
        }
        
        loadTypes()
    }, [fetchTypes, verticals])
    
    // Obtener los tipos filtrados por la vertical seleccionada
    const filteredTypes = selectedVerticalId ? (typesGroupedByVertical[selectedVerticalId] || []) : types
    
    // Opciones para el selector de verticales
    const verticalOptions = verticals.map(vertical => ({
        value: vertical.id,
        label: vertical.name
    }))
    
    // Manejadores
    const handleVerticalChange = (selected: any) => {
        setSelectedVerticalId(selected?.value || '')
    }
    
    const handleCreate = () => {
        // Inicializar con la vertical seleccionada
        setSelectedType({
            id: '',
            vertical_id: selectedVerticalId,
            name: '',
            code: '',
            description: '',
            icon: 'building',
            default_settings: {},
            is_active: true,
            created_at: '',
            updated_at: '',
            vertical_name: verticals.find(v => v.id === selectedVerticalId)?.name,
            vertical_code: verticals.find(v => v.id === selectedVerticalId)?.code
        })
        setIsFormModalOpen(true)
    }
    
    const handleEdit = (type: VerticalType) => {
        setSelectedType(type)
        setIsFormModalOpen(true)
    }
    
    const handleSettings = (type: VerticalType) => {
        setSelectedType(type)
        setIsSettingsModalOpen(true)
    }
    
    const handleClone = (type: VerticalType) => {
        setSelectedType(type)
        setIsCloningModalOpen(true)
    }
    
    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Está seguro de que desea eliminar este tipo de vertical?')) {
            return
        }
        
        try {
            await deleteType(id)
            toast.push(
                <Notification title="Éxito" type="success">
                    Tipo eliminado correctamente
                </Notification>
            )
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al eliminar el tipo
                </Notification>
            )
        }
    }
    
    const handleReload = async () => {
        try {
            if (selectedVerticalId) {
                await fetchTypesByVertical(selectedVerticalId)
            } else {
                await fetchTypes()
            }
            
            toast.push(
                <Notification title="Éxito" type="success">
                    Tipos actualizados correctamente
                </Notification>
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
                <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full mr-2 text-xl">
                        {renderIcon(row.original.icon || "building")}
                    </div>
                    <div>
                        <div className="font-medium">{row.original.name}</div>
                        <div className="text-xs text-gray-500">
                            {row.original.vertical_name}
                        </div>
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
            header: 'Configuraciones',
            accessorKey: 'default_settings',
            cell: ({ row }) => {
                const settingsCount = Object.keys(row.original.default_settings || {}).length
                return (
                    <Badge
                        content={`${settingsCount} configuraciones`}
                        className={
                            settingsCount > 0
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                        }
                    />
                )
            },
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<PiGearSixBold />}
                        onClick={() => handleSettings(row.original)}
                        title="Configurar tipo"
                    />
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<PiCopyBold />}
                        onClick={() => handleClone(row.original)}
                        title="Clonar configuración"
                    />
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<PiPencilSimpleBold />}
                        onClick={() => handleEdit(row.original)}
                        title="Editar tipo"
                    />
                    <Button
                        size="xs"
                        variant="plain"
                        color="red"
                        icon={<PiTrashSimpleBold />}
                        onClick={() => handleDelete(row.original.id)}
                        title="Eliminar tipo"
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
                    content: <h4>Gestión de Tipos de Verticales</h4>,
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
                                disabled={!selectedVerticalId}
                            >
                                Nuevo Tipo
                            </Button>
                        </div>
                    ),
                }}
            >
                <div className="p-4 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <label htmlFor="vertical-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Filtrar por Vertical
                            </label>
                            <Select
                                id="vertical-select"
                                options={verticalOptions}
                                value={verticalOptions.find(
                                    option => option.value === selectedVerticalId
                                )}
                                onChange={handleVerticalChange}
                                placeholder="Seleccionar vertical..."
                            />
                        </div>
                    </div>
                </div>
                
                <DataTable
                    columns={columns}
                    data={filteredTypes}
                    loading={loading}
                    skeletonAvatarColumns={[0]}
                    skeletonAvatarProps={{ width: 32, height: 32 }}
                />
                
                {filteredTypes.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                        {selectedVerticalId
                            ? 'No hay tipos definidos para esta vertical. Cree uno nuevo con el botón "Nuevo Tipo".'
                            : 'Seleccione una vertical para ver sus tipos.'}
                    </div>
                )}

                {error && (
                    <div className="p-4 text-center text-red-500">{error}</div>
                )}
            </AdaptiveCard>
            
            {/* Modal de formulario para crear/editar tipos */}
            {isFormModalOpen && (
                <VerticalTypeFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    verticalType={selectedType}
                    verticals={verticals}
                />
            )}
            
            {/* Modal para gestionar configuraciones del tipo */}
            {isSettingsModalOpen && (
                <VerticalTypeSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    verticalType={selectedType}
                />
            )}
            
            {/* Modal para clonar configuraciones */}
            {isCloningModalOpen && selectedType && (
                <VerticalTypeCloneModal
                    isOpen={isCloningModalOpen}
                    onClose={() => setIsCloningModalOpen(false)}
                    sourceType={selectedType}
                />
            )}
        </>
    )
}

export default VerticalTypesManager
