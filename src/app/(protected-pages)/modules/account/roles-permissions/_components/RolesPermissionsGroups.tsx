'use client'

import Button from '@/components/ui/Button'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import Skeleton from '@/components/ui/Skeleton'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import RolesPermissionsDeleteButton from './RolesPermissionsDeleteButton'
import { TbArrowRight, TbShieldCheck, TbShield, TbUsers, TbEye } from 'react-icons/tb'
import { useTranslations } from 'next-intl'

const RolesPermissionsGroups = () => {
    const t = useTranslations()
    const roleList = useRolePermissionsStore((state) => state.roleList)
    const setRoleDialog = useRolePermissionsStore(
        (state) => state.setRoleDialog,
    )
    const setSelectedRole = useRolePermissionsStore(
        (state) => state.setSelectedRole,
    )
    const initialLoading = useRolePermissionsStore(
        (state) => state.initialLoading,
    )
    
    // Ordenar roles por jerarquía
    const roleHierarchy = [
        'super_admin',
        'admin',
        'agent',
        'viewer'
    ]
    
    const sortedRoleList = [...roleList].sort((a, b) => {
        const aIndex = roleHierarchy.indexOf(a.name)
        const bIndex = roleHierarchy.indexOf(b.name)
        
        // Si ambos están en la jerarquía, ordenar por índice
        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex
        }
        
        // Si solo uno está en la jerarquía, ponerlo primero
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        
        // Si ninguno está en la jerarquía, ordenar alfabéticamente
        return a.name.localeCompare(b.name)
    })

    const handleEditRoleClick = (id: string) => {
        setSelectedRole(id)
        setRoleDialog({
            type: 'edit',
            open: true,
        })
    }
    
    // Definir estilos por rol
    const getRoleStyles = (roleName: string) => {
        switch(roleName) {
            case 'super_admin':
                return 'bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700'
            case 'admin':
                return 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
            case 'agent':
                return 'bg-green-100 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
            case 'viewer':
                return 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
            default:
                return 'bg-gray-100 dark:bg-gray-700'
        }
    }
    
    // Definir íconos por rol
    const getRoleIcon = (roleName: string) => {
        switch(roleName) {
            case 'super_admin':
                return <TbShieldCheck className="text-purple-600 dark:text-purple-400 text-xl" />
            case 'admin':
                return <TbShield className="text-blue-600 dark:text-blue-400 text-xl" />
            case 'agent':
                return <TbUsers className="text-green-600 dark:text-green-400 text-xl" />
            case 'viewer':
                return <TbEye className="text-gray-600 dark:text-gray-400 text-xl" />
            default:
                return null
        }
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {initialLoading && roleList.length === 0 ? (
                <>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                        key={index}
                        className="flex flex-col justify-between rounded-2xl p-5 bg-gray-100 dark:bg-gray-700 min-h-[140px]"
                        >
                            <div className="flex flex-auto flex-col justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <Skeleton
                                            variant="circle"
                                            height={35}
                                            width={35}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4 w-full">
                                        <Skeleton height={10} />
                                        <Skeleton height={10} width="60%" />
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        <Skeleton
                                            variant="circle"
                                            height={20}
                                            width={20}
                                        />
                                    </div>
                                    <Skeleton height={10} width="30%" />
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                sortedRoleList.map((role) => (
                    <div
                        key={role.id}
                        className={`flex flex-col justify-between rounded-2xl p-5 min-h-[140px] ${getRoleStyles(role.name)}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getRoleIcon(role.name)}
                                <h6 className="font-bold">{t(`roles.roleNames.${role.name}`)}</h6>
                            </div>
                            <RolesPermissionsDeleteButton roleId={role.id} />
                        </div>
                        <p className="mt-2">{t(`roles.roleDescriptions.${role.name}`)}</p>
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex flex-col">
                                <div className="-ml-2">
                                    <UsersAvatarGroup
                                        avatarProps={{
                                            className:
                                                'cursor-pointer -mr-2 border-2 border-white dark:border-gray-500',
                                            size: 28,
                                        }}
                                        avatarGroupProps={{ maxCount: 3 }}
                                        chained={false}
                                        users={role.users}
                                        nameKey="full_name"
                                        imgKey="avatar_url"
                                    />
                                </div>
                            </div>
                            <Button
                                variant="plain"
                                size="sm"
                                className="py-0 h-auto"
                                icon={<TbArrowRight />}
                                iconAlignment="end"
                                onClick={() => handleEditRoleClick(role.id)}
                            >
                                {t('roles.editRole')}
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

export default RolesPermissionsGroups
