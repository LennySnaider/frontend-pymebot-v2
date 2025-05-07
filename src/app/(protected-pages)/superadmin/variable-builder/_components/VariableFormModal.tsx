/**
 * agentprop/src/app/(protected-pages)/superadmin/variable-builder/_components/VariableFormModal.tsx
 * Modal para crear/editar variables del sistema
 * @version 1.0.0
 * @created 2025-10-04
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useTranslation } from '@/utils/hooks/useTranslation'
import { useSystemVariablesStore } from '@/app/(protected-pages)/superadmin/variable-builder/_store/systemVariablesStore'
import {
    Dialog,
    Button,
    Input,
    Select,
    FormItem,
    FormContainer,
    Switcher,
    Alert
} from '@/components/ui'
import { showSuccess, showError } from '@/utils/notifications'
import { useForm, Controller } from 'react-hook-form'
import { PiWarningCircleDuotone } from 'react-icons/pi'
import VariableTypeFields from './VariableTypeFields'

// Tipos de variables disponibles
// Formateamos las opciones para que sean compatibles con react-select
const VARIABLE_TYPES = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'boolean', label: 'Booleano' },
    { value: 'select', label: 'Selección' },
    { value: 'date', label: 'Fecha' },
]

// Interfaz para las opciones de selección
interface SelectOption {
    value: string
    label: string
}

// Interfaz para la variable del sistema
interface SystemVariable {
    id?: string
    name: string
    display_name: string
    type: string
    description?: string
    default_value?: string
    is_tenant_configurable: boolean
    is_sensitive: boolean
    category_id?: string
    vertical_id?: string
    options?: SelectOption[]
    validation?: Record<string, unknown>
}

// Props para el componente
interface VariableFormModalProps {
    isOpen: boolean
    onClose: () => void
    variable?: SystemVariable // Si se proporciona, estamos en modo edición
}

const VariableFormModal: React.FC<VariableFormModalProps> = ({
    isOpen,
    onClose,
    variable,
}) => {
    const t = useTranslation()
    const isEditMode = !!variable?.id
    const [selectedType, setSelectedType] = useState(variable?.type || 'text')
    const [formError, setFormError] = useState<string | null>(null)

    // Obtener acciones del store (implementaremos estas funciones en el store)
    const addVariable = useSystemVariablesStore((state) => state.addVariable)
    const updateVariable = useSystemVariablesStore(
        (state) => state.updateVariable,
    )
    const loading = useSystemVariablesStore((state) => state.loading)

    // Configurar React Hook Form
    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<SystemVariable>({
        defaultValues: {
            name: '',
            display_name: '',
            description: '',
            type: 'text',
            default_value: '',
            is_tenant_configurable: true,
            is_sensitive: false,
            ...variable, // Si existe, sobreescribe los valores por defecto
        },
    })

    // Observar cambios en el tipo seleccionado
    const watchType = watch('type')

    // Actualizar el tipo seleccionado cuando cambia en el formulario
    useEffect(() => {
        setSelectedType(watchType)
    }, [watchType])

    // Resetear el formulario cuando se abre el modal o cambia la variable
    useEffect(() => {
        if (isOpen) {
            reset({
                name: '',
                display_name: '',
                description: '',
                type: 'text',
                default_value: '',
                is_tenant_configurable: true,
                is_sensitive: false,
                ...variable,
            })
            setFormError(null)  // Resetear errores al abrir el modal
        }
    }, [isOpen, variable, reset])

    // Manejar el envío del formulario
    const onSubmit = async (data: SystemVariable, event?: React.BaseSyntheticEvent) => {
        // Verificar si se ha enviado el formulario intencionalmente
        // Si el evento es undefined o si viene de un botón tipo submit
        if (event && event.target && (event.target as HTMLFormElement).getAttribute('data-action') !== 'submit') {
            return; // No continuar si no es un envío intencional del formulario
        }
        
        try {
            // Resetear cualquier error previo
            setFormError(null);
            
            // Asegurarse de que los datos tienen el formato correcto
            const submissionData = {
                ...data,
                // Asegurarse de que options es un array para el tipo 'select'
                options:
                    data.type === 'select'
                        ? Array.isArray(data.options)
                            ? data.options
                            : []
                        : undefined,
            }

            console.log('Form data to submit:', submissionData)

            if (isEditMode && variable?.id) {
                await updateVariable(variable.id, submissionData)
                showSuccess(
                    t('systemVariables.toast.variableUpdated'),
                    t('systemVariables.toast.success'),
                )
            } else {
                await addVariable(submissionData)
                showSuccess(
                    t('systemVariables.toast.variableCreated'),
                    t('systemVariables.toast.success'),
                )
            }
            onClose()
        } catch (error) {
            console.error('Error al guardar la variable:', error)
            
            // Capturar y mostrar el error en el formulario
            if (error instanceof Error) {
                setFormError(error.message);
            } else {
                setFormError(t('systemVariables.toast.errorSavingVariable'));
            }
            
            // También mostrar notificación toast
            showError(
                error instanceof Error ? error.message : t('systemVariables.toast.errorSavingVariable'),
                t('systemVariables.toast.error'),
            )
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={(e) => {
                // Asegurarse de que el cierre del diálogo no envíe el formulario
                if (e && e.preventDefault) {
                    e.preventDefault();
                }
                onClose();
            }}
            onRequestClose={(e) => {
                // Asegurarse de que el cierre del diálogo no envíe el formulario
                if (e && e.preventDefault) {
                    e.preventDefault();
                }
                onClose();
            }}
            width={700}
        >
            <h4 className="mb-4">
                {isEditMode
                    ? t('systemVariables.modal.editTitle')
                    : t('systemVariables.modal.createTitle')}
            </h4>
            <div className="p-4">
                {/* Mostrar error si existe */}
                {formError && (
                    <Alert className="mb-4" type="danger">
                        {formError}
                    </Alert>
                )}
                <FormContainer>
                    <form 
                        onSubmit={(e) => {
                            // Solo procesar si el evento viene realmente del botón de submit
                            const target = e.target as HTMLFormElement;
                            const submitButton = target.querySelector('button[data-action="submit"]');
                            
                            // Si el evento no fue disparado por el botón submit, o si el botón canceló el evento
                            if (!submitButton || (e.defaultPrevented)) {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                            }
                            
                            // Procesar el envío normalmente
                            handleSubmit(onSubmit)(e);
                        }}
                        data-action="submit-form"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre interno (identificador) */}
                            <FormItem
                                label={t('systemVariables.form.internalName')}
                                invalid={!!errors.name}
                                errorMessage={errors.name?.message}
                            >
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{
                                        required: t(
                                            'systemVariables.validation.nameRequired',
                                        ),
                                        pattern: {
                                            value: /^[a-zA-Z0-9_]+$/,
                                            message: t(
                                                'systemVariables.validation.nameFormat',
                                            ),
                                        },
                                    }}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            placeholder={t(
                                                'systemVariables.form.internalNamePlaceholder',
                                            )}
                                            disabled={loading}
                                        />
                                    )}
                                />
                                <small className="text-gray-500 mt-1 block">
                                    {t('systemVariables.form.internalNameHelp')}
                                </small>
                            </FormItem>

                            {/* Nombre visible */}
                            <FormItem
                                label={t('systemVariables.form.displayName')}
                                invalid={!!errors.display_name}
                                errorMessage={errors.display_name?.message}
                            >
                                <Controller
                                    name="display_name"
                                    control={control}
                                    rules={{
                                        required: t(
                                            'systemVariables.validation.displayNameRequired',
                                        ),
                                    }}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            placeholder={t(
                                                'systemVariables.form.displayNamePlaceholder',
                                            )}
                                            disabled={loading}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>

                        {/* Descripción */}
                        <FormItem
                            label={t('systemVariables.form.description')}
                            className="mt-4"
                        >
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        textArea
                                        placeholder={t(
                                            'systemVariables.form.descriptionPlaceholder',
                                        )}
                                        disabled={loading}
                                        rows={3}
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Tipo de variable */}
                        <FormItem
                            label={t('systemVariables.form.type')}
                            invalid={!!errors.type}
                            errorMessage={errors.type?.message}
                            className="mt-4"
                        >
                            <Controller
                                name="type"
                                control={control}
                                rules={{
                                    required: t(
                                        'systemVariables.validation.typeRequired',
                                    ),
                                }}
                                render={({ field }) => (
                                    <Select
                                        value={VARIABLE_TYPES.find(
                                            (option) =>
                                                option.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value)
                                        }
                                        options={VARIABLE_TYPES}
                                        isDisabled={loading || isEditMode} // No permitir cambiar el tipo en modo edición
                                    />
                                )}
                            />
                            {isEditMode && (
                                <div className="flex items-center text-amber-500 mt-2 text-sm">
                                    <PiWarningCircleDuotone className="mr-1" />
                                    {t('systemVariables.form.typeEditWarning')}
                                </div>
                            )}
                        </FormItem>

                        {/* Campos específicos según el tipo seleccionado */}
                        <VariableTypeFields
                            type={selectedType}
                            control={control}
                            errors={errors}
                            loading={loading}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* Configurable por tenant */}
                            <FormItem
                                label={t(
                                    'systemVariables.form.tenantConfigurable',
                                )}
                            >
                                <Controller
                                    name="is_tenant_configurable"
                                    control={control}
                                    render={({
                                        field: { value, onChange },
                                    }) => (
                                        <Switcher
                                            checked={value}
                                            onChange={onChange}
                                            disabled={loading}
                                        />
                                    )}
                                />
                                <small className="text-gray-500 mt-1 block">
                                    {t(
                                        'systemVariables.form.tenantConfigurableHelp',
                                    )}
                                </small>
                            </FormItem>

                            {/* Información sensible */}
                            <FormItem
                                label={t('systemVariables.form.sensitive')}
                            >
                                <Controller
                                    name="is_sensitive"
                                    control={control}
                                    render={({
                                        field: { value, onChange },
                                    }) => (
                                        <Switcher
                                            checked={value}
                                            onChange={onChange}
                                            disabled={loading}
                                        />
                                    )}
                                />
                                <small className="text-gray-500 mt-1 block">
                                    {t('systemVariables.form.sensitiveHelp')}
                                </small>
                            </FormItem>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                variant="plain"
                                onClick={(e) => {
                                    e.preventDefault(); // Prevenir comportamiento predeterminado del formulario
                                    e.stopPropagation(); // Detener propagación del evento
                                    onClose();
                                }}
                                disabled={loading}
                                type="button" // Importante: tipo button para evitar envío del formulario
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="solid"
                                type="submit"
                                loading={loading}
                                data-action="submit"
                            >
                                {isEditMode
                                    ? t('common.save')
                                    : t('common.create')}
                            </Button>
                        </div>
                    </form>
                </FormContainer>
            </div>
        </Dialog>
    )
}

export default VariableFormModal
