/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/SalesFunnel.tsx
 * Componente principal del embudo de ventas para la gestión de leads inmobiliarios
 * Con integración completa al sistema de citas.
 *
 * @version 4.4.0
 * @updated 2025-04-28
 */

'use client'

import { lazy, Suspense, useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Spinner from '@/components/ui/Spinner'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Card from '@/components/ui/Card'
import reorderDragable from '@/utils/reorderDragable'
import FunnelStageColumn from './FunnelStageColumn'
import SalesFunnelHeader from './SalesFunnelHeader'
import FunnelViewSwitcher from './FunnelViewSwitcher'
import LeadsList from './LeadsList'
import { useAppointmentStore } from '@/app/(protected-pages)/modules/appointments/_store/appointmentStore'
import AppointmentScheduler from '@/app/(protected-pages)/modules/appointments/_components/AppointmentScheduler'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import { useTranslations } from 'next-intl'
import sleep from '@/utils/sleep'
import reoderArray from '@/utils/reoderArray'
import { HiCheck, HiX } from 'react-icons/hi'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { formatBudget, leadFormOptions } from '../utils'
import type { EntityData } from '@/app/(protected-pages)/modules/appointments/_components/AppointmentScheduler'
import type { Appointment as AppSchedulerAppointment } from '@/app/(protected-pages)/modules/appointments/_components/AppointmentScheduler'
import {
    Droppable,
    DragDropContext,
    DraggableChildrenFn,
    DragStart,
} from '@hello-pangea/dnd'
import type { Lead, Appointment } from '../types'
import type { DropResult } from '@hello-pangea/dnd'

export type SalesFunnelProps = {
    containerHeight?: boolean
    useClone?: DraggableChildrenFn
    isCombineEnabled?: boolean
    withScrollableColumns?: boolean
}

const LeadContent = lazy(() => import('./LeadContent'))
const AddNewLead = lazy(() => import('./AddNewLead'))
const AddNewMemberContent = lazy(() => import('./AddNewMemberContent'))
const AddNewColumnContent = lazy(() => import('./AddNewColumnContent'))

// Tipo para traducciones de columnas
interface ColumnTranslations {
    Adquisición: string
    Prospección: string
    Calificación: string
    Oportunidad: string
    [key: string]: string // Índice de cadena para permitir acceso dinámico
}

// Lista de agentes disponibles - Normalmente vendría de una API
const agentOptions = [
    { value: 'agent1', label: 'Carlos Rodríguez' },
    { value: 'agent2', label: 'Ana Martínez' },
    { value: 'agent3', label: 'Miguel Sánchez' },
]

// Función para convertir entre tipos de cita
const convertToLeadAppointment = (
    appointment: AppSchedulerAppointment,
): Appointment => {
    return {
        id: appointment.id,
        leadId: appointment.entityId,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
        propertyType: appointment.propertyType as any,
        agentId: appointment.agentId,
        status: appointment.status as any,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
    }
}

// Función para convertir un Appointment de lead a AppSchedulerAppointment
const convertToSchedulerAppointment = (
    appointment: Appointment,
): AppSchedulerAppointment => {
    return {
        id: appointment.id,
        entityId: appointment.leadId,
        date: appointment.date,
        time: appointment.time,
        location: appointment.location,
        propertyType: appointment.propertyType,
        agentId: appointment.agentId,
        status: appointment.status,
        notes: appointment.notes || '',
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        propertyIds: [], // Este campo no existe en el Appointment del lead
    }
}

const SalesFunnel = (props: SalesFunnelProps) => {
    const t = useTranslations('salesFunnel')
    const [isKanbanView, setIsKanbanView] = useState(true)
    // Estado para rastrear qué lead se está arrastrando actualmente
    const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null)

    // Desestructurar el store del embudo de ventas
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
        selectedLeadId,
        appointmentDialogOpen,
        openAppointmentDialog,
        closeAppointmentDialog,
        scheduleAppointment,
        moveLeadToStage,
        filteredColumns,
        searchQuery,
    } = useSalesFunnelStore()

    // Desestructurar el store de citas
    const { getRecommendedProperties, getAgentAvailability } =
        useAppointmentStore()

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
                'To Do': 'Adquisición',
                'In Progress': 'Prospección',
                'To Review': 'Calificación',
                Completed: 'Oportunidad',
                Adquisición: 'Adquisición',
                Prospección: 'Prospección',
                Calificación: 'Calificación',
                Oportunidad: 'Oportunidad',
                // Añadir también traducciones en inglés que corresponden al nuevo módulo inmobiliario
                New: 'Nuevos',
                Prospecting: 'Prospectando',
                Qualification: 'Calificación',
                Opportunity: 'Oportunidad',
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
                const translatedColumns: Record<string, Lead[]> = {}
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

    // Manejador mejorado para el cierre del diálogo
    const onDialogClose = async () => {
        console.log('SalesFunnel - onDialogClose called')

        // Cerrar el diálogo
        closeDialog()

        // Pequeña pausa para asegurar que la animación del diálogo se complete
        await sleep(300)

        // Resetear la vista (limpiar selectedLeadId y dialogView)
        console.log('SalesFunnel - Resetting view state')
        resetView()

        console.log('SalesFunnel - Dialog closed and state reset')
    }

    const handleViewToggle = (checked: boolean) => {
        setIsKanbanView(checked)
    }

    // Función para mostrar un toast
    const showToast = (
        message: string,
        type: 'success' | 'warning' | 'danger' | 'info' = 'success',
    ) => {
        // Solo ejecutar esto en el cliente
        if (typeof window !== 'undefined') {
            // Importar dinámicamente para evitar errores de hooks
            import('@/components/ui/toast')
                .then(({ default: toastModule }) => {
                    const notificationProps = {
                        title:
                            type === 'success'
                                ? 'Éxito'
                                : type === 'danger'
                                  ? 'Error'
                                  : type === 'warning'
                                    ? 'Advertencia'
                                    : 'Información',
                        type,
                        children: message,
                    }

                    toastModule.push(
                        // Crear el componente de notificación manualmente en lugar de usar JSX
                        // para evitar errores de contexto de React
                        <Notification {...notificationProps} />,
                        { placement: 'top-center' },
                    )
                })
                .catch((err) => {
                    // En caso de error, usar el console para mostrar el mensaje
                    console.error('Error al mostrar notificación:', err)
                    console.log(`${type.toUpperCase()}: ${message}`)
                })
        }
    }

    // Capturar el inicio del arrastre para saber qué lead se está moviendo
    const onDragStart = (start: DragStart) => {
        // Si es un lead y no una columna, guardar su ID
        if (start.type === 'CONTENT') {
            setDraggingLeadId(start.draggableId)
            // Añadir clase para ocultar todos los scrollbars durante el arrastre
            document.body.classList.add('dragging')
        } else {
            // También ocultar scrollbars cuando se arrastra una columna
            document.body.classList.add('dragging')
        }
    }

    // Función para encontrar un lead y su posición en las columnas
    const findLeadInColumns = (leadId: string) => {
        for (const columnId in columns) {
            const columnLeads = columns[columnId]
            const leadIndex = columnLeads.findIndex(
                (lead) => lead.id === leadId,
            )
            if (leadIndex !== -1) {
                return {
                    columnId,
                    leadIndex,
                    lead: columnLeads[leadIndex],
                }
            }
        }
        return null
    }

    // Función para manejar cuando un lead se confirma
    const handleConfirmLead = (leadId: string) => {
        // Buscar información del lead
        const leadInfo = findLeadInColumns(leadId)
        if (!leadInfo) return

        // Mantener track de la columna original para poder regresar al cancelar
        openAppointmentDialog(leadId)
    }

    // Función para manejar cuando un lead se cierra (se marca como cerrado)
    const handleCloseLead = (leadId: string): Promise<void> => {
        // Buscar información del lead
        const leadInfo = findLeadInColumns(leadId);
        if (!leadInfo) return Promise.resolve();

        // Mostrar información de diagnóstico
        console.log(`Cerrando lead: ${leadId}, nombre: ${leadInfo.lead.name || leadInfo.lead.full_name}`);
        
        // 1. Primero intentar con la API optimizada
        return new Promise(async (resolve, reject) => {
            try {
                // Primer intento: Usar API especializada de mark-as-closed
                const response = await fetch('/api/leads/mark-as-closed', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        leadId: leadId,
                    }),
                });
                
                console.log('Respuesta de API mark-as-closed - status:', response.status);
                const data = await response.json();
                
                if (!data.success) {
                    console.error('Error al marcar lead como cerrado:', data.error);
                    throw new Error(data.error || 'Error desconocido');
                }
                
                console.log('Lead marcado como cerrado con éxito:', data);
                
                // 2. Si tuvo éxito, actualizar la UI sin esperar refresco
                const sourceColumn = [...columns[leadInfo.columnId]];
                sourceColumn.splice(leadInfo.leadIndex, 1);
                
                // Actualizar las columnas sin el lead
                const newColumns = {
                    ...columns,
                    [leadInfo.columnId]: sourceColumn,
                };
                
                // Actualizar estado global
                updateColumns(newColumns);
                
                // Mostrar notificación toast
                showToast(`Prospecto "${leadInfo.lead.name || leadInfo.lead.full_name}" marcado como cerrado`, 'success');
                
                resolve();
            } catch (error) {
                console.error('Error en el primer intento de cierre:', error);
                
                // 3. Segundo intento: Usar función de base de datos directamente
                try {
                    console.log("Intentando método alternativo...");
                    // Usar el endpoint de diagnóstico como respaldo
                    const debugResponse = await fetch('/api/leads/debug-lead-closure', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId })
                    });
                    
                    const debugData = await debugResponse.json();
                    console.log("Resultado método alternativo:", debugData);
                    
                    if (debugData.success) {
                        // Aún necesitamos actualizar la UI
                        const sourceColumn = [...columns[leadInfo.columnId]];
                        sourceColumn.splice(leadInfo.leadIndex, 1);
                        
                        // Actualizar las columnas sin el lead
                        const newColumns = {
                            ...columns,
                            [leadInfo.columnId]: sourceColumn,
                        };
                        
                        // Actualizar estado global
                        updateColumns(newColumns);
                        
                        showToast(`Prospecto cerrado con método alternativo`, 'info');
                        resolve();
                    } else {
                        throw new Error("Ambos métodos de cierre fallaron");
                    }
                } catch (debugError) {
                    console.error('Error en método alternativo:', debugError);
                    showToast('Error al procesar el cierre del prospecto. Intente nuevamente más tarde', 'danger');
                    reject(debugError);
                }
            }
        });
    };

    const onDragEnd = (result: DropResult) => {
        // Limpiar el estado de arrastre al terminar
        setDraggingLeadId(null)
        // Eliminar clase para mostrar scrollbars nuevamente
        document.body.classList.remove('dragging')

        // Si no hay destino, salir
        if (!result.destination) {
            return
        }

        const source = result.source
        const destination = result.destination

        // Si el origen y destino son iguales, no hacer nada
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return
        }

        // Si se arrastra a una de las columnas de estado final
        if (destination.droppableId === 'confirmed') {
            handleConfirmLead(result.draggableId)
            return
        }

        if (destination.droppableId === 'closed') {
            // Marcar el lead como cerrado (etapa "closed")
            handleCloseLead(result.draggableId)
            return
        }

        // Si se está moviendo entre columnas normales o reordenando dentro de una columna
        if (result.type === 'COLUMN') {
            const newOrdered = reoderArray(
                ordered,
                source.index,
                destination.index,
            )
            updateOrdered(newOrdered)
            return
        }

        // Para otros movimientos entre columnas normales
        const data = reorderDragable<Record<string, Lead[]>>({
            quoteMap: columns,
            source,
            destination,
        })

        // Si es un movimiento entre columnas diferentes, actualizar la propiedad stage de los leads
        if (source.droppableId !== destination.droppableId) {
            // Usar moveLeadToStage para garantizar actualización del stage
            // y persistencia en el servidor

            // Mostramos información de diagnóstico
            console.group('Movimiento de lead entre columnas')
            console.log('ID del lead:', result.draggableId)
            console.log('Desde columna:', source.droppableId)
            console.log('Hasta columna:', destination.droppableId)
            console.log('Índice de destino:', destination.index)
            console.groupEnd()

            // Verificar si el lead existe en ambas columnas
            const sourceLeads = columns[source.droppableId] || []
            const destLeads = columns[destination.droppableId] || []

            const leadInSource = sourceLeads.find(
                (lead) => lead.id === result.draggableId,
            )
            const leadInDest = destLeads.find(
                (lead) => lead.id === result.draggableId,
            )

            console.group('Verificación de lead')
            console.log('Lead encontrado en columna origen:', !!leadInSource)
            console.log('Lead encontrado en columna destino:', !!leadInDest)
            console.log('Stage actual del lead:', leadInSource?.stage)
            console.groupEnd()

            // Importante: Guardar el índice de destino para respetar la posición del drop
            if (leadInSource) {
                // Hacemos una copia del lead para mantener los datos en la operación
                const leadToMove = { ...leadInSource, stage: destination.droppableId };
                
                // Primero sacamos el lead del origen
                const updatedSourceColumn = sourceLeads.filter(lead => lead.id !== result.draggableId);
                
                // Luego creamos el array destino con el lead en la posición correcta
                const updatedDestColumn = [...destLeads];
                updatedDestColumn.splice(destination.index, 0, leadToMove);
                
                // Actualizamos las columnas directamente
                const updatedColumns = {
                    ...columns,
                    [source.droppableId]: updatedSourceColumn,
                    [destination.droppableId]: updatedDestColumn
                };
                
                // Actualizar el estado con las nuevas columnas
                updateColumns(updatedColumns);
                
                // Enviar la actualización al backend
                fetch('/api/leads/update-stage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        leadId: result.draggableId,
                        newStage: destination.droppableId,
                    }),
                })
                .then((response) => {
                    console.log('Respuesta de API update-stage - status:', response.status);
                    return response.json();
                })
                .then((data) => {
                    console.log('Respuesta de API update-stage - datos:', data);
                    if (!data.success) {
                        console.error('Error en la API:', data.error);
                        showToast('Error al actualizar etapa: ' + (data.error || 'Error desconocido'), 'danger');
                    }
                })
                .catch((error) => {
                    console.error('Error al llamar a API update-stage:', error);
                    showToast('Error de conexión con el servidor', 'danger');
                });
                
                return;
            }
            
            // Si no encontramos el lead, usar el método original como fallback
            moveLeadToStage(result.draggableId, source.droppableId, destination.droppableId);
            return;
        }

        // Si solo es una reordenación dentro de la misma columna, usar el resultado directo
        updateColumns(data.quoteMap)
    }

    // Obtener datos del lead actual para la cita
    const currentLead = selectedLeadId
        ? Object.values(columns)
              .flat()
              .find((lead) => lead.id === selectedLeadId)
        : null

    // Convertir los datos del lead al formato requerido por el programador de citas
    const entityData: EntityData | undefined = currentLead
        ? {
              id: currentLead.id,
              name: currentLead.name,
              email: currentLead.email || currentLead.metadata?.email,
              phone: currentLead.phone || currentLead.metadata?.phone,
              budget: currentLead.budget || currentLead.metadata?.budget,
              propertyType: currentLead.metadata?.propertyType,
              // Añadir propiedades asignadas para que hasAssignedProps funcione correctamente
              interestedPropertyIds: currentLead.property_ids || [],
              // Incluir metadata completo para acceder a property_ids
              metadata: currentLead.metadata || {},
              // Incluir selected_property_id si existe
              selected_property_id:
                  currentLead.selected_property_id ||
                  (currentLead.property_ids &&
                  currentLead.property_ids.length > 0
                      ? currentLead.property_ids[0]
                      : undefined),
          }
        : undefined

    // Convertir la cita existente al formato del programador si existe
    const currentAppointmentForScheduler = currentLead?.appointment
        ? convertToSchedulerAppointment(currentLead.appointment)
        : null

    // Manejar programación de cita
    const handleScheduleAppointment = (
        appointment: AppSchedulerAppointment,
    ) => {
        if (currentLead) {
            // Convertir la cita del formato del programador al formato de lead
            const leadAppointment = convertToLeadAppointment(appointment)

            // Llamar a la acción del store para programar la cita
            scheduleAppointment(leadAppointment)

            // Actualizar el calendario después de programar la cita
            setTimeout(() => {
                console.log('Actualizando vista de calendario después de programar cita...');
                try {
                    // Intentar actualizar el calendario si existe el AppointmentStore
                    const appointmentStore = useAppointmentStore.getState();
                    
                    // Obtener la fecha actual para el intervalo de fechas
                    const today = new Date();
                    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
                        .toISOString().split('T')[0]; // Primer día del mes actual
                    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0)
                        .toISOString().split('T')[0]; // Último día del mes siguiente
                    
                    // Cargar explícitamente las citas para el calendario usando el rango de fechas
                    appointmentStore.fetchCalendarAppointments(startDate, endDate)
                        .then((appointments) => {
                            console.log(`Calendario actualizado con ${appointments.length} citas`);
                            // Opcionalente refrescar también la lista completa de citas
                            appointmentStore.fetchAppointments();
                        })
                        .catch(err => {
                            console.error('Error al actualizar calendario:', err);
                        });
                } catch (error) {
                    console.error('Error al intentar actualizar el calendario:', error);
                }
            }, 1500); // Aumentamos el tiempo de espera a 1.5 segundos para que la cita se guarde correctamente

            // Mostrar toast de confirmación
            showToast(`Cita programada para ${currentLead.name}`, 'success')
        }
    }

    // Textos para las columnas de estado final con valores predeterminados
    // para evitar errores de traducción
    let confirmedText = 'Confirmado'
    let closedText = 'Cerrado'
    let dropHereText = 'Arrastra aquí para confirmar'
    let dropHereClosedText = 'Arrastra aquí para cerrar'

    // Intenta obtener las traducciones, pero usa los valores por defecto si fallan
    try {
        const confirmedTranslation = t('columns.finalStates.confirmed')
        if (confirmedTranslation) {
            confirmedText = confirmedTranslation
        }
    } catch {
        // Ignorar error si falla la traducción
    }

    try {
        const closedTranslation = t('columns.finalStates.closed')
        if (closedTranslation) {
            closedText = closedTranslation
        }
    } catch {
        // Ignorar error si falla la traducción
    }

    try {
        const dropHereTranslation = t('columns.finalStates.dropHereConfirm')
        if (dropHereTranslation) {
            dropHereText = dropHereTranslation
        }
    } catch {
        // Ignorar error si falla la traducción
    }

    try {
        const dropHereClosedTranslation = t('columns.finalStates.dropHereClose')
        if (dropHereClosedTranslation) {
            dropHereClosedText = dropHereClosedTranslation
        }
    } catch {
        // Ignorar error si falla la traducción
    }

    return (
        <>
            <AdaptiveCard
                className="container mx-auto"
                bodyClass="h-full flex flex-col"
            >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                    {/* Header en dos filas en móvil para mejor visualización */}
                    <div className="flex-1 min-w-0">
                        <SalesFunnelHeader />
                    </div>
                    <div className="flex justify-end">
                        <FunnelViewSwitcher
                            isKanbanView={isKanbanView}
                            onChange={handleViewToggle}
                            boardMembers={boardMembers}
                        />
                    </div>
                </div>

                {isKanbanView ? (
                    <div className="flex flex-col lg:flex-row">
                        <DragDropContext
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                        >
                            {/* Columnas principales - Contenedor con scroll horizontal */}
                            <div
                                className="flex-grow h-full scrollbar-hide"
                                style={{
                                    overflowX: 'auto',
                                    overflowY: 'hidden',
                                    paddingBottom: '0', // Eliminamos el espacio para el scrollbar
                                }}
                            >
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
                                            className="w-full h-full mb-2"
                                            {...provided.droppableProps}
                                            style={{
                                                display: 'flex',
                                                minHeight:
                                                    'calc(100vh - 230px)',
                                                paddingBottom: '16px',
                                                minWidth: 'min-content', // Asegura que el contenedor se expanda según su contenido
                                            }}
                                        >
                                            {ordered.map((key, index) => {
                                                // Usar las columnas filtradas si hay una búsqueda activa
                                                const activeColumns =
                                                    filteredColumns &&
                                                    searchQuery
                                                        ? filteredColumns
                                                        : columns

                                                return (
                                                    <FunnelStageColumn
                                                        key={key}
                                                        index={index}
                                                        title={key}
                                                        contents={
                                                            activeColumns[
                                                                key
                                                            ] || []
                                                        }
                                                        isScrollable={
                                                            withScrollableColumns
                                                        }
                                                        isCombineEnabled={
                                                            isCombineEnabled
                                                        }
                                                        useClone={useClone}
                                                    />
                                                )
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>

                            {/* Columnas de estado final */}
                            <div className="lg:w-72 lg:ml-4 flex flex-row lg:flex-col gap-4 mt-4 lg:mt-0">
                                {/* Columna Confirmado */}
                                <Card className="flex-1 lg:mb-4">
                                    <div className="p-4">
                                        <div className="flex items-center mb-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mr-3">
                                                <HiCheck className="text-lg" />
                                            </div>
                                            <h6 className="font-medium text-emerald-600">
                                                {confirmedText}
                                            </h6>
                                        </div>
                                        <Droppable
                                            droppableId="confirmed"
                                            type="CONTENT"
                                        >
                                            {(provided, snapshot) => {
                                                // Estilo personalizado para el contenedor
                                                const containerStyle = {
                                                    marginTop: '9px',
                                                    position:
                                                        'relative' as const,
                                                }

                                                // Estilo personalizado para el contenido que debe permanecer centrado
                                                const contentStyle = {
                                                    position:
                                                        'absolute' as const,
                                                    top: '50%',
                                                    left: '50%',
                                                    transform:
                                                        'translate(-50%, -50%)',
                                                    width: '100%',
                                                    textAlign:
                                                        'center' as const,
                                                    zIndex: 1,
                                                }

                                                return (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`min-h-[200px] h-[500px] rounded-lg border-2 border-dashed ${
                                                            snapshot.isDraggingOver
                                                                ? 'bg-emerald-100 border-emerald-300'
                                                                : 'bg-emerald-50 border-emerald-200'
                                                        }`}
                                                        style={containerStyle}
                                                    >
                                                        {/* Contenido centrado con estilos inline para garantizar posicionamiento */}
                                                        <div
                                                            className="text-emerald-500"
                                                            style={contentStyle}
                                                        >
                                                            <HiCheck className="text-4xl mb-2 mx-auto" />
                                                            <p>
                                                                {dropHereText}
                                                            </p>
                                                        </div>
                                                        {provided.placeholder}
                                                    </div>
                                                )
                                            }}
                                        </Droppable>
                                    </div>
                                </Card>

                                {/* Columna Cerrado */}
                                <Card className="flex-1">
                                    <div className="p-4">
                                        <div className="flex items-center mb-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 mr-3">
                                                <HiX className="text-lg" />
                                            </div>
                                            <h6 className="font-medium text-red-600">
                                                {closedText}
                                            </h6>
                                        </div>
                                        <Droppable
                                            droppableId="closed"
                                            type="CONTENT"
                                        >
                                            {(provided, snapshot) => {
                                                // Estilo personalizado para el contenedor
                                                const containerStyle = {
                                                    marginTop: '9px',
                                                    position:
                                                        'relative' as const,
                                                }

                                                // Estilo personalizado para el contenido que debe permanecer centrado
                                                const contentStyle = {
                                                    position:
                                                        'absolute' as const,
                                                    top: '50%',
                                                    left: '50%',
                                                    transform:
                                                        'translate(-50%, -50%)',
                                                    width: '100%',
                                                    textAlign:
                                                        'center' as const,
                                                    zIndex: 1,
                                                }

                                                return (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`min-h-[200px] h-[500px] rounded-lg border-2 border-dashed ${
                                                            snapshot.isDraggingOver
                                                                ? 'bg-red-100 border-red-300'
                                                                : 'bg-red-50 border-red-200'
                                                        }`}
                                                        style={containerStyle}
                                                    >
                                                        {/* Contenido centrado con estilos inline para garantizar posicionamiento */}
                                                        <div
                                                            className="text-red-500"
                                                            style={contentStyle}
                                                        >
                                                            <HiX className="text-4xl mb-2 mx-auto" />
                                                            <p>
                                                                {
                                                                    dropHereClosedText
                                                                }
                                                            </p>
                                                        </div>
                                                        {provided.placeholder}
                                                    </div>
                                                )
                                            }}
                                        </Droppable>
                                    </div>
                                </Card>
                            </div>
                        </DragDropContext>
                    </div>
                ) : (
                    // Vista de lista - no necesita mostrar los elementos confirmados/cerrados
                    <LeadsList />
                )}
            </AdaptiveCard>
            {/* Diálogo para todas las vistas del funnel de ventas */}
            <Dialog
                isOpen={dialogOpen}
                width={dialogView === 'LEAD' ? 800 : 520}
                closable={true}
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
                    {dialogView === 'LEAD' && (
                        <LeadContent onLeadClose={onDialogClose} />
                    )}
                    {dialogView === 'NEW_LEAD' && <AddNewLead />}
                    {dialogView === 'NEW_COLUMN' && <AddNewColumnContent />}
                    {dialogView === 'ADD_MEMBER' && <AddNewMemberContent />}
                </Suspense>
            </Dialog>

            {/* Integración del programador de citas */}
            <AppointmentScheduler
                isOpen={appointmentDialogOpen}
                onClose={closeAppointmentDialog}
                onSchedule={handleScheduleAppointment}
                entityId={selectedLeadId || ''}
                entityData={entityData}
                currentAppointment={currentAppointmentForScheduler}
                agentOptions={agentOptions}
                propertyTypes={leadFormOptions.propertyTypes}
                getRecommendedProperties={getRecommendedProperties}
                getAgentAvailability={getAgentAvailability}
                formatBudget={formatBudget}
            />
        </>
    )
}

export default SalesFunnel