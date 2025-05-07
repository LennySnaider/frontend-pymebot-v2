/**
 * frontend/src/app/(protected-pages)/superadmin/verticals-manager/_components/VerticalTypeCloneModal.tsx
 * Modal para clonar configuraciones entre tipos de verticales
 * @version 1.0.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    Button,
    Select,
    Avatar,
    toast,
    Notification,
    Card,
    Badge,
} from '@/components/ui'
import {
    VerticalType,
    useVerticalTypesStore,
} from '../_store/verticalTypesStore'
import {
    PiCopyBold,
    PiWarningCircleBold,
    PiArrowRight,
    PiInfoBold,
    PiBuildings,
    PiBuilding,
    PiHouse,
    PiStorefront,
    PiUser,
    PiUsers,
    PiCalendar,
    PiClock,
    PiTag,
    PiStar,
    PiQuestion,
} from 'react-icons/pi'

interface VerticalTypeCloneModalProps {
    isOpen: boolean
    onClose: () => void
    sourceType: VerticalType | null
}

const VerticalTypeCloneModal = ({
    isOpen,
    onClose,
    sourceType,
}: VerticalTypeCloneModalProps) => {
    const { types, cloneTypeSettings } = useVerticalTypesStore()

    // Función para renderizar el ícono correcto basado en el nombre
    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case 'building':
                return <PiBuilding />
            case 'buildings':
                return <PiBuildings />
            case 'house':
                return <PiHouse />
            case 'storefront':
                return <PiStorefront />
            case 'user':
                return <PiUser />
            case 'users':
                return <PiUsers />
            case 'calendar':
                return <PiCalendar />
            case 'clock':
                return <PiClock />
            case 'tag':
                return <PiTag />
            case 'star':
                return <PiStar />
            default:
                return <PiQuestion />
        }
    }
    const [loading, setLoading] = useState(false)
    const [targetTypeId, setTargetTypeId] = useState<string>('')
    const [targetType, setTargetType] = useState<VerticalType | null>(null)
    const [showConfirmation, setShowConfirmation] = useState(false)

    // Filtrar tipos disponibles (todos excepto el tipo de origen)
    const availableTypes = types.filter((type) => type.id !== sourceType?.id)

    const targetTypeOptions = availableTypes.map((type) => ({
        value: type.id,
        label: `${type.name} (${type.vertical_name || 'Sin vertical'})`,
        vertical_name: type.vertical_name,
        settings_count: Object.keys(type.default_settings || {}).length,
    }))

    // Actualizar targetType cuando cambia la selección
    useEffect(() => {
        if (targetTypeId) {
            const selected =
                types.find((type) => type.id === targetTypeId) || null
            setTargetType(selected)
        } else {
            setTargetType(null)
        }
    }, [targetTypeId, types])

    // Verificar si el tipo destino tiene configuraciones que serán sobrescritas
    const hasTargetSettings =
        targetType && Object.keys(targetType.default_settings || {}).length > 0

    // Contar configuraciones en el tipo origen
    const sourceSettingsCount = sourceType
        ? Object.keys(sourceType.default_settings || {}).length
        : 0

    // Preparar configuraciones para mostrar como preview
    const sourceSettingsPreview = sourceType
        ? Object.entries(sourceType.default_settings || {}).map(
              ([key, config]) => ({
                  key,
                  label: config.label || key,
                  type: config.type || 'string',
                  preview: getSettingPreview(config.value, config.type),
              }),
          )
        : []

    // Obtener un preview legible del valor de una configuración
    function getSettingPreview(value: any, type: string = 'string'): string {
        if (value === undefined || value === null) return 'Sin valor'

        switch (type) {
            case 'boolean':
                return value ? 'Sí' : 'No'
            case 'json':
                return typeof value === 'object'
                    ? JSON.stringify(value).substring(0, 30) +
                          (JSON.stringify(value).length > 30 ? '...' : '')
                    : String(value)
            default:
                return (
                    String(value).substring(0, 30) +
                    (String(value).length > 30 ? '...' : '')
                )
        }
    }

    // Manejar acción de clonar configuraciones
    const handleClone = async () => {
        if (!sourceType || !targetTypeId) {
            toast.push(
                <Notification title="Error" type="danger">
                    Seleccione un tipo de destino
                </Notification>,
            )
            return
        }

        // Si tiene configuraciones y no se ha confirmado, mostrar confirmación
        if (hasTargetSettings && !showConfirmation) {
            setShowConfirmation(true)
            return
        }

        setLoading(true)
        try {
            await cloneTypeSettings(sourceType.id, targetTypeId)

            toast.push(
                <Notification title="Éxito" type="success">
                    Configuraciones clonadas correctamente
                </Notification>,
            )

            onClose()
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al clonar configuraciones
                </Notification>,
            )
        } finally {
            setLoading(false)
            setShowConfirmation(false)
        }
    }

    // Si no hay tipo de origen, no mostrar nada
    if (!sourceType) return null

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            title="Clonar Configuraciones"
            contentClassName="max-w-xl"
        >
            <div className="mb-4">
                {showConfirmation ? (
                    <Card className="border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4">
                        <div className="flex items-start">
                            <div className="mr-3 text-amber-500 mt-1">
                                <PiWarningCircleBold size={24} />
                            </div>
                            <div>
                                <h6 className="text-amber-600 dark:text-amber-400">
                                    Confirmación requerida
                                </h6>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    El tipo de destino{' '}
                                    <strong>{targetType?.name}</strong> ya tiene{' '}
                                    {
                                        Object.keys(
                                            targetType?.default_settings || {},
                                        ).length
                                    }{' '}
                                    configuraciones que serán sobrescritas.
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                                    ¿Está seguro de que desea continuar?
                                </p>
                                <div className="mt-3 flex justify-end space-x-2">
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={() =>
                                            setShowConfirmation(false)
                                        }
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        color="amber"
                                        onClick={handleClone}
                                        loading={loading}
                                    >
                                        Confirmar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Esta herramienta le permite clonar todas las
                            configuraciones desde{' '}
                            <strong>{sourceType.name}</strong> a otro tipo de
                            vertical.
                        </p>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Origen */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Origen
                                </label>
                                <Card className="p-3" bordered>
                                    <div className="flex items-center">
                                        <Avatar
                                            size={36}
                                            shape="circle"
                                            icon={renderIcon(
                                                sourceType.icon || 'building',
                                            )}
                                            className="mr-3"
                                        />
                                        <div>
                                            <div className="font-medium">
                                                {sourceType.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {sourceType.vertical_name} /{' '}
                                                <code>{sourceType.code}</code>
                                            </div>
                                        </div>
                                        <div className="ml-auto">
                                            <Badge className="bg-blue-500">
                                                {sourceSettingsCount}{' '}
                                                configuraciones
                                            </Badge>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Flechas de dirección */}
                            <div className="flex justify-center text-gray-400">
                                <PiArrowRight size={24} />
                            </div>

                            {/* Destino */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Destino
                                </label>
                                <Select
                                    placeholder="Seleccione un tipo de destino..."
                                    options={targetTypeOptions}
                                    value={targetTypeOptions.find(
                                        (option) =>
                                            option.value === targetTypeId,
                                    )}
                                    onChange={(selected) => {
                                        setTargetTypeId(selected?.value || '')
                                        setShowConfirmation(false)
                                    }}
                                    renderOption={(option) => (
                                        <div className="flex justify-between items-center w-full">
                                            <div>{option.label}</div>
                                            {option.settings_count > 0 && (
                                                <Badge className="bg-gray-400">
                                                    {option.settings_count}{' '}
                                                    config.
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                />
                                {targetType && hasTargetSettings && (
                                    <div className="mt-2 text-xs text-amber-500 flex items-center">
                                        <PiWarningCircleBold className="mr-1" />
                                        Este tipo ya tiene{' '}
                                        {
                                            Object.keys(
                                                targetType.default_settings ||
                                                    {},
                                            ).length
                                        }{' '}
                                        configuraciones que serán sobrescritas
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vista previa de configuraciones a clonar */}
                        <div className="mt-6">
                            <div className="flex items-center mb-2">
                                <h6 className="text-sm font-medium">
                                    Configuraciones a clonar
                                </h6>
                                <Badge className="ml-2 bg-blue-500">
                                    {sourceSettingsPreview.length}
                                </Badge>
                            </div>

                            {sourceSettingsPreview.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">
                                    No hay configuraciones para clonar
                                </div>
                            ) : (
                                <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                                    <table className="w-full text-sm">
                                        <thead className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="p-2 text-left">
                                                    Clave
                                                </th>
                                                <th className="p-2 text-left">
                                                    Etiqueta
                                                </th>
                                                <th className="p-2 text-left">
                                                    Tipo
                                                </th>
                                                <th className="p-2 text-left">
                                                    Valor
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sourceSettingsPreview.map(
                                                (setting, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    >
                                                        <td className="p-2">
                                                            <code className="text-xs">
                                                                {setting.key}
                                                            </code>
                                                        </td>
                                                        <td className="p-2">
                                                            {setting.label}
                                                        </td>
                                                        <td className="p-2">
                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                                {setting.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-xs truncate max-w-[120px]">
                                                            {setting.preview}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Nota informativa */}
                        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex items-start">
                            <PiInfoBold className="mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p>
                                Al clonar, todas las configuraciones del tipo de
                                origen se copiarán al tipo de destino. Si el
                                tipo de destino ya tiene configuraciones, serán
                                reemplazadas.
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-end space-x-2">
                <Button variant="plain" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="solid"
                    color="blue"
                    icon={<PiCopyBold />}
                    onClick={handleClone}
                    loading={loading}
                    disabled={!targetTypeId || showConfirmation}
                >
                    Clonar Configuraciones
                </Button>
            </div>
        </Dialog>
    )
}

export default VerticalTypeCloneModal
