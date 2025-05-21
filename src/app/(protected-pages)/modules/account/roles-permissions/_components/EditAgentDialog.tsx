'use client'

import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Upload from '@/components/ui/Upload'
import Avatar from '@/components/ui/Avatar'
import AvatarCropper from '@/components/shared/AvatarCropper'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { Notification } from '@/components/ui/Notification'
import { useTranslations } from 'next-intl'
import { User } from '../types'

interface EditAgentForm {
    email: string
    fullName: string
    phone?: string
    bio?: string
    specializations?: string
    languages?: string
    profileImage?: string
}

interface EditAgentDialogProps {
    user: User
    onClose: () => void
    onSuccess: () => void
}

export default function EditAgentDialog({ user, onClose, onSuccess }: EditAgentDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const t = useTranslations('agents')
    const tCommon = useTranslations('common')
    
    // Obtener datos del agente si existe
    const [agentData, setAgentData] = useState<any>(null)
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null)
    const [showCropper, setShowCropper] = useState(false)
    
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        watch
    } = useForm<EditAgentForm>({
        defaultValues: {
            email: user.email,
            fullName: user.full_name || user.name || '',
            phone: user.phone || '',
        }
    })
    
    // Cargar datos del agente al abrir el diálogo
    useEffect(() => {
        const loadAgentData = async () => {
            try {
                const response = await fetch(`/api/admin/agents/${user.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setAgentData(data.agent)
                    if (data.agent.avatar_url || data.agent.metadata?.profile_image) {
                        setProfileImage(data.agent.avatar_url || data.agent.metadata?.profile_image)
                    }
                    // Set form values from agent metadata
                    if (data.agent.metadata) {
                        setValue('bio', data.agent.metadata.bio || '')
                        setValue('specializations', data.agent.metadata.specializations?.join(', ') || '')
                        setValue('languages', data.agent.metadata.languages?.join(', ') || '')
                    }
                }
            } catch (error) {
                console.error('Error loading agent data:', error)
            }
        }
        
        loadAgentData()
    }, [user.id, setValue])

    const onSubmit = async (data: EditAgentForm) => {
        setIsLoading(true)
        
        try {
            // Llamar a la API route para actualizar el agente
            const response = await fetch(`/api/admin/agents/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    fullName: data.fullName,
                    phone: data.phone,
                    bio: data.bio,
                    specializations: data.specializations?.split(',').map(s => s.trim()).filter(s => s),
                    languages: data.languages?.split(',').map(l => l.trim()).filter(l => l),
                    profileImage: profileImage
                }),
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error || 'Error al actualizar agente')
            }
            
            toast.push(
                <Notification title={tCommon('success')} type="success">
                    {t('messages.agentUpdatedSuccessfully')}
                </Notification>
            )
            
            onSuccess()
            
        } catch (error: any) {
            console.error('Error actualizando agente:', error)
            toast.push(
                <Notification title={tCommon('error')} type="danger" duration={5000}>
                    {error.message || t('messages.errorUpdatingAgent')}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Dialog
                isOpen={true}
                onClose={onClose}
                width={600}
            >
                <div className="p-6">
                    <h4 className="mb-5">{t('editAgent')}</h4>
                    
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
                            error={errors.email?.message || undefined}
                        />
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
                            error={errors.fullName?.message || undefined}
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
                                        src={profileImage || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.name || user.email)}&size=200&background=random`}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                </Upload>
                                <p className="text-xs text-gray-500 text-center mt-2">
                                    {t('hints.clickToUpload')}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="mb-1 block">
                            {t('fields.bio')}
                        </label>
                        <Input
                            {...register('bio')}
                            as="textarea"
                            rows={3}
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
                            onClick={onClose}
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isLoading}
                        >
                            {tCommon('save')}
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