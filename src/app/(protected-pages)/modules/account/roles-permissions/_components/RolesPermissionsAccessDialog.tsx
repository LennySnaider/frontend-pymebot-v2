'use client'
import { useMemo, useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Segment from '@/components/ui/Segment'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import ScrollBar from '@/components/ui/ScrollBar'
import { FormItem } from '@/components/ui/Form'
import hooks from '@/components/ui/hooks'
import usePermissions from '@/lib/core/permissions'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import { accessModules } from '../constants'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import sleep from '@/utils/sleep'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useTenantModules } from '@/hooks/useTenantModules'
import { useAuthContext } from '@/components/providers/AuthProvider'
import {
    TbUserCog,
    TbBox,
    TbSettings,
    TbFiles,
    TbFileChart,
    TbCheck,
    TbTrash
} from 'react-icons/tb'
import type { ReactNode } from 'react'

const moduleIcon: Record<string, ReactNode> = {
    users: <TbUserCog />,
    products: <TbBox />,
    configurations: <TbSettings />,
    files: <TbFiles />,
    reports: <TbFileChart />,
}

const { useUniqueId } = hooks

const RolesPermissionsAccessDialog = () => {
    const { isSuperAdmin } = usePermissions();
    const { modules: tenantModules, loading: modulesLoading } = useTenantModules()
    const { role: userRole } = useAuthContext()
    const roleList = useRolePermissionsStore((state) => state.roleList)
    const setRoleList = useRolePermissionsStore((state) => state.setRoleList)

    const setRoleDialog = useRolePermissionsStore(
        (state) => state.setRoleDialog,
    )
    const setSelectedRole = useRolePermissionsStore(
        (state) => state.setSelectedRole,
    )

    const selectedRole = useRolePermissionsStore((state) => state.selectedRole)
    const roleDialog = useRolePermissionsStore((state) => state.roleDialog)

    const [accessRight, setAccessRight] = useState<Record<string, string[]>>({})
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const roleNameRef = useRef<HTMLInputElement>(null)
    const descriptionRef = useRef<HTMLTextAreaElement>(null)

    const newId = useUniqueId('role-')

    const handleClose = () => {
        setRoleDialog({
            type: '',
            open: false,
        })
    }

    const handleUpdate = async () => {
        handleClose()
        await sleep(300)
        setSelectedRole('')
    }

    const handleSubmit = async () => {
        const newRoleList = structuredClone(roleList)
        newRoleList.push({
            id: newId,
            name: roleNameRef.current?.value || `Untitle-${newId}`,
            description: descriptionRef.current?.value || '',
            users: [],
            accessRight,
        })
        setRoleList(newRoleList)
        handleClose()
    }

    const handleDeleteConfirmOpen = () => {
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirmClose = () => {
        setDeleteConfirmOpen(false);
    };

    const handleDeleteRole = () => {
        const newRoleList = roleList.filter(role => role.id !== selectedRole);
        setRoleList(newRoleList);
        setDeleteConfirmOpen(false);
        handleClose();
    };

    const modules = useMemo(() => {
        const role = roleList.find((role) => role.id === selectedRole)
        // Asegurar que el rol tenga las propiedades necesarias
        if (role) {
            return {
                ...role,
                accessRight: role.accessRight || {},
                users: role.users || []
            }
        }
        return null
    }, [selectedRole, roleList])

    const handleChange = (accessRight: string[], key: string) => {
        if (roleDialog.type === 'new') {
            setAccessRight((value) => {
                return {
                    ...value,
                    [key]: accessRight
                }
            })
        }

        if (roleDialog.type === 'edit') {
            const newRoleList = structuredClone(roleList).map((role) => {
                if (role.id === selectedRole) {
                    role.accessRight = role.accessRight || {}
                    role.accessRight[key] = accessRight
                }

                return role
            })

            setRoleList(newRoleList)
        }
    }

    // Mapear los módulos del tenant a los módulos de permisos
    const moduleCodeToPermissionId: Record<string, string> = {
        'users': 'users',
        'customers': 'users',
        'leads': 'users',
        'products': 'products',
        'sales': 'products',
        'orders': 'products',
        'appointments': 'configurations',
        'calendar': 'configurations',
        'settings': 'configurations',
        'file-manager': 'files',
        'analytics': 'reports',
        'reports': 'reports'
    }

    // Filtrar los módulos de permisos según los módulos activos del tenant
    const availableModules = useMemo(() => {
        // Si es super_admin, mostrar todos los módulos
        if (userRole === 'super_admin') {
            return accessModules
        }

        // Si aún no se han cargado los módulos del tenant, mostrar ninguno
        if (modulesLoading) {
            return []
        }

        // Filtrar módulos según los que estén activos en el tenant
        const activeModuleCodes = tenantModules.map(tm => tm.module.code)
        
        return accessModules.filter(module => {
            const moduleCode = Object.entries(moduleCodeToPermissionId)
                .find(([_, permId]) => permId === module.id)?.[0]
            
            return moduleCode && activeModuleCodes.includes(moduleCode)
        })
    }, [tenantModules, modulesLoading, userRole, moduleCodeToPermissionId])

    return (
        <>
            <Dialog
                isOpen={roleDialog.open}
                width={900}
                onClose={handleClose}
                onRequestClose={handleClose}
            >
                <h4>{roleDialog.type === 'new' ? 'Create role' : modules?.name}</h4>
                <ScrollBar className="mt-6 max-h-[600px] overflow-y-auto">
                    <div className="px-4">
                        {roleDialog.type === 'new' && (
                            <>
                                <FormItem label="Role name">
                                    <Input ref={roleNameRef} />
                                </FormItem>
                                <FormItem label="Description">
                                    <Input ref={descriptionRef} textArea />
                                </FormItem>
                                <span className="font-semibold mb-2">
                                    Permission
                                </span>
                            </>
                        )}
                        {modulesLoading && userRole !== 'super_admin' ? (
                            <div className="text-center py-4">
                                <span>Cargando módulos disponibles...</span>
                            </div>
                        ) : (
                            availableModules.map((module, index) => (
                            <div
                                key={module.id}
                                className={classNames(
                                    'flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-gray-200 dark:border-gray-600',
                                    !isLastChild(availableModules, index) &&
                                        'border-b',
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        className="bg-transparent dark:bg-transparent p-2 border-2 border-gray-200 dark:border-gray-600 text-primary"
                                        size={50}
                                        icon={moduleIcon[module.id]}
                                        shape="round"
                                    />
                                    <div>
                                        <h6 className="font-bold">{module.name}</h6>
                                        <span>{module.description}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Segment
                                        className="bg-transparent dark:bg-transparent"
                                        selectionType="multiple"
                                        value={modules?.accessRight[module.id]}
                                        onChange={(val) =>
                                            handleChange(val as string[], module.id)
                                        }
                                    >
                                        {module.accessor.map((access) => (
                                            <Segment.Item
                                                key={module.id + access.value}
                                                value={access.value}
                                            >
                                                {({
                                                    active,
                                                    onSegmentItemClick,
                                                }) => {
                                                    return (
                                                        <Button
                                                            variant="default"
                                                            icon={
                                                                active ? (
                                                                    <TbCheck className="text-primary text-xl" />
                                                                ) : (
                                                                    <></>
                                                                )
                                                            }
                                                            active={active}
                                                            type="button"
                                                            className="md:min-w-[100px]"
                                                            size="sm"
                                                            customColorClass={({
                                                                active,
                                                            }) =>
                                                                classNames(
                                                                    active &&
                                                                        'bg-transparent dark:bg-transparent text-primary border-primary ring-1 ring-primary',
                                                                )
                                                            }
                                                            onClick={
                                                                onSegmentItemClick
                                                            }
                                                        >
                                                            {access.label}
                                                        </Button>
                                                    )
                                                }}
                                            </Segment.Item>
                                        ))}
                                    </Segment>
                                </div>
                            </div>
                        ))
                        )}
                        <div className="flex justify-end mt-6">
                            <Button
                                className="ltr:mr-2 rtl:ml-2"
                                variant="plain"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                            
                            {roleDialog.type === 'edit' && isSuperAdmin() && (
                                <Button
                                    className="ltr:mr-2 rtl:ml-2"
                                    variant="plain"
                                    type="button"
                                    icon={<TbTrash />}
                                    customColorClass={() =>
                                        'text-error hover:bg-error-100 dark:hover:bg-error-900/20 hover:text-error'
                                    }
                                    onClick={handleDeleteConfirmOpen}
                                >
                                    Delete
                                </Button>
                            )}
                            
                            <Button
                                variant="solid"
                                onClick={
                                    roleDialog.type === 'edit'
                                        ? handleUpdate
                                        : handleSubmit
                                }
                            >
                                {roleDialog.type === 'edit' ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </ScrollBar>
            </Dialog>
            
            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                type="danger"
                title="Delete Role"
                onClose={handleDeleteConfirmClose}
                onRequestClose={handleDeleteConfirmClose}
                onCancel={handleDeleteConfirmClose}
                onConfirm={handleDeleteRole}
            >
                <p>
                    Are you sure you want to delete this role? This action cannot be undone and will remove
                    all users from this role.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default RolesPermissionsAccessDialog