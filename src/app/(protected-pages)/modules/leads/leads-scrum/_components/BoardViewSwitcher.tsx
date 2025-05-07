/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/BoardViewSwitcher.tsx
 * Componente para cambiar entre vista Kanban y vista Lista
 * Ahora también incluye avatares de usuarios y controles de acción.
 * Optimizado para pantallas móviles con iconos en lugar de texto.
 *
 * @version 1.3.0
 * @updated 2025-03-31
 */

'use client'

import { useTranslations } from 'next-intl'
import Switcher from '@/components/ui/Switcher'
import Button from '@/components/ui/Button'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import {
    TbLayoutKanban,
    TbList,
    TbUserPlus,
    TbSettings,
    TbPlus,
} from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import type { Member } from '../types'

interface BoardViewSwitcherProps {
    isKanbanView: boolean
    onChange: (checked: boolean) => void
    boardMembers: Member[]
}

const BoardViewSwitcher = ({
    isKanbanView,
    onChange,
    boardMembers = [],
}: BoardViewSwitcherProps) => {
    const t = useTranslations('scrumboard')
    const router = useRouter()
    const { updateDialogView, openDialog } = useScrumBoardStore()

    // Manejadores de eventos
    const onAddMember = () => {
        updateDialogView('ADD_MEMBER')
        openDialog()
    }

    const handleAddNewColumn = () => {
        updateDialogView('NEW_COLUMN')
        openDialog()
    }

    // Función para crear el contenido del switcher con iconos
    const withIcon = (component: React.ReactNode) => {
        return <div className="text-lg">{component}</div>
    }

    // Intentar obtener las traducciones, caer en valores por defecto si no existen
    let viewKanbanText = 'Vista Kanban'
    let viewListText = 'Vista de Lista'
    const newBoardText = 'Nuevo Tablero'

    try {
        const kanbanTranslation = t('views.kanban')
        if (kanbanTranslation) {
            viewKanbanText = kanbanTranslation
        }
    } catch {
        // Ignorar error si falla la traducción, usar valor por defecto
    }

    try {
        const listTranslation = t('views.list')
        if (listTranslation) {
            viewListText = listTranslation
        }
    } catch {
        // Ignorar error si falla la traducción, usar valor por defecto
    }

    return (
        <div className="flex flex-row items-center gap-2 flex-wrap justify-end">
            {/* Controles de usuario y botones de acción */}
            <div className="flex items-center gap-2 mr-2">
                <UsersAvatarGroup
                    className="flex items-center"
                    avatarProps={{ size: 30 }}
                    users={boardMembers}
                />
                <Button size="sm" icon={<TbUserPlus />} onClick={onAddMember} />
                <Button
                    size="sm"
                    icon={<TbSettings />}
                    onClick={() => router.push('/app/account/settings/profile')}
                />
                <Button
                    size="sm"
                    icon={<TbPlus />}
                    onClick={handleAddNewColumn}
                    className="hidden sm:flex"
                >
                    <span>{newBoardText}</span>
                </Button>
                <Button
                    size="sm"
                    icon={<TbPlus />}
                    onClick={handleAddNewColumn}
                    className="flex sm:hidden"
                />
            </div>

            {/* Switch de vista kanban/lista con texto - solo visible en pantallas más grandes */}
            <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium">
                    {isKanbanView ? viewKanbanText : viewListText}
                </span>
                <Switcher checked={isKanbanView} onChange={onChange} />
            </div>

            {/* Switch de vista kanban/lista con iconos - visible en pantallas pequeñas */}
            <div className="flex sm:hidden items-center">
                <Switcher
                    checked={isKanbanView}
                    onChange={onChange}
                    unCheckedContent={withIcon(<TbList />)}
                    checkedContent={withIcon(<TbLayoutKanban />)}
                />
            </div>

            {/* Botones de vista alternativos visibles en móvil */}
            <div className="hidden">
                <Button
                    size="sm"
                    variant={isKanbanView ? 'solid' : 'plain'}
                    icon={<TbLayoutKanban />}
                    onClick={() => onChange(true)}
                    className="rounded-r-none"
                />
                <Button
                    size="sm"
                    variant={!isKanbanView ? 'solid' : 'plain'}
                    icon={<TbList />}
                    onClick={() => onChange(false)}
                    className="rounded-l-none"
                />
            </div>
        </div>
    )
}

export default BoardViewSwitcher
