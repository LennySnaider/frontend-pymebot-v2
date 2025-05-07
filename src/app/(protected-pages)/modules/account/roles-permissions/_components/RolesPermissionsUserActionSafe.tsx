'use client'

/**
 * frontend/src/app/(protected-pages)/modules/account/roles-permissions/_components/RolesPermissionsUserActionSafe.tsx
 * Versión mejorada del componente RolesPermissionsUserAction usando componentes seguros.
 * Esta implementación evita errores de hidratación en los componentes Select.
 * @version 2.0.0
 * @updated 2025-04-30
 */

import Badge from '@/components/ui/Badge'
import DebouceInput from '@/components/shared/DebouceInput'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { TbSearch } from 'react-icons/tb'
import { components } from 'react-select'
import { SafeSelect } from '@/components/shared/safe-components'
import type { ControlProps, OptionProps } from 'react-select'

type StatusOption = {
    label: string
    value: string
    dotBackground: string
}

type RoleOption = {
    label: string
    value: string
}

const statusOptions = [
    { label: 'All', value: '', dotBackground: 'bg-gray-200' },
    { label: 'Active', value: 'active', dotBackground: 'bg-success' },
    { label: 'Blocked', value: 'blocked', dotBackground: 'bg-error' },
]

const roleOptions = [
    { label: 'All', value: '' },
    { label: 'Admin', value: 'admin' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Support', value: 'support' },
    { label: 'User', value: 'user' },
    { label: 'Auditor', value: 'auditor' },
    { label: 'Guest', value: 'guest' },
]

// Componente seguro para la opción de Select con Badge
const StatusSelectOption = (props: OptionProps<StatusOption>) => {
    const { Option } = components;
    return (
        <Option {...props}>
            <span className="flex items-center gap-2">
                <Badge className={props.data.dotBackground} />
                <span>{props.data.label}</span>
            </span>
        </Option>
    );
};

// Componente seguro para la opción de Role
const RoleSelectOption = (props: OptionProps<RoleOption>) => {
    const { Option } = components;
    return (
        <Option {...props}>
            <span>{props.data.label}</span>
        </Option>
    );
};

// Componente seguro para el control de Select con Badge
const CustomControl = ({ children, ...props }: ControlProps<StatusOption>) => {
    const { Control } = components;
    const selected = props.getValue()[0];
    return (
        <Control {...props}>
            {selected && (
                <div className="flex ml-3">
                    <Badge className={selected.dotBackground} />
                </div>
            )}
            {children}
        </Control>
    );
};

const RolesPermissionsUserActionSafe = () => {
    const filterData = useRolePermissionsStore((state) => state.filterData)
    const setFilterData = useRolePermissionsStore(
        (state) => state.setFilterData,
    )

    const { onAppendQueryParams } = useAppendQueryParams()

    const handleStatusChange = (status: string) => {
        setFilterData({ ...filterData, status })
        onAppendQueryParams({
            status,
        })
    }

    const handleRoleChange = (role: string) => {
        setFilterData({ ...filterData, role })
        onAppendQueryParams({
            role,
        })
    }

    const handleInputChange = (query: string) => {
        onAppendQueryParams({
            query,
        })
    }

    return (
        <div className="flex items-center justify-between">
            <DebouceInput
                className="max-w-[300px]"
                placeholder="Search..."
                type="text"
                size="sm"
                prefix={<TbSearch className="text-lg" />}
                onChange={(e) => handleInputChange(e.target.value)}
            />
            <div className="flex items-center gap-2">
                {/* Uso de SafeSelect para Status */}
                <SafeSelect<StatusOption, false>
                    instanceId="status"
                    className="min-w-[150px] w-full"
                    components={{
                        Control: CustomControl,
                        Option: StatusSelectOption,
                    }}
                    options={statusOptions}
                    size="sm"
                    placeholder="Status"
                    defaultValue={{
                        label: 'All',
                        value: '',
                        dotBackground: 'bg-gray-200',
                    }}
                    onChange={(option) =>
                        handleStatusChange(option?.value || '')
                    }
                    // Placeholder durante la carga
                    placeholderText="Status"
                />
                
                {/* Uso de SafeSelect para Role */}
                <SafeSelect<RoleOption>
                    instanceId="role"
                    className="min-w-[150px] w-full"
                    components={{
                        Option: RoleSelectOption,
                    }}
                    options={roleOptions}
                    size="sm"
                    placeholder="Role"
                    defaultValue={{ label: 'All', value: '' }}
                    value={roleOptions.find(
                        (option) => option.value === filterData.role,
                    )}
                    onChange={(option) => handleRoleChange(option?.value || '')}
                    // Placeholder durante la carga
                    placeholderText="Role"
                />
            </div>
        </div>
    )
}

export default RolesPermissionsUserActionSafe
