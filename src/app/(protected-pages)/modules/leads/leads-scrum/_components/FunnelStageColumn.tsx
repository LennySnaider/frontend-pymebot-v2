/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/FunnelStageColumn.tsx
 * Columna que representa una etapa del funnel de ventas inmobiliario.
 * Contiene una lista de leads y permite añadir nuevos.
 *
 * @version 4.1.0
 * @updated 2025-04-11
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Draggable, Droppable } from '@hello-pangea/dnd'
import LeadCardList from './LeadCardList'
import { TbDotsVertical, TbEdit, TbTrash } from 'react-icons/tb'
import Dropdown from '@/components/ui/Dropdown'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import type { Lead } from '../types'
import type { DraggableChildrenFn, DropResult } from '@hello-pangea/dnd'
import { useTranslations } from 'next-intl'

interface FunnelStageColumnProps {
    title: string
    index: number
    contents: Lead[]
    isScrollable?: boolean
    isCombineEnabled?: boolean
    useClone?: DraggableChildrenFn
    isFinalStage?: boolean
    dropHint?: string
    onDrop?: (result: DropResult) => void
}

const FunnelStageColumn = ({
    title,
    index,
    contents,
    isFinalStage = false,
    dropHint,
    onDrop,
}: FunnelStageColumnProps) => {
    const [editMode, setEditMode] = useState(false)
    const [columnName, setColumnName] = useState(title)
    const [isOver, setIsOver] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updateColumns, openAppointmentDialog } = useSalesFunnelStore()

    // Añadimos el hook de traducción
    const t = useTranslations('salesFunnel.columns.defaultNames')

    // Efecto para forzar scroll al tope cuando se monte el componente
    useEffect(() => {
        // Usar setTimeout para asegurar que el DOM esté completamente listo
        const timer = setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0
            }
        }, 100)
        
        return () => clearTimeout(timer)
    }, []) // Solo ejecutar al montar
    
    // Efecto adicional para resetear scroll cuando cambien los contenidos
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
    }, [contents.length])

    // Efecto para prevenir scroll automático durante drag
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const preventAutoScroll = (e: Event) => {
            // Solo prevenir si hay un drag activo
            if (container.classList.contains('dragging')) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        container.addEventListener('scroll', preventAutoScroll, { passive: false })
        
        return () => {
            container.removeEventListener('scroll', preventAutoScroll)
        }
    }, [])

    // Función para obtener el título traducido basado en la clave del título
    const getTranslatedTitle = (columnTitle: string) => {
        // Convertir la primera letra a minúscula para que coincida con las claves en el archivo de traducción
        const translationKey =
            columnTitle.charAt(0).toLowerCase() + columnTitle.slice(1)

        // Verificar si existe una traducción para esta clave
        try {
            return t(translationKey)
        } catch (error) {
            // Si no existe traducción, devolver el título original
            return columnTitle
        }
    }

    // Manejar el inicio de la edición del nombre de la columna
    const handleStartEdit = () => {
        setEditMode(true)
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus()
            }
        }, 100)
    }

    // Manejar el guardado de la edición
    const handleSave = () => {
        setEditMode(false)
        // Aquí se implementaría la lógica para guardar el nuevo nombre
        console.log('Column renamed from', title, 'to', columnName)
    }

    // Manejar el cambio en el input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setColumnName(e.target.value)
    }

    // Manejar la tecla Enter para guardar
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave()
        }
    }

    // Manejar la eliminación de la columna
    const handleRemove = () => {
        // Aquí se implementaría la lógica para eliminar la columna
        console.log('Removing column', title)
    }

    // Menú contextual para las opciones de la columna
    const dropdownItems = [
        {
            key: 'rename',
            label: 'Renombrar etapa',
            icon: <TbEdit className="text-base" />,
            onClick: handleStartEdit,
        },
        {
            key: 'remove',
            label: 'Eliminar etapa',
            icon: <TbTrash className="text-base" />,
            onClick: handleRemove,
        },
    ]

    // Generar las clases para el área de drop
    const getDropAreaClass = () => {
        const isConfirmed = title === 'confirmed'
        const isClosed = title === 'closed'

        // Clases comunes para mantener una altura consistente
        const baseClasses = `
            h-full flex flex-col items-center justify-center
            border-2 border-dashed rounded-lg transition-colors duration-200
        `

        if (isConfirmed) {
            return `${baseClasses}
                bg-green-50 dark:bg-green-900/20
                ${isOver ? 'border-green-400 dark:border-green-600' : 'border-green-200 dark:border-green-800'}
            `
        }

        if (isClosed) {
            return `${baseClasses}
                bg-red-50 dark:bg-red-900/20
                ${isOver ? 'border-red-400 dark:border-red-600' : 'border-red-200 dark:border-red-800'}
            `
        }

        return 'h-full flex-1'
    }
    
    // No necesitamos estilos CSS fijos ya que ahora usamos flexbox

    return (
        <Draggable draggableId={title} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    className={`board-column min-w-[280px] w-[280px] flex flex-col mr-4 rtl:ml-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${snapshot.isDragging ? 'scrollbar-hide' : ''} sm:h-full md:h-full h-[calc(100vh-200px)]`}
                    style={{
                        ...provided.draggableProps.style,
                        width: '280px',             // Base width
                        minWidth: '280px',           // Fixed minimum width
                        maxWidth: '280px',           // Fixed maximum width
                        minHeight: '500px',          // Altura mínima para móviles
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    {...provided.draggableProps}
                    onDragOver={() => isFinalStage && setIsOver(true)}
                    onDragLeave={() => isFinalStage && setIsOver(false)}
                    onDrop={() => isFinalStage && setIsOver(false)}
                    data-stage={title}
                >
                    <div
                        className="flex items-center justify-between w-full"
                        {...provided.dragHandleProps}
                    >
                        {editMode ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={columnName}
                                onChange={handleChange}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                className="text-base font-semibold outline-none bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 px-0 py-1 w-full focus:ring-0"
                            />
                        ) : (
                            <div className="board-column-header flex items-center justify-between w-full overflow-hidden">
                                <h6 className="text-base font-semibold truncate mr-2">
                                    {getTranslatedTitle(title)}
                                </h6>
                                <span className="text-sm font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md flex-shrink-0">
                                    {contents?.length || 0}
                                </span>
                            </div>
                        )}
                        {!isFinalStage && (
                            <div className="ml-2 flex-shrink-0">
                                <Dropdown
                                    placement="bottom-end"
                                    renderTitle={
                                        <TbDotsVertical className="text-lg cursor-pointer" />
                                    }
                                    // @ts-ignore - El tipo de Dropdown debe ser actualizado en la definición
                                    items={dropdownItems}
                                />
                            </div>
                        )}
                    </div>

                    {!isFinalStage ? (
                        <Droppable
                            droppableId={title}
                            type="CONTENT"
                            isDropDisabled={snapshot.isDragging}
                        >
                            {(provided, snapshot) => (
                                <div
                                    ref={(el) => {
                                        provided.innerRef(el)
                                        scrollContainerRef.current = el
                                    }}
                                    className={`flex-1 overflow-y-auto overflow-x-visible mt-2 pb-0 ${
                                        snapshot.isDraggingOver
                                            ? 'bg-gray-100 dark:bg-gray-700'
                                            : ''
                                    }`}
                                    style={{
                                        maxHeight: 'calc(100% - 60px)',
                                        height: 'calc(100% - 60px)',
                                        minHeight: '400px',
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: '#cbd5e0 transparent'
                                    }}
                                    {...provided.droppableProps}
                                >
                                    <LeadCardList
                                        leads={contents || []}
                                        listId={title}
                                    />
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    ) : (
                        /* Área de drop para estados finales (confirmado/cerrado) */
                        <Droppable
                            droppableId={title}
                            type="CONTENT"
                            isDropDisabled={snapshot.isDragging}
                        >
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    className={`flex-1 mt-2 ${getDropAreaClass()} overflow-hidden`}
                                    style={{
                                        minHeight: '400px',
                                        height: 'calc(100% - 60px)'
                                    }}
                                    {...provided.droppableProps}
                                    // Cuando se suelta un lead en "confirmed", abrimos el diálogo de programación de citas
                                    onDrop={(e) => {
                                        setIsOver(false)

                                        // Si es la columna de confirmado y se está arrastrando un lead
                                        if (
                                            title === 'confirmed' &&
                                            snapshot.draggingFromThisWith
                                        ) {
                                            // Abrir el diálogo de programación de citas con el ID del lead
                                            setTimeout(() => {
                                                openAppointmentDialog(
                                                    snapshot.draggingFromThisWith ||
                                                        '',
                                                )
                                            }, 100)
                                        }
                                    }}
                                >
                                    <div className="text-center flex flex-col items-center justify-center h-full">
                                        <div
                                            className={`text-6xl mb-4 ${
                                                title === 'confirmed'
                                                    ? 'text-green-500 dark:text-green-400'
                                                    : 'text-red-500 dark:text-red-400'
                                            }`}
                                        >
                                            {title === 'confirmed' ? '✓' : '✕'}
                                        </div>
                                        <p
                                            className={`text-sm ${
                                                title === 'confirmed'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}
                                        >
                                            {dropHint}
                                        </p>

                                        {/* Lista de leads en etapas finales */}
                                        <div className="w-full mt-6 flex-grow overflow-y-auto" style={{ minHeight: '200px' }}>
                                            <LeadCardList
                                                leads={contents || []}
                                                listId={title}
                                            />
                                        </div>
                                    </div>
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    )}
                </div>
            )}
        </Draggable>
    )
}

export default FunnelStageColumn
