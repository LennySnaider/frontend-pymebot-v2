/**
 * frontend/src/app/(protected-pages)/superadmin/verticals-manager/_components/VerticalTypeSettingsModal.tsx
 * Modal para gestionar las configuraciones de cada tipo de vertical
 * @version 1.1.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    Button,
    Input,
    Select,
    Switcher,
    Card,
    Avatar,
    toast,
    Notification,
} from '@/components/ui'
import {
    VerticalType,
    useVerticalTypesStore,
} from '../_store/verticalTypesStore'
import {
    PiPlus,
    PiTrash,
    PiCheck,
    PiX,
    PiWarningCircle,
    PiQuestion,
    PiPencilSimpleBold,
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
} from 'react-icons/pi'

interface VerticalTypeSettingsModalProps {
    isOpen: boolean
    onClose: () => void
    verticalType: VerticalType | null
}

// Tipos para las configuraciones
type SettingValue = string | number | boolean | Record<string, any>

interface TypeSetting {
    key: string
    label: string
    type: 'string' | 'number' | 'boolean' | 'json' | 'select'
    value: SettingValue
    options?: { label: string; value: string }[] // Para tipo select
    description?: string
    category?: string // Categoría para agrupar configuraciones
    importance?: 'low' | 'medium' | 'high' // Importancia de la configuración
}

interface SelectOption {
    label: string
    value: string
}

const VerticalTypeSettingsModal = ({
    isOpen,
    onClose,
    verticalType,
}: VerticalTypeSettingsModalProps) => {
    // Función para renderizar el ícono correcto basado en el nombre
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
    };
    const [settings, setSettings] = useState<TypeSetting[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [newSetting, setNewSetting] = useState<TypeSetting>({
        key: '',
        label: '',
        type: 'string',
        value: '',
        description: '',
        category: 'general',
        importance: 'medium',
    })
    const [showNewSettingForm, setShowNewSettingForm] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)
    const [settingsModified, setSettingsModified] = useState(false)
    const [selectOptions, setSelectOptions] = useState<SelectOption[]>([])
    const [newOption, setNewOption] = useState<SelectOption>({
        label: '',
        value: '',
    })

    const { updateType } = useVerticalTypesStore()

    // Cargar configuraciones del tipo
    useEffect(() => {
        if (verticalType) {
            // Convertir objeto de configuraciones a array de configuraciones
            const settingsArray: TypeSetting[] = []

            Object.entries(verticalType.default_settings || {}).forEach(
                ([key, config]) => {
                    settingsArray.push({
                        key,
                        label: config.label || key,
                        type: config.type || 'string',
                        value: config.value,
                        options: config.options,
                        description: config.description,
                        category: config.category || 'general',
                        importance: config.importance || 'medium',
                    })
                },
            )

            setSettings(settingsArray)
            setSettingsModified(false)
        }
    }, [verticalType])

    // Validar nueva configuración
    const validateNewSetting = () => {
        if (!newSetting.key) return 'La clave es obligatoria'
        if (!newSetting.key.match(/^[a-z0-9_]+$/))
            return 'La clave debe contener solo letras minúsculas, números y guiones bajos'
        if (!newSetting.label) return 'La etiqueta es obligatoria'

        // Verificar si la clave ya existe
        if (
            editingIndex === null &&
            settings.some((s) => s.key === newSetting.key)
        ) {
            return 'Ya existe una configuración con esta clave'
        }

        // Validar opciones para tipo 'select'
        if (
            newSetting.type === 'select' &&
            (!newSetting.options || newSetting.options.length === 0)
        ) {
            return 'Debe añadir al menos una opción para el tipo Selección'
        }

        return null
    }

    // Añadir nueva configuración
    const handleAddSetting = () => {
        const validationError = validateNewSetting()
        if (validationError) {
            toast.push(
                <Notification title="Error" type="danger">
                    {validationError}
                </Notification>,
            )
            return
        }

        // Asegurarse de que las opciones estén incluidas si es tipo select
        const settingToAdd = {
            ...newSetting,
            options: newSetting.type === 'select' ? selectOptions : undefined,
        }

        if (editingIndex !== null) {
            // Editar configuración existente
            const newSettings = [...settings]
            newSettings[editingIndex] = settingToAdd
            setSettings(newSettings)
            setEditingIndex(null)
        } else {
            // Añadir nueva configuración
            setSettings([...settings, settingToAdd])
        }

        // Reset del formulario
        setNewSetting({
            key: '',
            label: '',
            type: 'string',
            value: '',
            description: '',
            category: 'general',
            importance: 'medium',
        })
        setSelectOptions([])
        setNewOption({ label: '', value: '' })
        setShowNewSettingForm(false)
        setSettingsModified(true)
    }

    // Editar configuración existente
    const handleEditSetting = (index: number) => {
        const setting = settings[index]
        setNewSetting(setting)
        if (setting.type === 'select' && setting.options) {
            setSelectOptions(setting.options)
        } else {
            setSelectOptions([])
        }
        setEditingIndex(index)
        setShowNewSettingForm(true)
    }

    // Eliminar configuración
    const handleDeleteSetting = (index: number) => {
        const newSettings = [...settings]
        newSettings.splice(index, 1)
        setSettings(newSettings)
        setSettingsModified(true)
    }

    // Actualizar valor de una configuración
    const handleUpdateSettingValue = (index: number, value: SettingValue) => {
        const newSettings = [...settings]
        newSettings[index].value = value
        setSettings(newSettings)
        setSettingsModified(true)
    }

    // Guardar todos los cambios
    const handleSaveSettings = async () => {
        if (!verticalType) return

        setSaving(true)
        try {
            // Convertir array de configuraciones a objeto
            const defaultSettings: Record<string, any> = {}

            settings.forEach((setting) => {
                defaultSettings[setting.key] = {
                    label: setting.label,
                    type: setting.type,
                    value: setting.value,
                    options: setting.options,
                    description: setting.description,
                    category: setting.category || 'general',
                    importance: setting.importance || 'medium',
                }
            })

            // Actualizar el tipo con las nuevas configuraciones
            await updateType(verticalType.id, {
                default_settings: defaultSettings,
            })

            toast.push(
                <Notification title="Éxito" type="success">
                    Configuraciones guardadas correctamente
                </Notification>,
            )

            setSettingsModified(false)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al guardar las configuraciones
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    // Cancelar edición
    const handleCancelEdit = () => {
        setNewSetting({
            key: '',
            label: '',
            type: 'string',
            value: '',
            description: '',
            category: 'general',
            importance: 'medium',
        })
        setSelectOptions([])
        setNewOption({ label: '', value: '' })
        setEditingIndex(null)
        setShowNewSettingForm(false)
    }

    // Añadir opción para tipo select
    const handleAddOption = () => {
        if (!newOption.label || !newOption.value) {
            toast.push(
                <Notification title="Error" type="danger">
                    La etiqueta y el valor son obligatorios
                </Notification>,
            )
            return
        }

        // Verificar si ya existe esta opción
        if (selectOptions.some((o) => o.value === newOption.value)) {
            toast.push(
                <Notification title="Error" type="danger">
                    Ya existe una opción con este valor
                </Notification>,
            )
            return
        }

        setSelectOptions([...selectOptions, newOption])
        setNewOption({ label: '', value: '' })

        // Si no hay valor seleccionado, establecer el valor por defecto
        if (!newSetting.value && selectOptions.length === 0) {
            setNewSetting({
                ...newSetting,
                value: newOption.value,
            })
        }
    }

    // Eliminar opción
    const handleRemoveOption = (index: number) => {
        const newOptions = [...selectOptions]
        newOptions.splice(index, 1)
        setSelectOptions(newOptions)

        // Si el valor actual ya no está en las opciones, resetear el valor
        if (
            newOptions.length > 0 &&
            !newOptions.some((o) => o.value === newSetting.value)
        ) {
            setNewSetting({
                ...newSetting,
                value: newOptions[0].value,
            })
        } else if (newOptions.length === 0) {
            setNewSetting({
                ...newSetting,
                value: '',
            })
        }
    }

    // Si no hay tipo seleccionado, no mostrar modal
    if (!verticalType) return null

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            contentClassName="max-w-2xl"
        >
            <div className="flex items-center mb-4">
                <Avatar
                    size={40}
                    shape="circle"
                    icon={renderIcon(verticalType.icon || 'building')}
                    className="mr-3"
                />
                <div>
                    <h5 className="mb-0">{verticalType.name}</h5>
                    <div className="text-sm text-gray-500">
                        Configuraciones para{' '}
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                            {verticalType.code}
                        </code>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Las configuraciones definidas aquí serán utilizadas como
                    valores predeterminados para todos los tenants que usen este
                    tipo de vertical.
                </p>
                
                {/* Selector de categorías */}
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Filtrar por categoría</label>
                    <Select
                        size="sm"
                        options={[
                            { value: 'all', label: 'Todas las categorías' },
                            { value: 'general', label: 'General' },
                            { value: 'appearance', label: 'Apariencia' },
                            { value: 'functionality', label: 'Funcionalidad' },
                            { value: 'business', label: 'Negocio' },
                            { value: 'contact', label: 'Contacto' },
                            { value: 'social', label: 'Redes Sociales' },
                            { value: 'advanced', label: 'Avanzado' },
                        ]}
                        value={{
                            value: selectedCategory,
                            label: selectedCategory === 'all' 
                                ? 'Todas las categorías' 
                                : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
                        }}
                        onChange={(option) => setSelectedCategory(option?.value || 'all')}
                    />
                </div>
            </div>

            {/* Lista de configuraciones */}
            <div className="mb-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {settings.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 border border-dashed rounded-lg">
                        No hay configuraciones definidas para este tipo.
                        <br />
                        Añada configuraciones con el botón &quot;Nueva
                        Configuración&quot;.
                    </div>
                ) : (
                    // Filtrar configuraciones por categoría seleccionada
                    settings
                        .filter(setting => selectedCategory === 'all' || setting.category === selectedCategory)
                        .map((setting, index) => {
                            const originalIndex = settings.findIndex(s => s.key === setting.key);
                            return (
                                <Card
                                    key={setting.key}
                                    className="p-3"
                                    bodyClass="p-0"
                                    bordered
                                >
                                    <div className="flex items-start">
                                        <div className="flex-grow">
                                            <div className="flex items-center mb-1">
                                                <h6 className="text-sm font-semibold mb-0 mr-2">
                                                    {setting.label}
                                                </h6>
                                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                                                    {setting.key}
                                                </code>
                                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                    {setting.type}
                                                </span>
                                                
                                                {/* Badge de categoría */}
                                                {setting.category && setting.category !== 'general' && (
                                                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                        {setting.category}
                                                    </span>
                                                )}
                                                
                                                {/* Badge de importancia */}
                                                {setting.importance && (
                                                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded ${
                                                        setting.importance === 'high'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                            : setting.importance === 'medium'
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                                                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                    }`}>
                                                        {setting.importance === 'high' ? 'Alta' : setting.importance === 'medium' ? 'Media' : 'Baja'}
                                                    </span>
                                                )}
                                            </div>

                                            {setting.description && (
                                                <p className="text-xs text-gray-500 mb-2">
                                                    {setting.description}
                                                </p>
                                            )}

                                            {/* Input según el tipo */}
                                            <div>
                                                {setting.type === 'string' && (
                                                    <Input
                                                        value={setting.value as string}
                                                        onChange={(e) =>
                                                            handleUpdateSettingValue(
                                                                index,
                                                                e.target.value,
                                                            )
                                                        }
                                                        size="sm"
                                                    />
                                                )}

                                                {setting.type === 'number' && (
                                                    <Input
                                                        type="number"
                                                        value={setting.value as number}
                                                        onChange={(e) =>
                                                            handleUpdateSettingValue(
                                                                index,
                                                                Number(e.target.value),
                                                            )
                                                        }
                                                        size="sm"
                                                    />
                                                )}

                                                {setting.type === 'boolean' && (
                                                    <Switcher
                                                        checked={
                                                            setting.value as boolean
                                                        }
                                                        onChange={(checked) =>
                                                            handleUpdateSettingValue(
                                                                index,
                                                                checked,
                                                            )
                                                        }
                                                    />
                                                )}

                                                {setting.type === 'select' &&
                                                    setting.options && (
                                                        <Select
                                                            size="sm"
                                                            options={setting.options}
                                                            value={setting.options.find(
                                                                (o) =>
                                                                    o.value ===
                                                                    setting.value,
                                                            )}
                                                            onChange={(option) =>
                                                                handleUpdateSettingValue(
                                                                    index,
                                                                    option?.value || '',
                                                                )
                                                            }
                                                        />
                                                    )}

                                                {setting.type === 'json' && (
                                                    <Input
                                                        textArea
                                                        value={
                                                            typeof setting.value ===
                                                            'object'
                                                                ? JSON.stringify(
                                                                      setting.value,
                                                                      null,
                                                                      2,
                                                                  )
                                                                : (setting.value as string)
                                                        }
                                                        onChange={(e) => {
                                                            try {
                                                                const jsonValue =
                                                                    JSON.parse(
                                                                        e.target.value,
                                                                    )
                                                                handleUpdateSettingValue(
                                                                    index,
                                                                    jsonValue,
                                                                )
                                                            } catch (err) {
                                                                // Si no es JSON válido, guardar como string
                                                                handleUpdateSettingValue(
                                                                    index,
                                                                    e.target.value,
                                                                )
                                                            }
                                                        }}
                                                        size="sm"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex ml-3">
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                icon={<PiPencilSimpleBold />}
                                                onClick={() => handleEditSetting(originalIndex)}
                                                className="mr-1"
                                            />
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                color="red"
                                                icon={<PiTrash />}
                                                onClick={() =>
                                                    handleDeleteSetting(originalIndex)
                                                }
                                            />
                                        </div>
                                    </div>
                                </Card>
                            )
                        })
                )}
            </div>

            {/* Formulario de nueva configuración */}
            {showNewSettingForm ? (
                <Card className="mb-4 p-4" bordered>
                    <h6 className="mb-3">
                        {editingIndex !== null
                            ? 'Editar Configuración'
                            : 'Nueva Configuración'}
                    </h6>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Clave
                            </label>
                            <Input
                                value={newSetting.key}
                                onChange={(e) =>
                                    setNewSetting({
                                        ...newSetting,
                                        key: e.target.value,
                                    })
                                }
                                disabled={editingIndex !== null}
                                placeholder="mi_configuracion"
                                size="sm"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                Solo letras minúsculas, números y guiones bajos
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Etiqueta
                            </label>
                            <Input
                                value={newSetting.label}
                                onChange={(e) =>
                                    setNewSetting({
                                        ...newSetting,
                                        label: e.target.value,
                                    })
                                }
                                placeholder="Mi Configuración"
                                size="sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Tipo
                            </label>
                            <Select
                                size="sm"
                                options={[
                                    { value: 'string', label: 'Texto' },
                                    { value: 'number', label: 'Número' },
                                    { value: 'boolean', label: 'Booleano' },
                                    { value: 'select', label: 'Selección' },
                                    { value: 'json', label: 'JSON' },
                                ]}
                                value={{
                                    value: newSetting.type,
                                    label: {
                                        string: 'Texto',
                                        number: 'Número',
                                        boolean: 'Booleano',
                                        select: 'Selección',
                                        json: 'JSON',
                                    }[newSetting.type],
                                }}
                                onChange={(option) =>
                                    setNewSetting({
                                        ...newSetting,
                                        type: option?.value as any,
                                        // Inicializar el valor según el tipo
                                        value:
                                            option?.value === 'number'
                                                ? 0
                                                : option?.value === 'boolean'
                                                  ? false
                                                  : option?.value === 'json'
                                                    ? {}
                                                    : '',
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Valor por defecto
                            </label>
                            {newSetting.type === 'string' && (
                                <Input
                                    value={newSetting.value as string}
                                    onChange={(e) =>
                                        setNewSetting({
                                            ...newSetting,
                                            value: e.target.value,
                                        })
                                    }
                                    size="sm"
                                />
                            )}

                            {newSetting.type === 'number' && (
                                <Input
                                    type="number"
                                    value={newSetting.value as number}
                                    onChange={(e) =>
                                        setNewSetting({
                                            ...newSetting,
                                            value: Number(e.target.value),
                                        })
                                    }
                                    size="sm"
                                />
                            )}

                            {newSetting.type === 'boolean' && (
                                <Switcher
                                    checked={newSetting.value as boolean}
                                    onChange={(checked) =>
                                        setNewSetting({
                                            ...newSetting,
                                            value: checked,
                                        })
                                    }
                                />
                            )}

                            {newSetting.type === 'select' &&
                                selectOptions.length > 0 && (
                                    <Select
                                        size="sm"
                                        options={selectOptions}
                                        value={selectOptions.find(
                                            (o) => o.value === newSetting.value,
                                        )}
                                        onChange={(option) =>
                                            setNewSetting({
                                                ...newSetting,
                                                value:
                                                    option?.value ||
                                                    selectOptions[0].value,
                                            })
                                        }
                                    />
                                )}

                            {newSetting.type === 'json' && (
                                <Input
                                    textArea
                                    value={
                                        typeof newSetting.value === 'object'
                                            ? JSON.stringify(
                                                  newSetting.value,
                                                  null,
                                                  2,
                                              )
                                            : (newSetting.value as string)
                                    }
                                    onChange={(e) => {
                                        try {
                                            const jsonValue = JSON.parse(
                                                e.target.value,
                                            )
                                            setNewSetting({
                                                ...newSetting,
                                                value: jsonValue,
                                            })
                                        } catch (err) {
                                            // Si no es JSON válido, guardar como string
                                            setNewSetting({
                                                ...newSetting,
                                                value: e.target.value,
                                            })
                                        }
                                    }}
                                    size="sm"
                                />
                            )}
                        </div>
                    </div>

                    {/* Campos de categoría e importancia */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Categoría</label>
                            <Select
                                size="sm"
                                options={[
                                    { value: 'general', label: 'General' },
                                    { value: 'appearance', label: 'Apariencia' },
                                    { value: 'functionality', label: 'Funcionalidad' },
                                    { value: 'business', label: 'Negocio' },
                                    { value: 'contact', label: 'Contacto' },
                                    { value: 'social', label: 'Redes Sociales' },
                                    { value: 'advanced', label: 'Avanzado' }
                                ]}
                                value={{
                                    value: newSetting.category || 'general',
                                    label: newSetting.category 
                                        ? newSetting.category.charAt(0).toUpperCase() + newSetting.category.slice(1) 
                                        : 'General'
                                }}
                                onChange={(option) => setNewSetting({
                                    ...newSetting,
                                    category: option?.value || 'general'
                                })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Importancia</label>
                            <Select
                                size="sm"
                                options={[
                                    { value: 'low', label: 'Baja' },
                                    { value: 'medium', label: 'Media' },
                                    { value: 'high', label: 'Alta' }
                                ]}
                                value={{
                                    value: newSetting.importance || 'medium',
                                    label: newSetting.importance === 'high' 
                                        ? 'Alta' 
                                        : newSetting.importance === 'low' 
                                            ? 'Baja' 
                                            : 'Media'
                                }}
                                onChange={(option) => setNewSetting({
                                    ...newSetting,
                                    importance: option?.value as any || 'medium'
                                })}
                            />
                        </div>
                    </div>

                    {/* Opciones para tipo select */}
                    {newSetting.type === 'select' && (
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">
                                Opciones
                            </label>

                            {/* Lista de opciones */}
                            <div className="mb-2 max-h-32 overflow-y-auto">
                                {selectOptions.length === 0 ? (
                                    <div className="text-sm text-gray-500 p-2 border border-dashed rounded">
                                        Añada al menos una opción
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {selectOptions.map((option, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                            >
                                                <div>
                                                    <span className="font-medium">
                                                        {option.label}
                                                    </span>
                                                    <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                                                        {option.value}
                                                    </code>
                                                </div>
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    color="red"
                                                    icon={<PiTrash />}
                                                    onClick={() =>
                                                        handleRemoveOption(idx)
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Formulario para añadir nueva opción */}
                            <div className="flex items-end space-x-2">
                                <div className="flex-grow">
                                    <label className="block text-xs mb-1">
                                        Etiqueta
                                    </label>
                                    <Input
                                        size="sm"
                                        value={newOption.label}
                                        onChange={(e) =>
                                            setNewOption({
                                                ...newOption,
                                                label: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex-grow">
                                    <label className="block text-xs mb-1">
                                        Valor
                                    </label>
                                    <Input
                                        size="sm"
                                        value={newOption.value}
                                        onChange={(e) =>
                                            setNewOption({
                                                ...newOption,
                                                value: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    icon={<PiPlus />}
                                    onClick={handleAddOption}
                                >
                                    Añadir
                                </Button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Descripción (opcional)
                        </label>
                        <Input
                            textArea
                            value={newSetting.description || ''}
                            onChange={(e) =>
                                setNewSetting({
                                    ...newSetting,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Describa para qué sirve esta configuración..."
                            size="sm"
                        />
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button
                            variant="plain"
                            size="sm"
                            className="mr-2"
                            onClick={handleCancelEdit}
                            icon={<PiX />}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<PiCheck />}
                            onClick={handleAddSetting}
                        >
                            {editingIndex !== null ? 'Actualizar' : 'Añadir'}
                        </Button>
                    </div>
                </Card>
            ) : (
                <Button
                    className="mb-4"
                    icon={<PiPlus />}
                    onClick={() => setShowNewSettingForm(true)}
                >
                    Nueva Configuración
                </Button>
            )}

            <div className="mt-6 flex justify-between">
                <div className="text-sm text-gray-500">
                    {settingsModified && (
                        <span className="text-amber-500 flex items-center">
                            <PiWarningCircle className="mr-1" />
                            Hay cambios sin guardar
                        </span>
                    )}
                </div>
                <div className="flex space-x-2">
                    <Button variant="plain" onClick={onClose} disabled={saving}>
                        Cerrar
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleSaveSettings}
                        loading={saving}
                        disabled={!settingsModified}
                        icon={<PiCheck />}
                    >
                        Guardar Cambios
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default VerticalTypeSettingsModal
