'use client'

import Button from '@/components/ui/Button'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import { useTranslations } from 'next-intl'

const RolesPermissionsGroupsAction = () => {
    const { setRoleDialog } = useRolePermissionsStore()
    const t = useTranslations()

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
