/**
 * frontend/src/app/(protected-pages)/leads/leads-scrum/_components/LeadCardList.tsx
 * Lista de tarjetas de leads dentro de una etapa del funnel de ventas.
 * Adaptado para el módulo de gestión de leads inmobiliarios.
 *
 * @version 3.3.0
 * @updated 2025-04-11
 */

'use client'

import { useEffect, useRef } from 'react'
import LeadCard from './LeadCard'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import type { Lead } from '../types'

interface LeadCardListProps {
    listId: string
    leads: Lead[]
}

const LeadCardList = ({ listId, leads = [] }: LeadCardListProps) => {
    const cardListRef = useRef<HTMLDivElement>(null)
    const { updateDialogView, openDialog, setSelectedLeadId } =
        useSalesFunnelStore()

    // Desplazar para ver la nueva tarjeta
    useEffect(() => {
        if (cardListRef.current) {
            cardListRef.current.scrollTop = cardListRef.current.scrollHeight
        }
    }, [leads.length])

    // Maneja la creación de un nuevo lead
    const onAddNewLead = () => {
        setSelectedLeadId('')
        updateDialogView('NEW_LEAD')
        openDialog()
    }

    return (
        <Droppable droppableId={listId}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    className="h-full flex flex-col overflow-hidden"
                    {...provided.droppableProps}
                >
                    <div
                        ref={cardListRef}
                        className="overflow-y-auto overflow-x-hidden scrollbar-hide flex-grow py-1 space-y-1 w-[260px]"
                    >
                        {leads.map((lead, index) => (
                            <Draggable
                                key={lead.id}
                                draggableId={lead.id}
                                index={index}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="w-[260px] mb-3" // Ancho fijo para mantener consistencia
                                    >
                                        <LeadCard
                                            data={lead}
                                            className={`
                                                ${snapshot.isDragging ? '!shadow-lg' : ''}
                                                w-[240px] fixed-width-card
                                            `}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                    <div className="mt-3 mb-2 sticky bottom-0 bg-gray-50 dark:bg-gray-800 pt-2 w-[240px] mx-auto">
                        <button
                            onClick={onAddNewLead}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200 w-full border-dashed border-2 border-gray-200 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-500 dark:text-gray-400 flex items-center justify-center"
                        >
                            <span>+ Añadir prospecto</span>
                        </button>
                    </div>
                </div>
            )}
        </Droppable>
    )
}

export default LeadCardList
