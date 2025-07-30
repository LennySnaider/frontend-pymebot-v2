'use client'

import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Upload from '@/components/ui/Upload'
import Avatar from '@/components/ui/Avatar'
import AvatarCropper from '@/components/shared/AvatarCropper'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/services/supabase/SupabaseClient'
import { toast } from '@/components/ui'
import { Notification } from '@/components/ui/Notification'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/AuthProvider'

interface CreateAgentForm {
    email: string
    password: string
    fullName: string
    phone?: string
    bio?: string
    specializations?: string
    languages?: string
    profileImage?: string
}

export default function CreateAgentButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null)
    const [showCropper, setShowCropper] = useState(false)
    const t = useTranslations('agents')
    const tCommon = useTranslations('common')
    const router = useRouter()
    const { role } = useAuthContext()
    
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<CreateAgentForm>()

    const onSubmit = async (data: CreateAgentForm) => {
        setIsLoading(true)
        
        try {
            // Llamar a la API route para crear el agente
            const response = await fetch('/api/admin/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    fullName: data.fullName,
                    phone: data.phone,
                    bio: data.bio,
                    specializations: data.specializations?.split(',').map(s => s.trim()).filter(s => s),
                    languages: data.languages?.split(',').map(l => l.trim()).filter(l => l),
                    profileImage: profileImage
                }),
            })
            
            if (!response.ok) {
                const result = await response.json()
                console.error('API Error:', result)
                throw new Error(result.error || 'Error al crear agente')
            }
            
            const result = await response.json()
            
            toast.push(
                <Notification title={tCommon('success')} type="success">
                    {t('messages.agentCreatedSuccessfully')}
                </Notification>
            )
            reset()
            setProfileImage(null)
            setIsOpen(false)
            router.refresh()
            
        } catch (error: any) {
            console.error('Error creando agente:', error)
            toast.push(
                <Notification title={tCommon('error')} type="danger" duration={5000}>
                    {error.message || t('messages.errorCreatingAgent')}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    // Solo los admins pueden crear agentes
    if (role !== 'tenant_admin' && role !== 'super_admin') {
        return null
    }

    return (
        <>
            <Button
                variant="solid"
                color="primary"
                onClick={() => setIsOpen(true)}
            >
                {t('createAgent')}
            </Button>
            
            <Dialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                width={600}
            >
                <div className="p-6">
                    <h4 className="mb-5">{t('createAgent')}</h4>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="mb-1 block">
                                {t('fields.email')} *
                            </label>
                            <Input
                                {...register('email', {
                                    required: tCommon('required'),
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: tCommon('invalidEmail')
                                    }
                                })}
                                type="email"
                                placeholder="agent@example.com"
                            />
                        </div>
                        
                        <div>
                            <label className="mb-1 block">
                                {t('fields.password')} *
                            </label>
                            <Input
                                {...register('password', {
                                    required: tCommon('required'),
                                    minLength: {
                                        value: 8,
                                        message: tCommon('passwordTooShort')
                                    }
                                })}
                                type="password"
                                placeholder="********"
                            />
                            <p className="text-xs mt-1 text-gray-500">
                                {t('hints.temporaryPasswordHint')}
                            </p>
                        </div>
                        
                        <div>
                            <label className="mb-1 block">
                                {t('fields.fullName')} *
                            </label>
                            <Input
                                {...register('fullName', {
                                    required: tCommon('required')
                                })}
                                placeholder="Juan Pérez"
                            />
                        </div>
                        
                        <div>
                            <label className="mb-1 block">
                                {t('fields.phone')}
                            </label>
                            <Input
                                {...register('phone')}
                                placeholder="+52 555 123 4567"
                            />
                        </div>
                        
                        <div>
                            <label className="mb-1 block">
                                {t('fields.profileImage')}
                            </label>
                            <div className="flex items-center gap-4">
                                <div>
                                    <Upload
                                        className="cursor-pointer"
                                        showList={false}
                                        uploadLimit={1}
                                        accept="image/jpeg,image/png"
                                        onChange={(files) => {
                                            if (files.length > 0) {
                                                const reader = new FileReader()
                                                reader.onloadend = () => {
                                                    setTempImageUrl(reader.result as string)
                                                    setShowCropper(true)
                                                }
                                                reader.readAsDataURL(files[0])
                                            }
                                        }}
                                    >
                                        <Avatar 
                                            size={80}
                                            src={profileImage || undefined}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                        />
                                    </Upload>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        {t('hints.clickToUpload')}
                                    </p>
                                </div>
                                {profileImage && (
                                    <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={() => setProfileImage(null)}
                                    >
                                        {tCommon('remove')}
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className="mb-1 block">
                                {t('fields.bio')}
                            </label>
                            <Input
                                {...register('bio')}
                                placeholder={t('placeholders.bioPlaceholder')}
                            />
                        </div>
                        
                        <div>
                            <label className="mb-1 block">
                                {t('fields.specializations')}
                            </label>
                            <Input
                                {...register('specializations')}
                                placeholder={t('placeholders.specializationsPlaceholder')}
                            />
                            <p className="text-xs mt-1 text-gray-500">
                                {t('hints.separateByCommas')}
                            </p>
                        </div>
                        
                        <div>
                            <label className="mb-1 block">
                                {t('fields.languages')}
                            </label>
                            <Input
                                {...register('languages')}
                                placeholder={t('placeholders.languagesPlaceholder')}
                            />
                            <p className="text-xs mt-1 text-gray-500">
                                {t('hints.separateByCommas')}
                            </p>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                type="button"
                                variant="default"
                                onClick={() => setIsOpen(false)}
                            >
                                {tCommon('cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                loading={isLoading}
                            >
                                {tCommon('create')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>
            
            {tempImageUrl && (
                <AvatarCropper
                    imageUrl={tempImageUrl}
                    isOpen={showCropper}
                    onClose={() => {
                        setShowCropper(false)
                        setTempImageUrl(null)
                    }}
                    onCrop={(croppedImage) => {
                        setProfileImage(croppedImage)
                        setShowCropper(false)
                        setTempImageUrl(null)
                    }}
                />
            )}
        </>
    )
}