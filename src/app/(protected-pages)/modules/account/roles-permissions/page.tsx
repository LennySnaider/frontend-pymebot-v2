import Container from '@/components/shared/Container'
import RolesPermissionsGroups from './_components/RolesPermissionsGroups'
import RolesPermissionsGroupsAction from './_components/RolesPermissionsGroupsAction'
import RolesPermissionsUserActionSafe from './_components/RolesPermissionsUserActionSafe'
import RolesPermissionsUserTable from './_components/RolesPermissionsUserTable'
import RolesPermissionsUserSelected from './_components/RolesPermissionsUserSelected'
import RolesPermissionsAccessDialog from './_components/RolesPermissionsAccessDialog'
import RolesPermissionsProvider from './_components/RolesPermissionsProvider'
import PermissionsGuideButton from './_components/PermissionsGuideButton'
import CreateAgentButton from './_components/CreateAgentButton'
import getRolesPermissionsRoles from '@/server/actions/getRolesPermissionsRoles'
import getRolesPermissionsUsers from '@/server/actions/getRolesPermissionsUsers'
import type { PageProps } from '@/@types/common'
import { getTranslations } from 'next-intl/server'

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams
    const t = await getTranslations()

    const roleList = await getRolesPermissionsRoles()
    const userList = await getRolesPermissionsUsers(params)

    return (
        <RolesPermissionsProvider
            roleList={roleList}
            userList={userList.list}
            role={params.role as string}
            status={params.status as string}
            >
            <Container className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3>{t('common.roles')} {t('common.and')} {t('common.permissions')}</h3>
                        <div className="flex items-center gap-3">
                            <CreateAgentButton />
                            <PermissionsGuideButton />
                            <RolesPermissionsGroupsAction />
                        </div>
                    </div>
                    <div className="mb-10">
                        <RolesPermissionsGroups />
                    </div>
                </div>
                <div>
                    <div>
                        <div className="mb-6 flex flex-col gap-5">
                            <h3>{t('common.all')} {t('common.accounts')}</h3>
                            <div className="flex-1">
                                <RolesPermissionsUserActionSafe />
                            </div>
                        </div>
                        <RolesPermissionsUserTable
                            userListTotal={userList.total}
                            pageIndex={
                                parseInt(params.pageIndex as string) || 1
                            }
                            pageSize={parseInt(params.pageSize as string) || 10}
                        />
                    </div>
                </div>
            </Container>
            <RolesPermissionsAccessDialog />
            <RolesPermissionsUserSelected />
        </RolesPermissionsProvider>
    )
}
