'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/ui/toast'
import { Notification } from '@/components/ui/Notification'
import { TbEdit, TbMail, TbPhone, TbUser, TbGlobe, TbBrandWhatsapp } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

interface AgentProfileInfoProps {
    agent: any
    user: any
}

interface UpdateProfileForm {
    fullName: string
    phone: string
    bio: string
    specializations: string
    languages: string
}

export default function AgentProfileInfo({ agent, user }: AgentProfileInfoProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const t = useTranslations('agents')
    const tCommon = useTranslations('common')
    const router = useRouter()
    
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<UpdateProfileForm>({
        defaultValues: {
            fullName: user?.full_name || user?.name || '',
            phone: user?.phone || '',
            bio: agent?.bio || '',
            specializations: agent?.specializations?.join(', ') || '',
            languages: agent?.languages?.join(', ') || ''
        }
    })
    
    const onSubmit = async (data: UpdateProfileForm) => {
        setIsLoading(true)
        
        try {
            const response = await fetch(`/api/agents/profile/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: data.fullName,
                    phone: data.phone,
                    bio: data.bio,
                    specializations: data.specializations.split(',').map(s => s.trim()).filter(s => s),
                    languages: data.languages.split(',').map(l => l.trim()).filter(l => l),
                }),
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error || 'Error al actualizar perfil')
            }
            
            toast.push(
                <Notification title={tCommon('success')} type="success">
                    {t('messages.profileUpdatedSuccessfully')}
                </Notification>
            )
            
            setIsEditing(false)
            router.refresh()
            
        } catch (error: any) {
            console.error('Error actualizando perfil:', error)
            toast.push(
                <Notification title={tCommon('error')} type="danger">
                    {error.message || t('messages.errorUpdatingProfile')}
                </Notification>
            )
        } finally {
            setIsLoading(false)
        }
    }
    
    const handleCancel = () => {
        reset()
        setIsEditing(false)
    }
    
    if (isEditing) {
        return (
            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="default"
                            onClick={handleCancel}
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
            </Card>
        )
    }
    
    return (
        <Card>
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <Avatar 
                        size={80} 
                        shape="circle" 
                        src={user?.avatar_url} 
                    />
                    <div>
                        <h4 className="text-xl font-bold mb-1">
                            {user?.full_name || user?.name || user?.email}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                            {agent?.specializations?.join(' • ') || t('noSpecializations')}
                        </p>
                    </div>
                </div>
                <Button
                    icon={<TbEdit />}
                    onClick={() => setIsEditing(true)}
                >
                    {tCommon('edit')}
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <TbMail className="text-gray-500" size={20} />
                        <div>
                            <p className="text-sm text-gray-500">{t('fields.email')}</p>
                            <p className="font-medium">{user?.email}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <TbPhone className="text-gray-500" size={20} />
                        <div>
                            <p className="text-sm text-gray-500">{t('fields.phone')}</p>
                            <p className="font-medium">{user?.phone || t('notProvided')}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <TbGlobe className="text-gray-500" size={20} />
                        <div>
                            <p className="text-sm text-gray-500">{t('fields.languages')}</p>
                            <p className="font-medium">
                                {agent?.languages?.join(', ') || t('notProvided')}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">{t('fields.bio')}</p>
                        <p className="font-medium">
                            {agent?.bio || t('noBioProvided')}
                        </p>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-500 mb-2">{t('fields.status')}</p>
                        <p className="font-medium">
                            {agent?.is_active 
                                ? <span className="text-green-600">{t('active')}</span>
                                : <span className="text-red-600">{t('inactive')}</span>
                            }
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h5 className="font-semibold mb-4">{t('statistics')}</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{agent?.leads_count || 0}</p>
                        <p className="text-sm text-gray-500">{t('activeLeads')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{agent?.appointments_count || 0}</p>
                        <p className="text-sm text-gray-500">{t('appointments')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{agent?.sales_count || 0}</p>
                        <p className="text-sm text-gray-500">{t('sales')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{agent?.rating || '0.0'}</p>
                        <p className="text-sm text-gray-500">{t('rating')}</p>
                    </div>
                </div>
            </div>
        </Card>
    )
}