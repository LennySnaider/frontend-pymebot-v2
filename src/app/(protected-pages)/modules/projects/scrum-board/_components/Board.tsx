'use client'

import { lazy, Suspense, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Spinner from '@/components/ui/Spinner'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import reorderDragable from '@/utils/reorderDragable'
import BoardColumn from './BoardColumn'
import ScrumBoardHeader from './ScrumBoardHeader'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useTranslations } from 'next-intl'
import sleep from '@/utils/sleep'
import reoderArray from '@/utils/reoderArray'
import {
    Droppable,
    DragDropContext,
    DraggableChildrenFn,
} from '@hello-pangea/dnd'
import type { Ticket } from '../types'
import type { DropResult } from '@hello-pangea/dnd'

export type BoardProps = {
    containerHeight?: boolean
    useClone?: DraggableChildrenFn
    isCombineEnabled?: boolean
    withScrollableColumns?: boolean
}

const TicketContent = lazy(() => import('./TicketContent'))
const AddNewTicketContent = lazy(() => import('./AddNewTicketContent'))
const AddNewMemberContent = lazy(() => import('./AddNewMemberContent'))
const AddNewColumnContent = lazy(() => import('./AddNewColumnContent'))

// Tipo para traducciones de columnas
interface ColumnTranslations {
    'To Do': string
    'In Progress': string
    'To Review': string
    Completed: string
    [key: string]: string // Índice de cadena para permitir acceso dinámico
}

/**
 * Componente principal del tablero Scrum
 * Maneja el arrastrar y soltar de columnas y tarjetas
 *
 * @version 1.0.1
 * @updated 2025-03-25
 */
const Board = (props: BoardProps) => {
    const t = useTranslations('scrumboard')

    const {
        columns,
        ordered,
        boardMembers,
        updateOrdered,
        updateColumns,
        closeDialog,
        resetView,
        dialogView,
        dialogOpen,
    } = useScrumBoardStore()

    const {
        containerHeight,
        useClone,
        isCombineEnabled,
        withScrollableColumns,
    } = props

    // Efectos para traducir las columnas inicialmente si es necesario
    useEffect(() => {
        if (ordered.length > 0) {
            // Definir traducciones con tipo correcto
            const columnTranslations: ColumnTranslations = {
                'To Do': t('columns.defaultNames.toDo'),
                'In Progress': t('columns.defaultNames.inProgress'),
                'To Review': t('columns.defaultNames.toReview'),
                Completed: t('columns.defaultNames.completed'),
            }

            // Solo traducir si encontramos alguna columna en inglés
            if (
                ordered.some((col) =>
                    Object.prototype.hasOwnProperty.call(
                        columnTranslations,
                        col,
                    ),
                )
            ) {
                const translatedColumns: Record<string, Ticket[]> = {}
                const translatedOrder = [...ordered]

                // Recorrer todas las columnas originales
                Object.keys(columns).forEach((columnKey) => {
                    // Si existe una traducción, usarla
                    const newKey = columnTranslations[columnKey] || columnKey
                    translatedColumns[newKey] = columns[columnKey]

                    // Actualizar también el orden
                    const orderIndex = ordered.indexOf(columnKey)
                    if (orderIndex >= 0) {
                        translatedOrder[orderIndex] = newKey
                    }
                })

                // Actualizar estado solo si hay cambios
                if (Object.keys(translatedColumns).length > 0) {
                    updateColumns(translatedColumns)
                    updateOrdered(translatedOrder)
                }
            }
        }
        // Solo ejecutar en el montaje inicial
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onDialogClose = async () => {
        closeDialog()
        await sleep(200)
        resetView()
    }

    const onDragEnd = (result: DropResult) => {
        if (result.combine) {
            if (result.type === 'COLUMN') {
                const shallow = [...ordered]
                shallow.splice(result.source.index, 1)
                updateOrdered(shallow)
                return
            }

            const column = columns[result.source.droppableId]
            const withQuoteRemoved = [...column]
            withQuoteRemoved.splice(result.source.index, 1)
            const newColumns = {
                ...columns,
                [result.source.droppableId]: withQuoteRemoved,
            }
            updateColumns(newColumns)
            return
        }

        if (!result.destination) {
            return
        }

        const source = result.source
        const destination = result.destination

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return
        }

        if (result.type === 'COLUMN') {
            const newOrdered = reoderArray(
                ordered,
                source.index,
                destination.index,
            )
            updateOrdered(newOrdered)
            return
        }

        const data = reorderDragable<Record<string, Ticket[]>>({
            quoteMap: columns,
            source,
            destination,
        })

        updateColumns(data.quoteMap)
    }

    return (
        <>
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                <ScrumBoardHeader boardMembers={boardMembers} />
                <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
                    <Droppable
                        droppableId="board"
                        type="COLUMN"
                        direction="horizontal"
                        ignoreContainerClipping={containerHeight}
                        isCombineEnabled={isCombineEnabled}
                    >
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                className="scrumboard flex flex-col flex-auto w-full mb-2"
                                {...provided.droppableProps}
                            >
                                <div className="scrumboard-body flex max-w-full overflow-x-auto h-full mt-4 gap-4">
                                    {ordered.map((key, index) => (
                                        <BoardColumn
                                            key={key}
                                            index={index}
                                            title={key}
                                            contents={columns[key]}
                                            isScrollable={withScrollableColumns}
                                            isCombineEnabled={isCombineEnabled}
                                            useClone={useClone}
                                        />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </AdaptiveCard>
            <Dialog
                isOpen={dialogOpen}
                width={dialogView === 'TICKET' ? 700 : 520}
                closable={dialogView !== 'TICKET'}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <Suspense
                    fallback={
                        <div className="my-4 text-center">
                            <Spinner />
                        </div>
                    }
                >
                    {dialogView === 'TICKET' && (
                        <TicketContent onTicketClose={onDialogClose} />
                    )}
                    {dialogView === 'NEW_TICKET' && <AddNewTicketContent />}
                    {dialogView === 'NEW_COLUMN' && <AddNewColumnContent />}
                    {dialogView === 'ADD_MEMBER' && <AddNewMemberContent />}
                </Suspense>
            </Dialog>
        </>
    )
}

export default Board
