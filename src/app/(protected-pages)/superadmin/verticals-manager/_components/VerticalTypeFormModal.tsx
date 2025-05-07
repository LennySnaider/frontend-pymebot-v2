/**
 * frontend/src/app/(protected-pages)/superadmin/verticals-manager/_components/VerticalTypeFormModal.tsx
 * Modal para crear/editar tipos de verticales
 * @version 1.1.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui'
import { FormItem, FormContainer } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { VerticalType, useVerticalTypesStore } from '../_store/verticalTypesStore'
import { Vertical } from '@/app/(protected-pages)/superadmin/subscription-plans/_store/verticalsStore'
import { toast, Notification } from '@/components/ui'
import {
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
} from 'react-icons/pi'

interface VerticalTypeFormModalProps {
    isOpen: boolean
    onClose: () => void
    verticalType: VerticalType | null
    verticals: Vertical[]
}

// Esquema de validación usando Zod
const validationSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    code: z.string()
        .min(1, 'El código es obligatorio')
        .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guiones bajos')
        .max(50, 'Máximo 50 caracteres'),
    description: z.string().max(500, 'Máximo 500 caracteres').optional(),
    icon: z.string().min(1, 'El ícono es obligatorio'),
    vertical_id: z.string().min(1, 'La vertical es obligatoria'),
    is_active: z.boolean().default(true)
})

// Tipo para los valores del formulario
type FormValues = z.infer<typeof validationSchema>

const VerticalTypeFormModal = ({ 
    isOpen, 
    onClose, 
    verticalType, 
    verticals 
}: VerticalTypeFormModalProps) => {
    const [confirmLoading, setConfirmLoading] = useState(false)
    const [selectedIcon, setSelectedIcon] = useState<string>(verticalType?.icon || 'building')
    
    const { createType, updateType } = useVerticalTypesStore()
    
    // Configuración del formulario con React Hook Form
    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
        reset
    } = useForm<FormValues>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            icon: 'building',
            vertical_id: '',
            is_active: true
        }
    })
    
    // Actualizar el ícono seleccionado cuando cambia el tipo
    useEffect(() => {
        if (verticalType?.icon) {
            setSelectedIcon(verticalType.icon)
        } else {
            setSelectedIcon('building')
        }
    }, [verticalType])
    
    // Inicializar el formulario cuando cambia el tipo de vertical
    useEffect(() => {
        if (isOpen) {
            reset({
                name: verticalType?.name || '',
                code: verticalType?.code || '',
                description: verticalType?.description || '',
                icon: verticalType?.icon || 'building',
                vertical_id: verticalType?.vertical_id || '',
                is_active: verticalType?.is_active ?? true
            })
        }
    }, [isOpen, verticalType, reset])
    
    // Opciones para el selector de verticales
    const verticalOptions = verticals.map(vertical => ({
        value: vertical.id,
        label: vertical.name
    }))
    
    // Manejar envío del formulario
    const onSubmit = async (values: FormValues) => {
        setConfirmLoading(true)
        try {
            // Añadir el ícono seleccionado a los valores
            const typeData = {
                ...values,
                icon: selectedIcon,
                // Inicializar configuraciones por defecto si es un nuevo tipo
                default_settings: verticalType?.default_settings || {}
            }
            
            console.log('Submitting type data:', typeData)
            
            // Crear o actualizar el tipo según corresponda
            if (verticalType?.id) {
                await updateType(verticalType.id, typeData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Tipo de vertical actualizado correctamente
                    </Notification>
                )
            } else {
                await createType(typeData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Tipo de vertical creado correctamente
                    </Notification>
                )
            }
            onClose()
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error instanceof Error 
                        ? error.message 
                        : typeof error === 'object' && error 
                            ? JSON.stringify(error) 
                            : 'Error desconocido al guardar el tipo de vertical'}
                </Notification>
            )
        } finally {
            setConfirmLoading(false)
        }
    }
    
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={(e) => {
                // Solo cerrar cuando se hace clic en el botón de cerrar
                // o en el overlay, no cuando se hace clic dentro del modal
                if (e?.currentTarget === e?.target) {
                    onClose()
                }
            }}
            shouldCloseOnOverlayClick={false}
            contentClassName="max-w-lg"
        >
            <h5 className="mb-4">{verticalType?.id ? 'Editar Tipo' : 'Nuevo Tipo'}</h5>
            
            <FormContainer>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 gap-4">
                        <FormItem
                            label="Vertical"
                            invalid={!!errors.vertical_id}
                            errorMessage={errors.vertical_id?.message}
                        >
                            <Controller
                                name="vertical_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        placeholder="Seleccionar vertical..."
                                        options={verticalOptions}
                                        value={verticalOptions.find(
                                            option => option.value === field.value
                                        )}
                                        onChange={(option) => field.onChange(option?.value || '')}
                                    />
                                )}
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Nombre"
                            invalid={!!errors.name}
                            errorMessage={errors.name?.message}
                        >
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder="Nombre del tipo"
                                    />
                                )}
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Código"
                            invalid={!!errors.code}
                            errorMessage={errors.code?.message}
                            extra="Solo letras minúsculas, números y guiones bajos"
                        >
                            <Controller
                                name="code"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder="Código único (ej: dentista)"
                                    />
                                )}
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Descripción"
                            invalid={!!errors.description}
                            errorMessage={errors.description?.message}
                        >
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder="Descripción breve del tipo"
                                        textArea
                                    />
                                )}
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Ícono"
                            invalid={!!errors.icon}
                            errorMessage={errors.icon?.message}
                        >
                            <Controller
                                name="icon"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center">
                                        <div className="mr-2 text-xl">
                                            {selectedIcon === 'building' && <PiBuilding />}
                                            {selectedIcon === 'buildings' && <PiBuildings />}
                                            {selectedIcon === 'house' && <PiHouse />}
                                            {selectedIcon === 'storefront' && <PiStorefront />}
                                            {selectedIcon === 'user' && <PiUser />}
                                            {selectedIcon === 'users' && <PiUsers />}
                                            {selectedIcon === 'calendar' && <PiCalendar />}
                                            {selectedIcon === 'clock' && <PiClock />}
                                            {selectedIcon === 'tag' && <PiTag />}
                                            {selectedIcon === 'star' && <PiStar />}
                                        </div>
                                        <Select
                                            value={{ label: selectedIcon, value: selectedIcon }}
                                            options={[
                                                { label: 'Building', value: 'building' },
                                                { label: 'Buildings', value: 'buildings' },
                                                { label: 'House', value: 'house' },
                                                { label: 'Storefront', value: 'storefront' },
                                                { label: 'User', value: 'user' },
                                                { label: 'Users', value: 'users' },
                                                { label: 'Calendar', value: 'calendar' },
                                                { label: 'Clock', value: 'clock' },
                                                { label: 'Tag', value: 'tag' },
                                                { label: 'Star', value: 'star' },
                                            ]}
                                            onChange={(option) => {
                                                const iconValue = option?.value || 'building';
                                                setSelectedIcon(iconValue);
                                                field.onChange(iconValue);
                                            }}
                                        />
                                    </div>
                                )}
                            />
                        </FormItem>
                        
                        <FormItem>
                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Checkbox
                                        checked={value}
                                        onChange={(e) => onChange(e.target.checked)}
                                    >
                                        Tipo activo
                                    </Checkbox>
                                )}
                            />
                        </FormItem>
                    </div>
                    
                    <div className="mt-6 text-right">
                        <Button
                            className="mr-2"
                            variant="plain"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            type="submit"
                            loading={confirmLoading}
                        >
                            {verticalType?.id ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </FormContainer>
        </Dialog>
    )
}

export default VerticalTypeFormModal
