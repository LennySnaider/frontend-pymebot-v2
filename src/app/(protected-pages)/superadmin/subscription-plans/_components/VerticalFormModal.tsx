/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_components/VerticalFormModal.tsx
 * Modal para crear o editar verticales de negocio
 * @version 1.1.0
 * @updated 2025-04-14
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    Button,
    Input,
    Checkbox,
    Select,
    toast,
    Notification,
    Tabs,
} from '@/components/ui'
import { Form, FormItem } from '@/components/ui/Form'
import { useVerticalsStore, Vertical } from '../_store/verticalsStore'
import { useModulesStore } from '../_store/modulesStore'
import {
    PiBuildingsBold,
    PiHardDrivesBold,
    PiBriefcaseBold,
    PiHeartBold,
    PiGraduationCapBold,
    PiCookingPotBold,
} from 'react-icons/pi'

interface VerticalFormModalProps {
    isOpen: boolean
    onClose: () => void
    vertical: Vertical | null
}

const iconOptions = [
    {
        value: 'building',
        label: 'Edificio (Inmobiliaria)',
        icon: <PiBuildingsBold />,
    },
    { value: 'hard-hat', label: 'Construcción', icon: <PiHardDrivesBold /> },
    {
        value: 'briefcase',
        label: 'Maletín (Negocios)',
        icon: <PiBriefcaseBold />,
    },
    { value: 'heartbeat', label: 'Salud (Médico)', icon: <PiHeartBold /> },
    {
        value: 'graduation-cap',
        label: 'Birrete (Educación)',
        icon: <PiGraduationCapBold />,
    },
    { value: 'utensils', label: 'Restaurantes', icon: <PiCookingPotBold /> },
]

const VerticalFormModal = ({
    isOpen,
    onClose,
    vertical,
}: VerticalFormModalProps) => {
    const { createVertical, updateVertical } = useVerticalsStore()
    const { modules, fetchModules } = useModulesStore()
    const [isSaving, setIsSaving] = useState(false)
    const [modulesLoaded, setModulesLoaded] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('building')
    const [brandName, setBrandName] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [selectedModules, setSelectedModules] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState('general')

    // Cargar módulos si no están cargados
    useEffect(() => {
        if (!modulesLoaded && modules.length === 0) {
            fetchModules().then(() => setModulesLoaded(true))
        }
    }, [fetchModules, modules.length, modulesLoaded])

    // Initialize form with vertical data if editing
    useEffect(() => {
        if (vertical) {
            setName(vertical.name || '')
            setCode(vertical.code || '')
            setDescription(vertical.description || '')
            setIcon(vertical.icon || 'building')
            setBrandName(vertical.brand_name || '')
            setIsActive(vertical.is_active)
            setSelectedModules(vertical.modules || [])
        } else {
            // Default values for new vertical
            setName('')
            setCode('')
            setDescription('')
            setIcon('building')
            setBrandName('Agent by PymeBot')
            setIsActive(true)
            setSelectedModules([])
        }
    }, [vertical, isOpen])

    const handleSubmit = async () => {
        if (!name || !code) {
            toast.push(
                <Notification title="Error" type="danger">
                    Nombre y código son campos obligatorios
                </Notification>,
            )
            return
        }

        setIsSaving(true)

        try {
            const verticalData = {
                name,
                code,
                description,
                icon,
                brand_name: brandName,
                is_active: isActive,
                modules: selectedModules,
            }

            if (vertical) {
                await updateVertical(vertical.id, verticalData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Vertical actualizada correctamente
                    </Notification>,
                )
            } else {
                await createVertical(verticalData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Vertical creada correctamente
                    </Notification>,
                )
            }

            onClose()
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error instanceof Error
                        ? error.message
                        : 'Error al guardar la vertical'}
                </Notification>,
            )
        } finally {
            setIsSaving(false)
        }
    }

    // Preparar opciones de módulos para el Select
    const moduleOptions = modules.map((module) => ({
        value: module.id,
        label: module.name,
    }))

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            title={vertical ? 'Editar Vertical' : 'Crear Nueva Vertical'}
            width={700}
        >
            <div className="p-4">
                <Tabs
                    defaultValue="general"
                    value={activeTab}
                    onChange={(val) => setActiveTab(val as string)}
                >
                    <Tabs.TabList className="mb-4">
                        <Tabs.TabNav value="general">
                            Información General
                        </Tabs.TabNav>
                        <Tabs.TabNav value="modules">Módulos</Tabs.TabNav>
                        {vertical && (
                            <Tabs.TabNav value="categories">
                                Categorías
                            </Tabs.TabNav>
                        )}
                    </Tabs.TabList>

                    <Tabs.TabContent value="general">
                        <Form>
                            <FormItem
                                label="Nombre"
                                required
                                invalid={!name}
                                errorMessage="El nombre es obligatorio"
                            >
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nombre de la vertical (ej. Inmobiliaria)"
                                />
                            </FormItem>

                            <FormItem
                                label="Código"
                                required
                                invalid={!code}
                                errorMessage="El código es obligatorio"
                                className="mt-4"
                            >
                                <Input
                                    value={code}
                                    onChange={(e) =>
                                        setCode(
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/\s+/g, '_'),
                                        )
                                    }
                                    placeholder="codigo_de_vertical"
                                />
                                <small className="text-gray-500">
                                    Identificador único, solo letras minúsculas,
                                    números y guiones bajos
                                </small>
                            </FormItem>

                            <FormItem label="Descripción" className="mt-4">
                                <Input
                                    type="textarea"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Descripción de la vertical"
                                    textArea
                                    rows={3}
                                />
                            </FormItem>

                            <FormItem label="Nombre de marca" className="mt-4">
                                <Input
                                    value={brandName}
                                    onChange={(e) =>
                                        setBrandName(e.target.value)
                                    }
                                    placeholder="Agent[Vertical] by PymeBot"
                                />
                                <small className="text-gray-500">
                                    Nombre de submarca para esta vertical (ej.
                                    AgentProp, AgentBeauty)
                                </small>
                            </FormItem>

                            <FormItem label="Ícono" className="mt-4">
                                <Select
                                    options={iconOptions}
                                    value={icon}
                                    onChange={(value) =>
                                        setIcon(value as string)
                                    }
                                    renderOption={(option) => (
                                        <div className="flex items-center">
                                            <span className="mr-2">
                                                {option.icon}
                                            </span>
                                            {option.label}
                                        </div>
                                    )}
                                />
                            </FormItem>

                            <div className="flex flex-col gap-2 mt-4">
                                <Checkbox
                                    checked={isActive}
                                    onChange={(e) =>
                                        setIsActive(e.target.checked)
                                    }
                                >
                                    Vertical Activa
                                </Checkbox>
                            </div>
                        </Form>
                    </Tabs.TabContent>

                    <Tabs.TabContent value="modules">
                        <Form>
                            <FormItem label="Módulos Asignados">
                                <Select
                                    isMulti
                                    options={moduleOptions}
                                    value={selectedModules}
                                    onChange={(value) =>
                                        setSelectedModules(value as string[])
                                    }
                                    placeholder="Seleccionar módulos para esta vertical..."
                                />
                                <small className="text-gray-500">
                                    Estos módulos estarán disponibles para los
                                    tenants de esta vertical
                                </small>
                            </FormItem>
                        </Form>
                    </Tabs.TabContent>

                    {vertical && (
                        <Tabs.TabContent value="categories">
                            <VerticalCategoriesManager
                                verticalId={vertical.id}
                                categories={vertical.categories || []}
                            />
                        </Tabs.TabContent>
                    )}
                </Tabs>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        variant="plain"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        color="blue"
                        onClick={handleSubmit}
                        loading={isSaving}
                    >
                        {vertical ? 'Actualizar' : 'Crear'}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

// Componente para gestionar las categorías de una vertical
interface VerticalCategoriesManagerProps {
    verticalId: string
    categories: VerticalCategory[]
}

const VerticalCategoriesManager = ({
    verticalId,
    categories,
}: VerticalCategoriesManagerProps) => {
    const { createCategory, updateCategory, deleteCategory } =
        useVerticalsStore()
    const [isAdding, setIsAdding] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedCategory, setSelectedCategory] =
        useState<VerticalCategory | null>(null)

    // Form state para nueva/editar categoría
    const [categoryName, setCategoryName] = useState('')
    const [categoryCode, setCategoryCode] = useState('')
    const [categoryDescription, setCategoryDescription] = useState('')
    const [categoryIsActive, setCategoryIsActive] = useState(true)

    const resetCategoryForm = () => {
        setCategoryName('')
        setCategoryCode('')
        setCategoryDescription('')
        setCategoryIsActive(true)
        setSelectedCategory(null)
    }

    const handleAddCategory = () => {
        setIsAdding(true)
        setIsEditing(false)
        resetCategoryForm()
    }

    const handleEditCategory = (category: VerticalCategory) => {
        setSelectedCategory(category)
        setCategoryName(category.name)
        setCategoryCode(category.code)
        setCategoryDescription(category.description || '')
        setCategoryIsActive(category.is_active)
        setIsEditing(true)
        setIsAdding(false)
    }

    const handleDeleteCategory = async (categoryId: string) => {
        if (!window.confirm('¿Está seguro de eliminar esta categoría?')) {
            return
        }

        try {
            await deleteCategory(categoryId)
            toast.push(
                <Notification title="Éxito" type="success">
                    Categoría eliminada correctamente
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al eliminar la categoría
                </Notification>,
            )
        }
    }

    const handleSaveCategory = async () => {
        if (!categoryName || !categoryCode) {
            toast.push(
                <Notification title="Error" type="danger">
                    Nombre y código son campos obligatorios
                </Notification>,
            )
            return
        }

        try {
            const categoryData = {
                vertical_id: verticalId,
                name: categoryName,
                code: categoryCode,
                description: categoryDescription,
                is_active: categoryIsActive,
            }

            if (isEditing && selectedCategory) {
                await updateCategory(selectedCategory.id, categoryData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Categoría actualizada correctamente
                    </Notification>,
                )
            } else {
                await createCategory(categoryData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Categoría creada correctamente
                    </Notification>,
                )
            }

            setIsAdding(false)
            setIsEditing(false)
            resetCategoryForm()
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    Error al guardar la categoría
                </Notification>,
            )
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h6 className="text-sm font-medium">
                    Categorías de la Vertical
                </h6>
                <Button
                    size="sm"
                    variant="solid"
                    color="blue"
                    icon={<PiPlusBold />}
                    onClick={handleAddCategory}
                    disabled={isAdding || isEditing}
                >
                    Nueva Categoría
                </Button>
            </div>

            {(isAdding || isEditing) && (
                <Form className="mb-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
                    <h6 className="mb-3">
                        {isEditing ? 'Editar' : 'Nueva'} Categoría
                    </h6>

                    <FormItem
                        label="Nombre"
                        required
                        invalid={!categoryName}
                        errorMessage="El nombre es obligatorio"
                    >
                        <Input
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="Nombre de la categoría (ej. Salón)"
                        />
                    </FormItem>

                    <FormItem
                        label="Código"
                        required
                        invalid={!categoryCode}
                        errorMessage="El código es obligatorio"
                        className="mt-4"
                    >
                        <Input
                            value={categoryCode}
                            onChange={(e) =>
                                setCategoryCode(
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/\s+/g, '_'),
                                )
                            }
                            placeholder="codigo_categoria"
                        />
                    </FormItem>

                    <FormItem label="Descripción" className="mt-4">
                        <Input
                            type="textarea"
                            value={categoryDescription}
                            onChange={(e) =>
                                setCategoryDescription(e.target.value)
                            }
                            placeholder="Descripción de la categoría"
                            textArea
                            rows={2}
                        />
                    </FormItem>

                    <div className="flex flex-col gap-2 mt-4">
                        <Checkbox
                            checked={categoryIsActive}
                            onChange={(e) =>
                                setCategoryIsActive(e.target.checked)
                            }
                        >
                            Categoría Activa
                        </Checkbox>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            size="sm"
                            variant="plain"
                            onClick={() => {
                                setIsAdding(false)
                                setIsEditing(false)
                                resetCategoryForm()
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            color="blue"
                            onClick={handleSaveCategory}
                        >
                            {isEditing ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </Form>
            )}

            <div className="mt-4">
                {categories.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        No hay categorías definidas para esta vertical.
                        <div className="mt-2">
                            <Button
                                size="sm"
                                variant="twoTone"
                                color="blue"
                                onClick={handleAddCategory}
                            >
                                Añadir una categoría
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <div>
                                    <div className="font-medium">
                                        {category.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <code>{category.code}</code>
                                        {category.description &&
                                            ` - ${category.description}`}
                                    </div>
                                    {!category.is_active && (
                                        <Badge className="mt-1 bg-gray-400">
                                            Inactiva
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        icon={<PiPencilSimpleBold />}
                                        onClick={() =>
                                            handleEditCategory(category)
                                        }
                                        disabled={isAdding || isEditing}
                                    />
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        color="red"
                                        icon={<PiTrashSimpleBold />}
                                        onClick={() =>
                                            handleDeleteCategory(category.id)
                                        }
                                        disabled={isAdding || isEditing}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default VerticalFormModal
