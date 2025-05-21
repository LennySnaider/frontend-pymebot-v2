'use client'

import { useMemo, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Dropdown from '@/components/ui/Dropdown'
import DataTable from '@/components/shared/DataTable'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import dayjs from 'dayjs'
import { TbChevronDown, TbEdit, TbTrash } from 'react-icons/tb'
import type {
    User,
} from '../types'
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/ui/toast'
import { Notification } from '@/components/ui/Notification'
import EditAgentDialog from './EditAgentDialog'

type RolesPermissionsUserTableProps = {
    userListTotal?: number
    pageIndex?: number
    pageSize?: number
}

const statusColor: Record<string, string> = {
    active: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    blocked: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
}

const RolesPermissionsUserTable = (props: RolesPermissionsUserTableProps) => {
    const { userListTotal = 0, pageIndex = 1, pageSize = 10 } = props

    const initialLoading = useRolePermissionsStore(
        (state) => state.initialLoading,
    )
    const roleList = useRolePermissionsStore((state) => state.roleList)
    const userList = useRolePermissionsStore((state) => state.userList)
    const setUserList = useRolePermissionsStore((state) => state.setUserList)
    const selectedUser = useRolePermissionsStore((state) => state.selectedUser)
    const setSelectedUser = useRolePermissionsStore(
        (state) => state.setSelectedUser,
    )
    const setSelectAllUser = useRolePermissionsStore(
        (state) => state.setSelectAllUser,
    )

    const { onAppendQueryParams } = useAppendQueryParams()
    const t = useTranslations('agents')
    const tCommon = useTranslations('common')
    
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deletingUser, setDeletingUser] = useState<User | null>(null)

    const handlePaginationChange = (page: number) => {
        onAppendQueryParams({
            pageIndex: String(page),
        })
    }

    const handleSelectChange = (value: number) => {
        onAppendQueryParams({
            pageSize: String(value),
            pageIndex: '1',
        })
    }

    const handleSort = (sort: OnSortParam) => {
        onAppendQueryParams({
            order: sort.order,
            sortKey: sort.key,
        })
    }

    const handleRowSelect = (checked: boolean, row: User) => {
        setSelectedUser(checked, row)
    }

    const handleAllRowSelect = (checked: boolean, rows: Row<User>[]) => {
        if (checked) {
            const originalRows = rows.map((row) => row.original)
            setSelectAllUser(originalRows)
        } else {
            setSelectAllUser([])
        }
    }

    const handleRoleChange = (role: string, id: string) => {
        const newUserList = structuredClone(userList).map((user) => {
            if (user.id === id) {
                user.role = role
            }

            return user
        })

        setUserList(newUserList)
    }
    
    const handleEdit = (user: User) => {
        setEditingUser(user)
    }
    
    const handleDeleteConfirm = (user: User) => {
        setDeletingUser(user)
        setDeleteDialogOpen(true)
    }
    
    const handleDelete = async () => {
        if (!deletingUser) return
        
        try {
            const response = await fetch(`/api/admin/agents/${deletingUser.id}`, {
                method: 'DELETE',
            })
            
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al eliminar agente')
            }
            
            toast.push(
                <Notification title={tCommon('success')} type="success">
                    {t('messages.agentDeletedSuccessfully')}
                </Notification>
            )
            
            // Actualizar la lista de usuarios
            setUserList(userList.filter(u => u.id !== deletingUser.id))
            setDeleteDialogOpen(false)
            setDeletingUser(null)
            
        } catch (error: any) {
            toast.push(
                <Notification title={tCommon('error')} type="danger">
                    {error.message || t('messages.errorDeletingAgent')}
                </Notification>
            )
        }
    }

    const columns: ColumnDef<User>[] = useMemo(
        () => [
            {
                header: 'Name',
                accessorKey: 'full_name',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar size={40} shape="circle" src={row.avatar_url || row.img} />
                            <div>
                                <div className="font-bold heading-text">
                                    {row.full_name || row.name || row.email}
                                </div>
                                <div>{row.email}</div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[row.status || 'active']}>
                                <span className="capitalize">{row.status || 'active'}</span>
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: 'Last activity',
                accessorKey: 'last_activity',
                cell: (props) => {
                    const row = props.row.original
                    const lastActivity = row.last_activity || row.created_at
                    return (
                        <div className="flex flex-col">
                            <span className="font-semibold">
                                {lastActivity 
                                    ? dayjs(lastActivity).format('MMMM, D YYYY')
                                    : 'Never'}
                            </span>
                            <small>
                                {lastActivity 
                                    ? dayjs(lastActivity).format('hh:mm A')
                                    : ''}
                            </small>
                        </div>
                    )
                },
            },
            {
                header: 'Role',
                accessorKey: 'role',
                size: 70,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <Dropdown
                            renderTitle={
                                <div
                                    className="inline-flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                    role="button"
                                >
                                    <span className="font-bold heading-text">
                                        {
                                            roleList.find(
                                                (role) => role.id === row.role,
                                            )?.name
                                        }
                                    </span>
                                    <TbChevronDown />
                                </div>
                            }
                        >
                            {roleList
                                .filter((role) => role.id !== row.role)
                                .map((role) => (
                                    <Dropdown.Item
                                        key={role.id}
                                        eventKey={role.id}
                                        onClick={() =>
                                            handleRoleChange(role.id, row.id)
                                        }
                                    >
                                        {role.name}
                                    </Dropdown.Item>
                                ))}
                        </Dropdown>
                    )
                },
            },
            {
                header: 'Actions',
                id: 'actions',
                size: 120,
                cell: (props) => {
                    const row = props.row.original
                    const isAgent = row.role === 'agent'
                    
                    return (
                        <div className="flex items-center gap-2">
                            {isAgent && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        icon={<TbEdit />}
                                        onClick={() => handleEdit(row)}
                                    />
                                    <Button
                                        size="sm"
                                        variant="default"
                                        color="red"
                                        icon={<TbTrash />}
                                        onClick={() => handleDeleteConfirm(row)}
                                    />
                                </>
                            )}
                        </div>
                    )
                },
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [roleList, userList],
    )

    return (
        <>
            <DataTable
                selectable
                columns={columns}
                data={userList}
                noData={!initialLoading && userList.length === 0}
                skeletonAvatarColumns={[0]}
                skeletonAvatarProps={{ width: 28, height: 28 }}
                loading={initialLoading}
                pagingData={{
                    total: userListTotal,
                    pageIndex,
                    pageSize,
                }}
                checkboxChecked={(row) =>
                    selectedUser.some((selected) => selected.id === row.id)
                }
                hoverable={false}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectChange}
                onSort={handleSort}
                onCheckBoxChange={handleRowSelect}
                onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
            
            <Dialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <div className="p-6">
                    <h4 className="mb-4">{t('confirmDelete')}</h4>
                    <p className="mb-6">
                        {t('confirmDeleteMessage', {
                            name: deletingUser?.full_name || deletingUser?.email
                        })}
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            variant="solid"
                            color="red"
                            onClick={handleDelete}
                        >
                            {tCommon('delete')}
                        </Button>
                    </div>
                </div>
            </Dialog>
            
            {editingUser && (
                <EditAgentDialog
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={async () => {
                        setEditingUser(null)
                        // Recargar datos del agente actualizado
                        try {
                            const response = await fetch(`/api/admin/agents/${editingUser.id}`)
                            if (response.ok) {
                                const data = await response.json()
                                const updatedUser = data.agent
                                
                                // Actualizar el usuario en la lista
                                const newUserList = userList.map(user => 
                                    user.id === updatedUser.id ? updatedUser : user
                                )
                                setUserList(newUserList)
                            }
                        } catch (error) {
                            console.error('Error actualizando lista:', error)
                        }
                    }}
                />
            )}
        </>
    )
}

export default RolesPermissionsUserTable
