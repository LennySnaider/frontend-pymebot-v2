/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/FunnelViewSwitcher.tsx
 * Componente para cambiar entre vista Kanban y vista Lista para el embudo de ventas inmobiliario.
 * Incluye controles para búsqueda, añadir prospectos, miembros y configuración.
 *
 * @version 2.1.0
 * @updated 2025-04-29
 */

'use client'

import { useTranslations } from 'next-intl'
import Switcher from '@/components/ui/Switcher'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import {
    TbLayoutKanban,
    TbList,
    TbUserPlus,
    TbPlus,
    TbSearch,
    TbX
} from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import type { Member } from '../types'
import { useState, useEffect } from 'react'

interface FunnelViewSwitcherProps {
    isKanbanView: boolean
    onChange: (checked: boolean) => void
    boardMembers: Member[]
}

const FunnelViewSwitcher = ({
    isKanbanView,
    onChange,
    boardMembers = [],
}: FunnelViewSwitcherProps) => {
    // Usando namespace "scrumboard" para mantener compatibilidad con traducciones existentes
    const t = useTranslations('scrumboard')
    const router = useRouter()

    // Obtenemos las funciones del store correcto
    const { 
        updateDialogView, 
        openDialog, 
        setSelectedLeadId, 
        searchLeads, 
        clearSearch,
        searchQuery: storeSearchQuery 
    } = useSalesFunnelStore()

    // Estado para controlar el valor del campo de búsqueda, sincronizado con el store
    const [searchQuery, setSearchQuery] = useState(storeSearchQuery || '')

    // Sincronizar el estado local con el store cuando cambie en el store
    useEffect(() => {
        setSearchQuery(storeSearchQuery || '')
    }, [storeSearchQuery])

    // Manejadores de eventos
    const onAddMember = () => {
        updateDialogView('ADD_MEMBER')
        openDialog()
    }

    // Función para agregar nuevo prospecto
    const onAddNewProspect = () => {
        setSelectedLeadId('') // Limpiamos cualquier selección previa
        updateDialogView('NEW_LEAD') // Usamos 'NEW_LEAD' como está definido en el store
        openDialog()
    }

    // Manejador para la búsqueda de prospectos
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // Delay para evitar demasiadas búsquedas al escribir rápido
        const debounceTimer = setTimeout(() => {
            if (value.trim() === '') {
                clearSearch();
            } else {
                searchLeads(value);
            }
        }, 300);
        
        return () => clearTimeout(debounceTimer);
    };
    
    // Función para limpiar la búsqueda
    const handleClearSearch = () => {
        setSearchQuery('');
        clearSearch();
    };

    // Función para crear el contenido del switcher con iconos
    const withIcon = (component: React.ReactNode) => {
        return <div className="text-lg">{component}</div>
    }

    // Intentar obtener las traducciones, caer en valores por defecto si no existen
    let viewKanbanText = 'Vista Kanban'
    let viewListText = 'Vista de Lista'
    let newProspectText = 'Añadir prospecto'
    let searchPlaceholder = 'Buscar prospectos...'

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

    try {
        const prospectTranslation = t('header.newLead')
        if (prospectTranslation) {
            newProspectText = prospectTranslation
        }
    } catch {
        // Ignorar error si falla la traducción, usar valor por defecto
    }

    try {
        const searchTranslation = t('header.searchLeads')
        if (searchTranslation) {
            searchPlaceholder = searchTranslation
        }
    } catch {
        // Ignorar error si falla la traducción, usar valor por defecto
    }

    return (
        <div className="flex flex-row items-center gap-2 flex-wrap justify-between w-full">
            {/* Campo de búsqueda - adaptativo para diferentes tamaños de pantalla */}
            <div className="order-2 md:order-1 w-full md:w-auto mt-2 md:mt-0 md:flex-1 max-w-md relative">
                <Input
                    prefix={<TbSearch className="text-xl" />}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full"
                    suffix={
                        searchQuery ? (
                            <button 
                                onClick={handleClearSearch}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                aria-label="Limpiar búsqueda"
                            >
                                <TbX className="text-lg" />
                            </button>
                        ) : null
                    }
                />
            </div>

            <div className="flex flex-row items-center gap-2 flex-wrap order-1 md:order-2 justify-end">
                {/* Controles de usuario y botones de acción */}
                <div className="flex items-center gap-2 mr-2">
                    <UsersAvatarGroup
                        className="flex items-center"
                        avatarProps={{ size: 30 }}
                        users={boardMembers}
                    />
                    <Button
                        size="sm"
                        icon={<TbUserPlus />}
                        onClick={onAddMember}
                    />

                    {/* Botón añadir prospecto - con texto en pantallas medianas y grandes */}
                    <Button
                        size="sm"
                        icon={<TbPlus />}
                        onClick={onAddNewProspect}
                        className="hidden sm:flex"
                    >
                        <span>{newProspectText}</span>
                    </Button>

                    {/* Botón añadir prospecto - solo icono en pantallas pequeñas */}
                    <Button
                        size="sm"
                        icon={<TbPlus />}
                        onClick={onAddNewProspect}
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
            </div>
        </div>
    )
}

export default FunnelViewSwitcher
