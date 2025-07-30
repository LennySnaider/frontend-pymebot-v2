/**
 * Diálogo para crear nuevo agente
 */

'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem, Form } from '@/components/ui/Form'
import Select from '@/components/ui/Select'
import { useAgentContext } from './AgentProvider'
import { useForm, Controller } from 'react-hook-form'
import { toast } from '@/components/ui'
import type { CreateAgentData } from '../types'

const specializationOptions = [
    { value: 'general', label: 'General' },
    { value: 'casas', label: 'Casas residenciales' },
    { value: 'departamentos', label: 'Departamentos' },
    { value: 'terrenos', label: 'Terrenos' },
    { value: 'comercial', label: 'Propiedades comerciales' },
    { value: 'industrial', label: 'Propiedades industriales' },
]

export default function CreateAgentDialog() {
    const { isCreateDialogOpen, closeCreateDialog, refreshAgents } = useAgentContext()
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CreateAgentData>({
        defaultValues: {
            email: '',
            full_name: '',
            phone: '',
            role: 'agent',
            specialization: 'general',
            commission_rate: 5
        }
    })
    
    const onSubmit = async (data: CreateAgentData) => {
        setIsSubmitting(true)
        
        try {
            const response = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            
            if (!response.ok) {
                throw new Error('Error al crear agente')
            }
            
            toast.push('Agente creado exitosamente')
            
            reset()
            closeCreateDialog()
            await refreshAgents()
        } catch (error) {
            toast.push('Error al crear el agente')
        } finally {
            setIsSubmitting(false)
        }
    }
    
    return (
        <Dialog
            isOpen={isCreateDialogOpen}
            onClose={closeCreateDialog}
            onRequestClose={closeCreateDialog}
        >
            <h4>Crear Nuevo Agente</h4>
            
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormItem
                    label="Email"
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        rules={{ 
                            required: 'El email es requerido',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Email inválido'
                            }
                        }}
                        render={({ field }) => (
                            <Input
                                type="email"
                                placeholder="agente@empresa.com"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                
                <FormItem
                    label="Nombre Completo"
                    invalid={Boolean(errors.full_name)}
                    errorMessage={errors.full_name?.message}
                >
                    <Controller
                        name="full_name"
                        control={control}
                        rules={{ required: 'El nombre es requerido' }}
                        render={({ field }) => (
                            <Input
                                placeholder="Juan Pérez"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                
                <FormItem
                    label="Teléfono"
                    invalid={Boolean(errors.phone)}
                    errorMessage={errors.phone?.message}
                >
                    <Controller
                        name="phone"
                        control={control}
                        rules={{
                            pattern: {
                                value: /^\+?[0-9\s-]{10,}$/,
                                message: 'Teléfono inválido'
                            }
                        }}
                        render={({ field }) => (
                            <Input
                                placeholder="+52 55 1234 5678"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                
                <FormItem
                    label="Especialización"
                    invalid={Boolean(errors.specialization)}
                    errorMessage={errors.specialization?.message}
                >
                    <Controller
                        name="specialization"
                        control={control}
                        render={({ field }) => (
                            <Select
                                options={specializationOptions}
                                value={specializationOptions.find(opt => opt.value === field.value)}
                                onChange={(option) => field.onChange(option?.value)}
                            />
                        )}
                    />
                </FormItem>
                
                <FormItem
                    label="Comisión (%)"
                    invalid={Boolean(errors.commission_rate)}
                    errorMessage={errors.commission_rate?.message}
                >
                    <Controller
                        name="commission_rate"
                        control={control}
                        rules={{
                            min: { value: 0, message: 'Mínimo 0%' },
                            max: { value: 100, message: 'Máximo 100%' }
                        }}
                        render={({ field }) => (
                            <Input
                                type="number"
                                placeholder="5"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                        )}
                    />
                </FormItem>
                
                <div className="text-right mt-6">
                    <Button
                        size="sm"
                        className="mr-2"
                        variant="plain"
                        onClick={closeCreateDialog}
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                    >
                        Crear Agente
                    </Button>
                </div>
            </Form>
        </Dialog>
    )
}