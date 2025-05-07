/**
 * frontend/src/app/(protected-pages)/superadmin/subscription-plans/_components/PlanFormModal.tsx
 * Modal para crear/editar planes de suscripción
 * @version 1.1.0
 * @updated 2025-05-01
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, toast, Notification } from '@/components/ui'
import { FormItem, FormContainer } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import { Plan, usePlansStore } from '../_store/plansStore'

interface PlanFormModalProps {
    isOpen: boolean
    onClose: () => void
    plan: Plan | null
}

// Opciones para el ciclo de facturación
const billingCycleOptions = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' },
    { value: 'one_time', label: 'Pago único' }
]

const PlanFormModal = ({ isOpen, onClose, plan }: PlanFormModalProps) => {
    const { createPlan, updatePlan } = usePlansStore()
    const [confirmLoading, setConfirmLoading] = useState(false)
    
    // Estado del formulario
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [description, setDescription] = useState('')
    const [priceMonthly, setPriceMonthly] = useState(0)
    const [priceYearly, setPriceYearly] = useState(0)
    const [billingCycle, setBillingCycle] = useState('monthly')
    const [isActive, setIsActive] = useState(true)
    const [maxUsers, setMaxUsers] = useState(1)
    const [maxStorage, setMaxStorage] = useState(1)
    
    // Estado de validación
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    
    // Inicializar formulario con datos del plan
    useEffect(() => {
        if (plan) {
            setName(plan.name || '')
            setCode(plan.code || '')
            setDescription(plan.description || '')
            setPriceMonthly(plan.price_monthly || 0)
            setPriceYearly(plan.price_yearly || 0)
            setBillingCycle(plan.billing_cycle || 'monthly')
            setIsActive(plan.is_active ?? true)
            setMaxUsers(plan.max_users || 1)
            setMaxStorage(plan.max_storage_gb || 1)
        } else {
            setName('')
            setCode('')
            setDescription('')
            setPriceMonthly(0)
            setPriceYearly(0)
            setBillingCycle('monthly')
            setIsActive(true)
            setMaxUsers(1)
            setMaxStorage(1)
        }
        
        // Resetear estado de validación
        setErrors({})
        setTouched({})
    }, [plan, isOpen])
    
    // Validar un campo específico
    const validateField = (name: string, value: any) => {
        let error = ''
        
        switch (name) {
            case 'name':
                if (!value) error = 'El nombre es obligatorio'
                break
            case 'code':
                if (!value) error = 'El código es obligatorio'
                break
            case 'priceMonthly':
                if (value < 0) error = 'El precio mensual debe ser mayor o igual a 0'
                if (value === '') error = 'El precio mensual es obligatorio'
                break
            case 'priceYearly':
                if (value < 0) error = 'El precio anual debe ser mayor o igual a 0'
                if (value === '') error = 'El precio anual es obligatorio'
                break
            case 'maxUsers':
                if (value < 1) error = 'Debe haber al menos 1 usuario'
                if (value === '') error = 'El número máximo de usuarios es obligatorio'
                break
            case 'maxStorage':
                if (value < 0) error = 'El almacenamiento debe ser mayor o igual a 0'
                if (value === '') error = 'El almacenamiento máximo es obligatorio'
                break
            default:
                break
        }
        
        return error
    }
    
    // Actualizar estado y validar al cambiar un campo
    const handleChange = (fieldName: string, value: any) => {
        // Marcar campo como tocado
        setTouched(prev => ({ ...prev, [fieldName]: true }))
        
        // Actualizar estado según el campo
        switch (fieldName) {
            case 'name':
                setName(value)
                break
            case 'code':
                setCode(value)
                break
            case 'description':
                setDescription(value)
                break
            case 'priceMonthly':
                setPriceMonthly(Number(value))
                break
            case 'priceYearly':
                setPriceYearly(Number(value))
                break
            case 'billingCycle':
                setBillingCycle(value)
                break
            case 'isActive':
                setIsActive(value)
                break
            case 'maxUsers':
                setMaxUsers(Number(value))
                break
            case 'maxStorage':
                setMaxStorage(Number(value))
                break
            default:
                break
        }
        
        // Validar el campo
        const error = validateField(fieldName, value)
        setErrors(prev => ({
            ...prev,
            [fieldName]: error
        }))
    }
    
    // Validar todo el formulario
    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        
        newErrors.name = validateField('name', name)
        newErrors.code = validateField('code', code)
        newErrors.priceMonthly = validateField('priceMonthly', priceMonthly)
        newErrors.priceYearly = validateField('priceYearly', priceYearly)
        newErrors.maxUsers = validateField('maxUsers', maxUsers)
        newErrors.maxStorage = validateField('maxStorage', maxStorage)
        
        // Filtrar errores vacíos
        const filteredErrors = Object.fromEntries(
            Object.entries(newErrors).filter(([_, v]) => v !== '')
        )
        
        setErrors(filteredErrors)
        
        // El formulario es válido si no hay errores
        return Object.keys(filteredErrors).length === 0
    }
    
    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Marcar todos los campos como tocados
        setTouched({
            name: true,
            code: true,
            description: true,
            priceMonthly: true,
            priceYearly: true,
            billingCycle: true,
            isActive: true,
            maxUsers: true,
            maxStorage: true
        })
        
        // Validar formulario
        if (!validateForm()) {
            toast.push(
                <Notification title="Error" type="danger">
                    Por favor, corrija los errores en el formulario
                </Notification>
            )
            return
        }
        
        setConfirmLoading(true)
        
        try {
            const planData = {
                name,
                code,
                description,
                price_monthly: priceMonthly,
                price_yearly: priceYearly,
                billing_cycle: billingCycle, // Campo virtual para UI
                is_active: isActive,
                features: plan?.features || [],
                max_users: maxUsers,
                max_storage_gb: maxStorage
            }
            
            // Crear o actualizar el plan según corresponda
            if (plan) {
                await updatePlan(plan.id, planData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Plan actualizado correctamente
                    </Notification>
                )
            } else {
                await createPlan(planData)
                toast.push(
                    <Notification title="Éxito" type="success">
                        Plan creado correctamente
                    </Notification>
                )
            }
            onClose()
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error instanceof Error ? error.message : 'Error al guardar el plan'}
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
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            contentClassName="max-w-lg"
        >
            <h5 className="mb-4">{plan ? 'Editar Plan' : 'Nuevo Plan'}</h5>
            
            <form onSubmit={handleSubmit}>
                <FormContainer>
                    <FormItem
                        label="Nombre"
                        invalid={Boolean(errors.name && touched.name)}
                        errorMessage={errors.name}
                    >
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Nombre del plan"
                        />
                    </FormItem>
                    
                    <FormItem
                        label="Código"
                        invalid={Boolean(errors.code && touched.code)}
                        errorMessage={errors.code}
                    >
                        <Input
                            type="text"
                            value={code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            placeholder="Código único del plan"
                        />
                    </FormItem>
                    
                    <FormItem
                        label="Descripción"
                        invalid={Boolean(errors.description && touched.description)}
                        errorMessage={errors.description}
                    >
                        <Input
                            type="text"
                            value={description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Descripción breve del plan"
                            textArea
                        />
                    </FormItem>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem
                            label="Precio Mensual"
                            invalid={Boolean(errors.priceMonthly && touched.priceMonthly)}
                            errorMessage={errors.priceMonthly}
                        >
                            <Input
                                type="number"
                                value={priceMonthly}
                                onChange={(e) => handleChange('priceMonthly', e.target.value)}
                                placeholder="0.00"
                                prefix="$"
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Precio Anual"
                            invalid={Boolean(errors.priceYearly && touched.priceYearly)}
                            errorMessage={errors.priceYearly}
                        >
                            <Input
                                type="number"
                                value={priceYearly}
                                onChange={(e) => handleChange('priceYearly', e.target.value)}
                                placeholder="0.00"
                                prefix="$"
                            />
                        </FormItem>
                    </div>
                    
                    <FormItem
                        label="Ciclo de Facturación Predeterminado"
                        invalid={Boolean(errors.billingCycle && touched.billingCycle)}
                        errorMessage={errors.billingCycle}
                    >
                        <Select
                            options={billingCycleOptions}
                            value={billingCycleOptions.find(
                                (option) => option.value === billingCycle
                            )}
                            onChange={(option) => handleChange('billingCycle', option?.value)}
                            placeholder="Seleccionar ciclo"
                        />
                    </FormItem>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem
                            label="Usuarios Máximos"
                            invalid={Boolean(errors.maxUsers && touched.maxUsers)}
                            errorMessage={errors.maxUsers}
                        >
                            <Input
                                type="number"
                                value={maxUsers}
                                onChange={(e) => handleChange('maxUsers', e.target.value)}
                                placeholder="1"
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Almacenamiento (GB)"
                            invalid={Boolean(errors.maxStorage && touched.maxStorage)}
                            errorMessage={errors.maxStorage}
                        >
                            <Input
                                type="number"
                                value={maxStorage}
                                onChange={(e) => handleChange('maxStorage', e.target.value)}
                                placeholder="1"
                            />
                        </FormItem>
                    </div>
                    
                    <FormItem>
                        <Checkbox
                            checked={isActive}
                            onChange={(e) => handleChange('isActive', e.target.checked)}
                        >
                            Plan activo
                        </Checkbox>
                    </FormItem>
                    
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
                            {plan ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </FormContainer>
            </form>
        </Dialog>
    )
}

export default PlanFormModal