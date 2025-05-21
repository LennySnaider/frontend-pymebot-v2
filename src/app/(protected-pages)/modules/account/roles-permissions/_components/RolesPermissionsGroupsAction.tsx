'use client'

import Button from '@/components/ui/Button'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import { useTranslations } from 'next-intl'
import { useAuthContext } from '@/components/providers/AuthProvider'

const RolesPermissionsGroupsAction = () => {
    const { setRoleDialog } = useRolePermissionsStore()
    const t = useTranslations()
    const { role } = useAuthContext()

    // Solo el super_admin puede crear roles
    if (role !== 'super_admin') {
        return null
    }

    return (
        <div>
            <Button
                variant="solid"
                onClick={() =>
                    setRoleDialog({
                        type: 'new',
                        open: true,
                    })
                }
            >
                {t('common.create')} {t('common.role')}
            </Button>
        </div>
    )
}

export default RolesPermissionsGroupsAction
