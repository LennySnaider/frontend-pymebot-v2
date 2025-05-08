'use client'

import { useState, useRef } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Form, FormItem } from '@/components/ui/Form'
import classNames from '@/utils/classNames'
import sleep from '@/utils/sleep'
import isLastChild from '@/utils/isLastChild'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import type { ZodType } from 'zod'

type PasswordSchema = {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
}

const authenticatorList = [
    {
        label: 'Google Authenticator',
        value: 'googleAuthenticator',
        img: '/img/others/google.png',
        desc: 'Usa la app Google Authenticator para generar códigos temporales para inicios de sesión seguros.',
    },
    {
        label: 'Okta Verify',
        value: 'oktaVerify',
        img: '/img/others/okta.png',
        desc: 'Recibe notificaciones push desde la app Okta Verify en tu teléfono para aprobación rápida de inicio de sesión.',
    },
    {
        label: 'Verificación por correo',
        value: 'emailVerification',
        img: '/img/others/email.png',
        desc: 'Códigos únicos enviados al correo electrónico para confirmar inicios de sesión.',
    },
]

const validationSchema: ZodType<PasswordSchema> = z
    .object({
        currentPassword: z
            .string()
            .min(1, { message: '¡Por favor ingresa tu contraseña actual!' }),
        newPassword: z
            .string()
            .min(1, { message: '¡Por favor ingresa tu nueva contraseña!' }),
        confirmNewPassword: z
            .string()
            .min(1, { message: '¡Por favor confirma tu nueva contraseña!' }),
    })
    .refine((data) => data.confirmNewPassword === data.newPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmNewPassword'],
    })

const SettingsSecurity = () => {
    const [selected2FaType, setSelected2FaType] = useState(
        'googleAuthenticator',
    )
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const formRef = useRef<HTMLFormElement>(null)

    const {
        getValues,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<PasswordSchema>({
        resolver: zodResolver(validationSchema),
    })

    const handlePostSubmit = async () => {
        setIsSubmitting(true)
        await sleep(1000)
        console.log('getValues', getValues())
        setConfirmationOpen(false)
        setIsSubmitting(false)
    }

    const onSubmit = async () => {
        setConfirmationOpen(true)
    }

    return (
        <div>
            <div className="mb-8">
                <h4>Contraseña</h4>
                <p>
                    Recuerda, tu contraseña es la llave digital a tu cuenta.
                    ¡Mantenla segura y protegida!
                </p>
            </div>
            <Form
                ref={formRef}
                className="mb-8"
                onSubmit={handleSubmit(onSubmit)}
            >
                <FormItem
                    label="Contraseña actual"
                    invalid={Boolean(errors.currentPassword)}
                    errorMessage={errors.currentPassword?.message}
                >
                    <Controller
                        name="currentPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="•••••••••"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Nueva contraseña"
                    invalid={Boolean(errors.newPassword)}
                    errorMessage={errors.newPassword?.message}
                >
                    <Controller
                        name="newPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="•••••••••"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Confirmar nueva contraseña"
                    invalid={Boolean(errors.confirmNewPassword)}
                    errorMessage={errors.confirmNewPassword?.message}
                >
                    <Controller
                        name="confirmNewPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="•••••••••"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <div className="flex justify-end">
                    <Button variant="solid" type="submit">
                        Actualizar
                    </Button>
                </div>
            </Form>
            <ConfirmDialog
                isOpen={confirmationOpen}
                type="warning"
                title="Actualizar contraseña"
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handlePostSubmit,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>¿Estás seguro de que deseas cambiar tu contraseña?</p>
            </ConfirmDialog>
            <div className="mb-8">
                <h4>Verificación en dos pasos</h4>
                <p>
                    Tu cuenta tiene gran valor para los hackers. ¡Activa la verificación
                    en dos pasos para proteger tu cuenta!
                </p>
                <div className="mt-8">
                    {authenticatorList.map((authOption, index) => (
                        <div
                            key={authOption.value}
                            className={classNames(
                                'py-6 border-gray-200 dark:border-gray-600',
                                !isLastChild(authenticatorList, index) &&
                                    'border-b',
                            )}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        size={35}
                                        className="bg-transparent"
                                        src={authOption.img}
                                    />
                                    <div>
                                        <h6>{authOption.label}</h6>
                                        <span>{authOption.desc}</span>
                                    </div>
                                </div>
                                <div>
                                    {selected2FaType === authOption.value ? (
                                        <Button
                                            size="sm"
                                            customColorClass={() =>
                                                'border-success ring-1 ring-success text-success hover:border-success hover:ring-success hover:text-success bg-transparent'
                                            }
                                            onClick={() =>
                                                setSelected2FaType('')
                                            }
                                        >
                                            Activado
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setSelected2FaType(
                                                    authOption.value,
                                                )
                                            }
                                        >
                                            Activar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SettingsSecurity
