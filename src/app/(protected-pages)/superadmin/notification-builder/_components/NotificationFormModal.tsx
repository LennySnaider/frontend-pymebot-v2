/**
 * frontend/src/app/(protected-pages)/superadmin/notification-builder/_components/NotificationFormModal.tsx
 * Modal para crear/editar plantillas de notificaciones
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useTranslation } from '@/utils/hooks/useTranslation'
import { useSystemNotificationsStore, NotificationChannel } from '@/app/(protected-pages)/superadmin/notification-builder/_store/systemNotificationsStore'
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

// Tipos de canales de notificación
const NOTIFICATION_CHANNELS = [
    { value: 'email', label: 'Correo Electrónico' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Notificación Push' },
    { value: 'internal', label: 'Notificación Interna' },
    { value: 'webhook', label: 'Webhook' },
]

// Interfaz para la notificación
interface NotificationTemplate {
    id?: string
    name: string
    description: string
    subject?: string
    body: string
    channel: NotificationChannel
    is_active: boolean
    variables?: string[]
    conditions?: Record<string, unknown>
    is_system?: boolean
}

// Props para el componente
interface NotificationFormModalProps {
    isOpen: boolean
    onClose: () => void
    template?: NotificationTemplate // Si se proporciona, estamos en modo edición
}

const NotificationFormModal: React.FC<NotificationFormModalProps> = ({
    isOpen,
    onClose,
    template,
}) => {
    const t = useTranslation()
    const isEditMode = !!template?.id
    const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>(template?.channel || 'email')
    const [formError, setFormError] = useState<string | null>(null)

    // Obtener acciones del store
    const addTemplate = useSystemNotificationsStore((state) => state.addTemplate)
    const updateTemplate = useSystemNotificationsStore(
        (state) => state.updateTemplate,
    )
    const loading = useSystemNotificationsStore((state) => state.loading)

    // Configurar React Hook Form
    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<NotificationTemplate>({
        defaultValues: {
            name: '',
            description: '',
            subject: '',
            body: '',
            channel: 'email',
            is_active: true,
            variables: [],
            ...template, // Si existe, sobreescribe los valores por defecto
        },
    })

    // Observar cambios en el canal seleccionado
    const watchChannel = watch('channel')

    // Actualizar el canal seleccionado cuando cambia en el formulario
    useEffect(() => {
        if (watchChannel) {
            setSelectedChannel(watchChannel)
        }
    }, [watchChannel])

    // Resetear el formulario cuando se abre el modal o cambia la plantilla
    useEffect(() => {
        if (isOpen) {
            reset({
                name: '',
                description: '',
                subject: '',
                body: '',
                channel: 'email',
                is_active: true,
                variables: [],
                ...template,
            })
            setFormError(null)  // Resetear errores al abrir el modal
        }
    }, [isOpen, template, reset])

    // Manejar el envío del formulario
    const onSubmit = async (data: NotificationTemplate, event?: React.BaseSyntheticEvent) => {
        // Verificar si se ha enviado el formulario intencionalmente
        if (event && event.target && (event.target as HTMLFormElement).getAttribute('data-action') !== 'submit') {
            return; // No continuar si no es un envío intencional del formulario
        }
        
        try {
            // Resetear cualquier error previo
            setFormError(null);
            
            // Validar datos según el canal
            if (data.channel === 'email' && !data.subject) {
                setFormError('El asunto es obligatorio para notificaciones de correo electrónico');
                return;
            }

            // Procesar variables extraídas del cuerpo
            const extractedVariables = extractVariables(data.body);
            if (data.subject) {
                extractedVariables.push(...extractVariables(data.subject));
            }
            
            // Eliminar duplicados
            const uniqueVariables = [...new Set(extractedVariables)];
            
            const submissionData = {
                ...data,
                variables: uniqueVariables,
            };

            if (isEditMode && template?.id) {
                await updateTemplate(template.id, submissionData)
                showSuccess(
                    t('notificationBuilder.toast.templateUpdated') || 'Plantilla actualizada correctamente',
                    t('notificationBuilder.toast.success') || 'Éxito',
                )
            } else {
                await addTemplate(submissionData)
                showSuccess(
                    t('notificationBuilder.toast.templateCreated') || 'Plantilla creada correctamente',
                    t('notificationBuilder.toast.success') || 'Éxito',
                )
            }
            onClose()
        } catch (error) {
            console.error('Error al guardar la plantilla:', error)
            
            // Capturar y mostrar el error en el formulario
            if (error instanceof Error) {
                setFormError(error.message);
            } else {
                setFormError(t('notificationBuilder.toast.errorSavingTemplate') || 'Error al guardar la plantilla');
            }
            
            // También mostrar notificación toast
            showError(
                error instanceof Error ? error.message : (t('notificationBuilder.toast.errorSavingTemplate') || 'Error al guardar la plantilla'),
                t('notificationBuilder.toast.error') || 'Error',
            )
        }
    }

    // Extraer variables del formato {{variable_name}}
    const extractVariables = (text: string): string[] => {
        if (!text) return [];
        
        const variables: string[] = [];
        const regex = /{{([^}]+)}}/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            if (match[1]) {
                variables.push(match[1]);
            }
        }
        
        return variables;
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
                    ? (t('notificationBuilder.modal.editTitle') || 'Editar Plantilla de Notificación')
                    : (t('notificationBuilder.modal.createTitle') || 'Crear Plantilla de Notificación')}
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
                        {/* Nombre de la plantilla */}
                        <FormItem
                            label={t('notificationBuilder.form.name') || 'Nombre de la Plantilla'}
                            invalid={!!errors.name}
                            errorMessage={errors.name?.message}
                            className="mb-4"
                        >
                            <Controller
                                name="name"
                                control={control}
                                rules={{
                                    required: t('notificationBuilder.validation.nameRequired') || 'El nombre es obligatorio',
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder={t('notificationBuilder.form.namePlaceholder') || 'Ingrese nombre de la plantilla'}
                                        disabled={loading}
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Descripción */}
                        <FormItem
                            label={t('notificationBuilder.form.description') || 'Descripción'}
                            className="mb-4"
                        >
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        textArea
                                        placeholder={t('notificationBuilder.form.descriptionPlaceholder') || 'Breve descripción del propósito de esta notificación'}
                                        disabled={loading}
                                        rows={2}
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Canal de notificación */}
                        <FormItem
                            label={t('notificationBuilder.form.channel') || 'Canal de Notificación'}
                            invalid={!!errors.channel}
                            errorMessage={errors.channel?.message}
                            className="mb-4"
                        >
                            <Controller
                                name="channel"
                                control={control}
                                rules={{
                                    required: t('notificationBuilder.validation.channelRequired') || 'El canal es obligatorio',
                                }}
                                render={({ field }) => (
                                    <Select
                                        value={NOTIFICATION_CHANNELS.find(
                                            (option) =>
                                                option.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value)
                                        }
                                        options={NOTIFICATION_CHANNELS}
                                        isDisabled={loading || (isEditMode && template?.is_system)}
                                    />
                                )}
                            />
                            {isEditMode && template?.is_system && (
                                <div className="flex items-center text-amber-500 mt-2 text-sm">
                                    <PiWarningCircleDuotone className="mr-1" />
                                    {t('notificationBuilder.form.systemTemplateWarning') || 'Esta es una plantilla del sistema y no se puede cambiar su canal'}
                                </div>
                            )}
                        </FormItem>

                        {/* Asunto (solo para email) */}
                        {selectedChannel === 'email' && (
                            <FormItem
                                label={t('notificationBuilder.form.subject') || 'Asunto'}
                                invalid={!!errors.subject}
                                errorMessage={errors.subject?.message}
                                className="mb-4"
                            >
                                <Controller
                                    name="subject"
                                    control={control}
                                    rules={{
                                        required: t('notificationBuilder.validation.subjectRequired') || 'El asunto es obligatorio para notificaciones de correo',
                                    }}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            placeholder={t('notificationBuilder.form.subjectPlaceholder') || 'Asunto del correo electrónico'}
                                            disabled={loading}
                                        />
                                    )}
                                />
                            </FormItem>
                        )}

                        {/* Cuerpo de la notificación */}
                        <FormItem
                            label={t('notificationBuilder.form.body') || 'Contenido'}
                            invalid={!!errors.body}
                            errorMessage={errors.body?.message}
                            className="mb-4"
                        >
                            <Controller
                                name="body"
                                control={control}
                                rules={{
                                    required: t('notificationBuilder.validation.bodyRequired') || 'El contenido es obligatorio',
                                }}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        textArea
                                        placeholder={
                                            selectedChannel === 'webhook'
                                                ? t('notificationBuilder.form.bodyPlaceholderWebhook') || 'Contenido JSON para el webhook'
                                                : t('notificationBuilder.form.bodyPlaceholder') || 'Contenido de la notificación. Use {{variable}} para campos dinámicos'
                                        }
                                        disabled={loading}
                                        rows={6}
                                    />
                                )}
                            />
                            <small className="text-gray-500 mt-1 block">
                                {t('notificationBuilder.form.bodyHelp', {variable_name: 'variable_name'}) || 'Use {{variable_name}} entre llaves dobles para incluir variables dinámicas'}
                            </small>
                        </FormItem>

                        {/* Activo/Inactivo */}
                        <FormItem
                            label={t('notificationBuilder.form.active') || 'Estado'}
                            className="mb-4"
                        >
                            <Controller
                                name="is_active"
                                control={control}
                                render={({
                                    field: { value, onChange },
                                }) => (
                                    <div className="flex items-center">
                                        <Switcher
                                            checked={value}
                                            onChange={onChange}
                                            disabled={loading}
                                        />
                                        <span className="ml-2">
                                            {value 
                                                ? (t('notificationBuilder.form.activeState') || 'Activa') 
                                                : (t('notificationBuilder.form.inactiveState') || 'Inactiva')}
                                        </span>
                                    </div>
                                )}
                            />
                        </FormItem>

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
                                {t('common.cancel') || 'Cancelar'}
                            </Button>
                            <Button
                                variant="solid"
                                type="submit"
                                loading={loading}
                                data-action="submit"
                            >
                                {isEditMode
                                    ? (t('common.save') || 'Guardar')
                                    : (t('common.create') || 'Crear')}
                            </Button>
                        </div>
                    </form>
                </FormContainer>
            </div>
        </Dialog>
    )
}

export default NotificationFormModal