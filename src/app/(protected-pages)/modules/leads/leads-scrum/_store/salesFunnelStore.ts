/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_store/salesFunnelStore.ts
 * Store para el módulo de funnel de ventas inmobiliario.
 * Gestiona el estado global del embudo de ventas y las acciones para manipularlo.
 * Mejora en la persistencia de datos y manejo de stage.
 *
 * @version 2.1.0
 * @updated 2024-04-14
 */

import { create } from 'zustand'
import type { Member, Lead, Appointment } from '../types'
import { toast } from '@/components/ui/toast'

type View = 'NEW_COLUMN' | 'LEAD' | 'ADD_MEMBER' | 'NEW_LEAD' | 'SCHEDULE_APPOINTMENT' | ''

export type SalesFunnelState = {
    columns: Record<string, Lead[]>
    filteredColumns: Record<string, Lead[]> | null // Para guardar los resultados de búsqueda
    searchQuery: string // Para guardar la consulta de búsqueda
    ordered: string[]
    boardMembers: Member[]
    allMembers: Member[]
    dialogOpen: boolean
    dialogView: View
    selectedLeadId: string
    funnelId: string
    // Estados para la gestión de citas
    appointmentDialogOpen: boolean
    currentAppointment: Appointment | null
    isSchedulingAppointment: boolean
    previousStage: string | null // Guarda la etapa anterior del lead cuando se mueve a "confirmed"
    // Estado para controlar operaciones pendientes
    pendingOperations: Map<string, { operation: string, sourceStage: string, destinationStage: string }>
}

type SalesFunnelAction = {
    updateOrdered: (payload: string[]) => void
    updateColumns: (payload: Record<string, Lead[]>) => void
    updateBoardMembers: (payload: Member[]) => void
    updateAllMembers: (payload: Member[]) => void
    openDialog: () => void
    closeDialog: () => void
    resetView: () => void
    updateDialogView: (payload: View) => void
    setSelectedLeadId: (payload: string) => void
    setSelectedFunnel: (payload: string) => void
    updateLead: (lead: Lead) => void
    // Acciones para la búsqueda de leads
    searchLeads: (query: string) => void
    clearSearch: () => void
    // Acciones para la gestión de citas
    openAppointmentDialog: (leadId: string) => void
    closeAppointmentDialog: () => void
    setCurrentAppointment: (appointment: Appointment | null) => void
    setIsSchedulingAppointment: (isScheduling: boolean) => void
    scheduleAppointment: (appointment: Appointment) => void
    // Nueva acción para mover un lead entre columnas con tracking del estado anterior
    moveLeadToStage: (leadId: string, sourceStage: string, destinationStage: string) => void
    // Nueva acción para cancelar la programación de cita y restaurar el lead
    cancelAppointmentScheduling: () => void
    // Utilidades para diagnóstico
    showStageInConsole: (leadId: string) => void
}

const initialState: SalesFunnelState = {
    columns: {},
    filteredColumns: null, // Inicialmente no hay filtro
    searchQuery: '', // Inicialmente no hay consulta de búsqueda
    ordered: [],
    boardMembers: [],
    allMembers: [],
    dialogOpen: false,
    dialogView: '',
    selectedLeadId: '',
    funnelId: '',
    appointmentDialogOpen: false,
    currentAppointment: null,
    isSchedulingAppointment: false,
    previousStage: null, // Inicializado como null
    pendingOperations: new Map()
}

// Utility function para mostrar notificaciones toast sin usar JSX directamente
// Esta función no usa JSX porque está en un archivo .ts en lugar de .tsx
const showToast = (message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    // Solo ejecutar esto en el cliente
    if (typeof window !== 'undefined') {
        // Determinar el título basado en el tipo
        const title = type === 'success' 
            ? 'Éxito' 
            : type === 'danger' 
                ? 'Error' 
                : type === 'warning' 
                    ? 'Advertencia' 
                    : 'Información';
        
        // Importamos dinámicamente la notificación para evitar problemas de compilación
        import('@/components/ui').then(({ Notification }) => {
            toast.push(
                Notification({
                    title: title,
                    type: type,
                    children: message
                }),
                {
                    placement: 'top-center',
                }
            );
        }).catch(err => {
            // En caso de error, mostrar un toast simple
            console.error('Error al mostrar notificación:', err);
            toast.push(message, { placement: 'top-center' });
        });
    }
}

export const useSalesFunnelStore = create<SalesFunnelState & SalesFunnelAction>(
    (set, get) => ({
        ...initialState,
        updateOrdered: (payload) =>
            set(() => {
                return { ordered: payload }
            }),
        updateColumns: (payload) => set(() => ({ columns: payload })),
        updateBoardMembers: (payload) => set(() => ({ boardMembers: payload })),
        updateAllMembers: (payload) => set(() => ({ allMembers: payload })),
        openDialog: () => set({ dialogOpen: true }),
        closeDialog: () =>
            set({
                dialogOpen: false,
            }),
        resetView: () =>
            set({
                selectedLeadId: '',
                funnelId: '',
                dialogView: '',
            }),
        updateDialogView: (payload) => set(() => ({ dialogView: payload })),
        setSelectedLeadId: (payload) => set(() => ({ selectedLeadId: payload })),
        setSelectedFunnel: (payload) => set(() => ({ funnelId: payload })),
        updateLead: (lead) => {
            const { columns, selectedLeadId } = get()
            
            if (!selectedLeadId || selectedLeadId !== lead.id) return
            
            // Encontrar en qué columna está el lead
            let columnKey: string | null = null
            
            Object.entries(columns).forEach(([key, leads]) => {
                const found = leads.find((item) => item.id === selectedLeadId)
                if (found) columnKey = key
            })
            
            if (!columnKey) return
            
            // Actualizar el lead
            const updatedLeads = columns[columnKey].map((item) => 
                item.id === selectedLeadId ? lead : item
            )
            
            // Actualizar las columnas
            const updatedColumns = {
                ...columns,
                [columnKey]: updatedLeads
            }
            
            set({ columns: updatedColumns })
        },
        
        // Acciones para la búsqueda de leads
        searchLeads: (query) => {
            const { columns } = get()
            
            // Si la consulta está vacía, limpiar la búsqueda
            if (!query.trim()) {
                set({ searchQuery: '', filteredColumns: null })
                return
            }
            
            // Normalizar consulta para búsqueda insensible a mayúsculas/minúsculas y acentos
            const normalizeString = (str: string) => {
                return str.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .trim()
            }
            
            const normalizedQuery = normalizeString(query)
            
            // Clonar todas las columnas para filtrado
            const filteredColumns: Record<string, Lead[]> = {}
            
            // Filtrar leads en cada columna
            Object.entries(columns).forEach(([columnKey, leads]) => {
                // Filtrar los leads que coinciden con la consulta
                const filteredLeads = leads.filter(lead => {
                    // Buscar en múltiples campos
                    const nameMatch = lead.name && normalizeString(lead.name).includes(normalizedQuery)
                    const emailMatch = lead.email && normalizeString(lead.email).includes(normalizedQuery)
                    const phoneMatch = lead.phone && normalizeString(lead.phone).includes(normalizedQuery)
                    
                    // Buscar en campos anidados de metadata
                    const metadataMatch = lead.metadata && (
                        (lead.metadata.email && normalizeString(lead.metadata.email).includes(normalizedQuery)) ||
                        (lead.metadata.phone && normalizeString(lead.metadata.phone).includes(normalizedQuery)) ||
                        (lead.metadata.source && normalizeString(lead.metadata.source).includes(normalizedQuery)) ||
                        (lead.metadata.propertyType && normalizeString(lead.metadata.propertyType).includes(normalizedQuery)) ||
                        (lead.metadata.preferredZones && lead.metadata.preferredZones.some(zone => 
                            normalizeString(zone).includes(normalizedQuery)
                        ))
                    )
                    
                    // Devuelve true si hay coincidencia en cualquier campo
                    return nameMatch || emailMatch || phoneMatch || metadataMatch
                })
                
                // Solo incluir la columna si hay algún lead que coincida
                if (filteredLeads.length > 0) {
                    filteredColumns[columnKey] = filteredLeads
                } else {
                    // Añadir columna vacía para mantener todas las columnas visibles
                    filteredColumns[columnKey] = []
                }
            })
            
            // Actualizar estado con la consulta y resultados filtrados
            set({ 
                searchQuery: query, 
                filteredColumns: filteredColumns 
            })
            
            // Registrar estadísticas de búsqueda para depuración
            console.log(`Búsqueda: "${query}" - Resultados:`, 
                Object.entries(filteredColumns).reduce((total, [_, leads]) => total + leads.length, 0), 
                'leads encontrados')
        },
        
        clearSearch: () => {
            set({ searchQuery: '', filteredColumns: null })
        },
        
        // Utility para diagnóstico
        showStageInConsole: (leadId) => {
            const { columns } = get()
            
            // Buscar el lead en todas las columnas
            let foundInStage: string | null = null
            let leadData: Lead | null = null
            
            Object.entries(columns).forEach(([stage, leads]) => {
                const found = leads.find((item) => item.id === leadId)
                if (found) {
                    foundInStage = stage
                    leadData = found
                }
            })
            
            if (foundInStage && leadData) {
                console.log(`Lead ID: ${leadId}`)
                console.log(`Encontrado en columna: ${foundInStage}`)
                console.log(`Valor de stage en objeto: ${leadData.stage}`)
                console.log(`Datos completos:`, leadData)
            } else {
                console.log(`Lead ID: ${leadId} no encontrado en ninguna columna`)
            }
        },
        
        // Nueva implementación para mover leads entre columnas con mejor tracking
        moveLeadToStage: (leadId, sourceStage, destinationStage) => {
            set((state) => {
                // Registrar la operación como pendiente
                const pendingOperations = new Map(state.pendingOperations)
                pendingOperations.set(leadId, {
                    operation: 'moveStage',
                    sourceStage,
                    destinationStage,
                })
                
                // Encontrar el lead en la columna de origen
                const sourceLead = state.columns[sourceStage]?.find(
                    (lead) => lead.id === leadId,
                )

                if (!sourceLead) {
                    console.error(`Lead ${leadId} no encontrado en la columna ${sourceStage}`)
                    return state
                }
                
                console.log(`Moviendo lead ${leadId} de ${sourceStage} a ${destinationStage}`)
                console.log('Estado actual del lead:', sourceLead)

                // Copiar las columnas actuales
                const newColumns = { ...state.columns }
                
                // Quitar el lead de la columna de origen
                newColumns[sourceStage] = newColumns[sourceStage].filter(
                    (lead) => lead.id !== leadId,
                )

                // Si el destino es "confirmed", guardar la etapa anterior y abrir el diálogo de citas
                if (destinationStage === 'confirmed') {
                    return {
                        ...state,
                        columns: newColumns,
                        previousStage: sourceStage,
                        selectedLeadId: leadId,
                        appointmentDialogOpen: true,
                        pendingOperations
                    }
                }

                // Para otras etapas, mover el lead y actualizar su propiedad stage
                // Actualizar el stage en el objeto del lead
                const updatedLead = { 
                    ...sourceLead, 
                    stage: destinationStage  // Asegurar que el campo stage se actualiza
                };
                
                console.log('Lead actualizado:', updatedLead);
                console.log('Estado anterior:', sourceLead.stage);
                console.log('Nuevo estado:', updatedLead.stage);
                
                // Añadir el lead a la columna de destino
                newColumns[destinationStage] = [
                    ...newColumns[destinationStage],
                    updatedLead
                ]
                
                // También enviar la actualización al servidor
                if (typeof window !== 'undefined') {
                    // Usar una función asíncrona auto-ejecutada para la llamada al servidor
                    (async () => {
                        try {
                            console.log(`Enviando actualización al servidor: leadId=${leadId}, newStage=${destinationStage}`);
                            const response = await fetch('/api/leads/update-stage', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    leadId: leadId,
                                    newStage: destinationStage
                                }),
                            });
                            
                            const responseData = await response.json();
                            
                            if (!response.ok) {
                                console.error('Error al actualizar etapa en el servidor:', responseData);
                                showToast(`Error al actualizar la etapa: ${responseData.error || 'Error desconocido'}`, 'danger');
                                
                                // Remover de operaciones pendientes
                                const updatedOperations = new Map(get().pendingOperations);
                                updatedOperations.delete(leadId);
                                set({ pendingOperations: updatedOperations });
                            } else {
                                console.log('Respuesta del servidor:', responseData);
                                
                                // Remover de operaciones pendientes
                                const updatedOperations = new Map(get().pendingOperations);
                                updatedOperations.delete(leadId);
                                set({ pendingOperations: updatedOperations });
                                
                                // Opcional: Mostrar notificación de éxito
                                // showToast(`Lead movido a ${destinationStage} exitosamente`, 'success');
                            }
                        } catch (error) {
                            console.error('Error al enviar actualización de etapa:', error);
                            showToast(`Error en la conexión con el servidor`, 'danger');
                            
                            // Remover de operaciones pendientes
                            const updatedOperations = new Map(get().pendingOperations);
                            updatedOperations.delete(leadId);
                            set({ pendingOperations: updatedOperations });
                        }
                    })();
                }

                return {
                    ...state,
                    columns: newColumns,
                    pendingOperations
                }
            })
        },
        // Implementación actualizada para el diálogo de citas
        openAppointmentDialog: (leadId) => {
            const { columns } = get()
            
            // Buscar el lead en todas las columnas
            let lead: Lead | null = null
            let leadStage: string | null = null
            
            Object.entries(columns).forEach(([stage, leads]) => {
                const found = leads.find((item) => item.id === leadId)
                if (found) {
                    lead = found
                    leadStage = stage
                }
            })
            
            if (!lead) return
            
            set({ 
                appointmentDialogOpen: true,
                selectedLeadId: leadId,
                isSchedulingAppointment: false,
                currentAppointment: lead.appointment || null,
                previousStage: leadStage // Guardamos la etapa actual para poder restaurarla si se cancela
            })
        },
        closeAppointmentDialog: () => {
            const { previousStage, selectedLeadId, columns } = get()
            
            // Si hay una etapa anterior y un lead seleccionado (y no se ha confirmado una cita)
            if (previousStage && selectedLeadId && columns.confirmed) {
                // Verificar si el lead está en la columna confirmed
                const isLeadInConfirmed = columns.confirmed.some(
                    lead => lead.id === selectedLeadId
                )
                
                if (isLeadInConfirmed) {
                    // Obtener el lead de confirmed
                    const lead = columns.confirmed.find(
                        lead => lead.id === selectedLeadId
                    )
                    
                    if (lead) {
                        // Crear nuevas columnas sin el lead en confirmed
                        const newColumns = { ...columns }
                        newColumns.confirmed = newColumns.confirmed.filter(
                            lead => lead.id !== selectedLeadId
                        )
                        
                        // Actualizar el stage del lead antes de devolverlo
                        const updatedLead = {
                            ...lead,
                            stage: previousStage // Asegurar que el stage se actualiza correctamente
                        }
                        
                        // Añadir el lead a su columna anterior
                        newColumns[previousStage] = [
                            ...newColumns[previousStage],
                            updatedLead
                        ]
                        
                        // Actualizar el estado
                        set({
                            columns: newColumns,
                            appointmentDialogOpen: false,
                            selectedLeadId: '',
                            currentAppointment: null,
                            previousStage: null
                        })
                        
                        return
                    }
                }
            }
            
            // Si no hay nada que restaurar, simplemente cerrar el diálogo
            set({ 
                appointmentDialogOpen: false,
                currentAppointment: null,
                previousStage: null
            })
        },
        setCurrentAppointment: (appointment) => 
            set({ currentAppointment: appointment }),
        setIsSchedulingAppointment: (isScheduling) => 
            set({ isSchedulingAppointment: isScheduling }),
        scheduleAppointment: (appointment) => {
            const { columns, selectedLeadId } = get()
            
            if (!selectedLeadId) return
            
            // Encontrar en qué columna está el lead
            let columnKey: string | null = null
            let leadToUpdate: Lead | null = null
            
            Object.entries(columns).forEach(([key, leads]) => {
                const found = leads.find((item) => item.id === selectedLeadId)
                if (found) {
                    columnKey = key
                    leadToUpdate = found
                }
            })
            
            if (!columnKey || !leadToUpdate) return
            
            // Actualizar el lead con la información de la cita
            const updatedLead = {
                ...leadToUpdate,
                appointment: appointment,
                // Si el lead estaba en otra columna, ahora estará en "confirmed"
                stage: 'confirmed'
            }
            
            // Si el lead estaba en otra columna, eliminarlo de ahí
            const updatedColumns = { ...columns }
            
            if (columnKey !== 'confirmed') {
                // Eliminarlo de la columna original
                updatedColumns[columnKey] = columns[columnKey].filter(
                    (item) => item.id !== selectedLeadId
                )
                
                // Añadirlo a la columna "confirmed"
                updatedColumns.confirmed = [
                    ...(columns.confirmed || []),
                    updatedLead
                ]
                
                // Enviar la actualización al servidor
                if (typeof window !== 'undefined') {
                    (async () => {
                        try {
                            console.log('Enviando actualización de etapa a confirmed para lead:', selectedLeadId);
                            const response = await fetch('/api/leads/update-stage', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    leadId: selectedLeadId,
                                    newStage: 'confirmed'
                                }),
                            });
                            
                            if (!response.ok) {
                                console.error('Error al actualizar etapa a confirmed');
                                showToast('Error al confirmar el lead', 'danger');
                            } else {
                                console.log('Etapa actualizada exitosamente a confirmed');
                                
                                // Enviar la cita al servidor para que se refleje en el calendario
                                try {
                                    console.log('Creando cita en el servidor para lead:', selectedLeadId);
                                    // Convertir el appointment a formato esperado por la API
                                    const appointmentData = {
                                        lead_id: appointment.leadId || selectedLeadId,
                                        agent_id: appointment.agentId,
                                        appointment_date: appointment.date,
                                        appointment_time: appointment.time,
                                        location: appointment.location,
                                        property_type: appointment.propertyType,
                                        status: 'scheduled',
                                        notes: appointment.notes,
                                        property_ids: appointment.propertyIds || []
                                    };
                                    
                                    // Llamar a la API de citas
                                    const appointmentResponse = await fetch('/api/appointments/create', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(appointmentData),
                                    });
                                    
                                    if (!appointmentResponse.ok) {
                                        const errorData = await appointmentResponse.json();
                                        console.error('Error al crear cita en el servidor:', errorData);
                                        showToast(`Error al crear cita: ${errorData.error || 'Error desconocido'}`, 'warning');
                                    } else {
                                        const result = await appointmentResponse.json();
                                        console.log('Cita creada exitosamente en el servidor:', result);
                                        showToast('Cita programada y guardada correctamente', 'success');
                                        
                                        // Actualizar el ID de la cita en el lead
                                        if (result && result.id) {
                                            updatedLead.appointment.id = result.id;
                                            // Actualizar la columna confirmed con el nuevo ID de cita
                                            updatedColumns.confirmed = updatedColumns.confirmed.map(lead => 
                                                lead.id === selectedLeadId ? updatedLead : lead
                                            );
                                            // Actualizar el estado con las columnas actualizadas
                                            set({ columns: updatedColumns });
                                        }
                                    }
                                } catch (appointmentError) {
                                    console.error('Error al enviar cita al servidor:', appointmentError);
                                    showToast('Error al guardar la cita en el servidor', 'danger');
                                }
                            }
                        } catch (error) {
                            console.error('Error al enviar actualización a confirmed:', error);
                            showToast('Error de conexión con el servidor', 'danger');
                        }
                    })();
                }
            } else {
                // Solo actualizarlo en la misma columna
                updatedColumns.confirmed = columns.confirmed.map((item) => 
                    item.id === selectedLeadId ? updatedLead : item
                )
                
                // Si está en columna confirmed, solo actualizamos la cita
                if (typeof window !== 'undefined') {
                    (async () => {
                        try {
                            console.log('Actualizando cita existente para lead ya confirmado:', selectedLeadId);
                            // Convertir el appointment a formato esperado por la API
                            const appointmentData = {
                                lead_id: appointment.leadId || selectedLeadId,
                                agent_id: appointment.agentId,
                                appointment_date: appointment.date,
                                appointment_time: appointment.time,
                                location: appointment.location,
                                property_type: appointment.propertyType,
                                status: appointment.status || 'scheduled',
                                notes: appointment.notes,
                                property_ids: appointment.propertyIds || []
                            };
                            
                            // Si ya tiene ID de cita, actualizamos; si no, creamos nueva
                            const endpoint = appointment.id ? 
                                `/api/appointments/update/${appointment.id}` : 
                                '/api/appointments/create';
                            
                            const appointmentResponse = await fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(appointmentData),
                            });
                            
                            if (!appointmentResponse.ok) {
                                const errorData = await appointmentResponse.json();
                                console.error('Error al actualizar cita en el servidor:', errorData);
                                showToast(`Error al actualizar cita: ${errorData.error || 'Error desconocido'}`, 'warning');
                            } else {
                                const result = await appointmentResponse.json();
                                console.log('Cita actualizada exitosamente en el servidor:', result);
                                showToast('Cita actualizada correctamente', 'success');
                                
                                // Actualizar el ID de la cita en el lead si es una nueva cita
                                if (!appointment.id && result && result.id) {
                                    updatedLead.appointment.id = result.id;
                                    // Actualizar la columna confirmed con el nuevo ID de cita
                                    updatedColumns.confirmed = updatedColumns.confirmed.map(lead => 
                                        lead.id === selectedLeadId ? updatedLead : lead
                                    );
                                    // Actualizar el estado con las columnas actualizadas
                                    set({ columns: updatedColumns });
                                }
                            }
                        } catch (appointmentError) {
                            console.error('Error al enviar cita al servidor:', appointmentError);
                            showToast('Error al guardar la cita en el servidor', 'danger');
                        }
                    })();
                }
            }
            
            set({ 
                columns: updatedColumns,
                appointmentDialogOpen: false,
                currentAppointment: null,
                isSchedulingAppointment: false,
                previousStage: null // Resetear la etapa anterior
            })
        },
        // Nueva acción para cancelar específicamente la programación de cita
        cancelAppointmentScheduling: () => {
            const { previousStage, selectedLeadId, columns } = get()
            
            // Solo actuar si hay una etapa anterior y un lead seleccionado
            if (previousStage && selectedLeadId && columns.confirmed) {
                // Verificar si el lead está en la columna confirmed
                const isLeadInConfirmed = columns.confirmed.some(
                    lead => lead.id === selectedLeadId
                )
                
                if (isLeadInConfirmed) {
                    // Obtener el lead de confirmed
                    const lead = columns.confirmed.find(
                        lead => lead.id === selectedLeadId
                    )
                    
                    if (lead) {
                        // Crear nuevas columnas sin el lead en confirmed
                        const newColumns = { ...columns }
                        newColumns.confirmed = newColumns.confirmed.filter(
                            lead => lead.id !== selectedLeadId
                        )
                        
                        // Actualizar el stage del lead antes de devolverlo
                        const updatedLead = {
                            ...lead,
                            stage: previousStage // Asegurar que el stage se actualiza correctamente
                        }
                        
                        // Añadir el lead a su columna anterior
                        newColumns[previousStage] = [
                            ...newColumns[previousStage],
                            updatedLead
                        ]
                        
                        // Actualizar el estado
                        set({
                            columns: newColumns,
                            previousStage: null,
                            selectedLeadId: '',
                        })
                        
                        // Enviar la actualización al servidor para restaurar la etapa original
                        if (typeof window !== 'undefined' && previousStage) {
                            (async () => {
                                try {
                                    const response = await fetch('/api/leads/update-stage', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            leadId: lead.id,
                                            newStage: previousStage
                                        }),
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Error al restaurar etapa original');
                                    }
                                } catch (error) {
                                    console.error('Error al enviar restauración de etapa:', error);
                                }
                            })();
                        }
                    }
                }
            }
        }
    }),
)
