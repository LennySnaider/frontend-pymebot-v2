'use client'

import Menu from '@/components/ui/Menu'
import ScrollBar from '@/components/ui/ScrollBar'
import { useSettingsStore } from '../_store/settingsStore'

import {
    TbUserSquare,
    TbLock,
    TbBell,
    TbFileDollar,
    TbRefreshDot,
    TbBuilding,
    TbClock,
} from 'react-icons/tb'
import { useSearchParams } from 'next/navigation'
import type { View } from '../types'
import type { ReactNode } from 'react'

const { MenuItem } = Menu

const menuList: { label: string; value: View; icon: ReactNode }[] = [
    { label: 'Perfil', value: 'profile', icon: <TbUserSquare /> },
    { label: 'Empresa', value: 'business', icon: <TbBuilding /> },
    { label: 'Horarios', value: 'business-hours', icon: <TbClock /> },
    { label: 'Seguridad', value: 'security', icon: <TbLock /> },
    { label: 'Notificaciones', value: 'notification', icon: <TbBell /> },
    { label: 'Facturación', value: 'billing', icon: <TbFileDollar /> },
    { label: 'Integraciones', value: 'integration', icon: <TbRefreshDot /> },
]

export const SettingsMenu = ({ onChange }: { onChange?: () => void }) => {
    const searchParams = useSearchParams()

    const { currentView, setCurrentView } = useSettingsStore()

    const currentPath =
        searchParams.get('category') || searchParams.get('label') || 'inbox'

    const handleSelect = (value: View) => {
        setCurrentView(value)
        onChange?.()
    }

    return (
        <div className="flex flex-col justify-between h-full">
            <ScrollBar className="h-full overflow-y-auto">
                <Menu className="mx-2 mb-10">
                    {menuList.map((menu) => (
                        <MenuItem
                            key={menu.value}
                            eventKey={menu.value}
                            className={`mb-2 ${
                                currentView === menu.value
                                    ? 'bg-gray-100 dark:bg-gray-700'
                                    : ''
                            }`}
                            isActive={currentPath === menu.value}
                            onSelect={() => handleSelect(menu.value)}
                        >
                            <span className="text-2xl ltr:mr-2 rtl:ml-2">
                                {menu.icon}
                            </span>
                            <span>{menu.label}</span>
                        </MenuItem>
                    ))}
                </Menu>
            </ScrollBar>
        </div>
    )
}

export default SettingsMenu
