/**
 * frontend/src/app/(protected-pages)/leads/leads-scrum/_components/FunnelTitle.tsx
 * Título del funnel de ventas inmobiliario con opciones y controles.
 *
 * @version 3.0.0
 * @updated 2025-04-12
 */

'use client'

import { useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import { TbPlus } from 'react-icons/tb'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'

interface FunnelTitleProps {
    title: string
    onAddNewColumn: () => void
    onSaveFunnelTitle?: (title: string) => void
}

const FunnelTitle = ({
    title,
    onAddNewColumn,
    onSaveFunnelTitle,
}: FunnelTitleProps) => {
    const [editMode, setEditMode] = useState(false)
    const [funnelTitle, setFunnelTitle] = useState(title)
    const inputRef = useRef<HTMLInputElement>(null)

    const { updateDialogView, openDialog } = useSalesFunnelStore()

    // Iniciar la edición del título
    const handleStartEdit = () => {
        setEditMode(true)
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus()
            }
        }, 100)
    }

    // Guardar el título
    const handleSave = () => {
        setEditMode(false)
        if (funnelTitle !== title && onSaveFunnelTitle) {
            onSaveFunnelTitle(funnelTitle)
        }
    }

    // Manejar el cambio en el input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFunnelTitle(e.target.value)
    }

    // Manejar tecla Enter para guardar
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave()
        }
    }

    // Abrir el modal para añadir miembros
    const handleAddMember = () => {
        updateDialogView('ADD_MEMBER')
        openDialog()
    }

    return (
        <div className="flex items-center justify-between mb-4">
            <div>
                {editMode ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={funnelTitle}
                        onChange={handleChange}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="text-xl font-semibold outline-none bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 px-0 py-1 w-full focus:ring-0"
                    />
                ) : (
                    <h4
                        className="text-xl font-semibold cursor-pointer hover:underline"
                        onClick={handleStartEdit}
                    >
                        {title}
                    </h4>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="plain" onClick={handleAddMember}>
                    Añadir agente
                </Button>
                <Button
                    size="sm"
                    variant="plain"
                    icon={<TbPlus />}
                    onClick={onAddNewColumn}
                >
                    Añadir etapa
                </Button>
            </div>
        </div>
    )
}

export default FunnelTitle
