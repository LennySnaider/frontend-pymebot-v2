/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_components/ModuleFormModal.tsx
 * Modal para crear o editar módulos del sistema
 * @version 1.0.0
 * @created 2025-04-10
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
} from '@/components/ui'
import { Form, FormItem } from '@/components/ui/Form'
import { useModulesStore } from '../_store/modulesStore'
import type { Module } from '../_store/modulesStore'
import {
    PiPuzzlePieceBold,
    PiRocketBold,
    PiChatCircleBold,
    PiCalendarBold,
    PiShoppingCartBold,
    PiUsersBold,
} from 'react-icons/pi'

interface ModuleFormModalProps {
    isOpen: boolean
    onClose: () => void
    module: Module | null
}

const iconOptions = [
    { value: 'puzzle', label: 'Puzzle (General)', icon: <PiPuzzlePieceBold /> },
    { value: 'rocket', label: 'Cohete (Lanzamiento)', icon: <PiRocketBold /> },
    { value: 'chat', label: 'Chat (Comunicación)', icon: <PiChatCircleBold /> },
    {
        value: 'calendar',
        label: 'Calendario (Citas)',
        icon: <PiCalendarBold />,
    },
    { value: 'cart', label: 'Carrito (Compras)', icon: <PiShoppingCartBold /> },
    { value: 'users', label: 'Usuarios (CRM)', icon: <PiUsersBold /> },
]

const ModuleFormModal = ({ isOpen, onClose, module }: ModuleFormModalProps) => {
    const { createModule, updateModule } = useModulesStore()
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('puzzle')
    const [isActive, setIsActive] = useState(true)
    const [isCore, setIsCore] = useState(false)
    const [orderIndex, setOrderIndex] = useState(0)

    // Initialize form with module data if editing
    useEffect(() => {
        if (module) {
            setName(module.name || '')
            setCode(module.code || '')
            setDescription(module.description || '')
            setIcon(module.icon || 'puzzle')
            setIsActive(module.is_active)
            setIsCore(module.is_core)
            setOrderIndex(module.order_index || 0)
        } else {
            // Default values for new module
            setName('')
            setCode('')
            setDescription('')
            setIcon('puzzle')
            setIsActive(true)
            setIsCore(false)
            setOrderIndex(0)
        }
    }, [module, isOpen])

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
            const moduleData = {
                name,
                code,
                description,
                icon,
                is_active: isActive,
                is_core: isCore,
                order_index: orderIndex,
            }

            if (module) {
                await updateModule(module.id, moduleData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Módulo actualizado correctamente
                    </Notification>,
                )
            } else {
                await createModule(moduleData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Módulo creado correctamente
                    </Notification>,
                )
            }

            onClose()
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error instanceof Error
                        ? error.message
                        : 'Error al guardar el módulo'}
                </Notification>,
            )
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            title={module ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
            width={600}
        >
            <Form className="p-4">
                <FormItem
                    label="Nombre"
                    required
                    invalid={!name}
                    errorMessage="El nombre es obligatorio"
                >
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre del módulo"
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
                        placeholder="codigo_del_modulo"
                    />
                    <small className="text-gray-500">
                        Identificador único, solo letras minúsculas, números y
                        guiones bajos
                    </small>
                </FormItem>

                <FormItem label="Descripción" className="mt-4">
                    <Input
                        type="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción del módulo"
                        textArea
                        rows={3}
                    />
                </FormItem>

                <FormItem label="Ícono" className="mt-4">
                    <Select
                        options={iconOptions}
                        value={icon}
                        onChange={(value) => setIcon(value as string)}
                        renderOption={(option) => (
                            <div className="flex items-center">
                                <span className="mr-2">{option.icon}</span>
                                {option.label}
                            </div>
                        )}
                    />
                </FormItem>

                <FormItem label="Orden" className="mt-4">
                    <Input
                        type="number"
                        value={orderIndex.toString()}
                        onChange={(e) =>
                            setOrderIndex(parseInt(e.target.value) || 0)
                        }
                        min={0}
                    />
                    <small className="text-gray-500">
                        Define el orden de visualización en menús y listados
                    </small>
                </FormItem>

                <div className="flex flex-col gap-2 mt-4">
                    <Checkbox
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                    >
                        Módulo Activo
                    </Checkbox>

                    <Checkbox
                        checked={isCore}
                        onChange={(e) => setIsCore(e.target.checked)}
                        disabled={module?.is_core}
                    >
                        Módulo Core (no se puede eliminar)
                    </Checkbox>
                    {module?.is_core && (
                        <small className="text-amber-500">
                            Los módulos core no pueden cambiarse a no-core una
                            vez creados
                        </small>
                    )}
                </div>

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
                        {module ? 'Actualizar' : 'Crear'}
                    </Button>
                </div>
            </Form>
        </Dialog>
    )
}

export default ModuleFormModal
