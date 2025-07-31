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
import { Notification } from '@/components/ui/Notification'
import { getRealLeadId } from '@/utils/leadIdResolver'
import { subscribeToLeadUpdates } from '@/utils/broadcastLeadUpdate'
import { getStoredLeadData } from '@/utils/leadPropertyStorage'

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
    // Estado para animación de movimiento de leads
    animatingLead: Lead | null
    animationFromPosition: { x: number, y: number } | null
    animationToPosition: { x: number, y: number } | null
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
    // Animación de movimiento de leads
    setLeadAnimation: (lead: Lead | null, fromPos: { x: number, y: number } | null, toPos: { x: number, y: number } | null) => void
    clearLeadAnimation: () => void
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
    pendingOperations: new Map(),
    animatingLead: null,
    animationFromPosition: null,
    animationToPosition: null
}

// Utility function para mostrar notificaciones toast
const showToast = (message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    // Solo ejecutar esto en el cliente
    if (typeof window !== 'undefined') {
        // Por ahora, usar solo strings simples para evitar errores
        toast.push(message);
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
            
            // Si no hay lead, salir
            if (!lead || !lead.id) {
                console.error('updateLead: No se proporcionó un lead válido')
                return
            }
            
            // Array de posibles IDs para buscar
            const metadata = lead.metadata as any
            const possibleIds = [
                lead.id,
                selectedLeadId,
                metadata?.original_lead_id,
                metadata?.db_id,
                metadata?.real_id
            ].filter(Boolean) // Eliminar valores undefined/null
            
            console.log('updateLead: Buscando lead con posibles IDs:', possibleIds)
            
            // Encontrar en qué columna está el lead
            let columnKey: string | null = null
            let foundLeadId: string | null = null
            
            // Buscar el lead en todas las columnas con todos los posibles IDs
            for (const [key, leads] of Object.entries(columns)) {
                for (const possibleId of possibleIds) {
                    const found = leads.find((item) => item.id === possibleId)
                    if (found) {
                        columnKey = key
                        foundLeadId = found.id
                        console.log(`Lead encontrado en columna ${key} con ID ${foundLeadId}`)
                        break
                    }
                }
                if (columnKey) break
            }
            
            // Si no encontramos el lead en ninguna columna
            if (!columnKey || !foundLeadId) {
                console.warn(`Lead no encontrado en ninguna columna. Intentando determinar columna por stage...`)
                
                // Intentar determinar la columna basándose en el stage del lead
                const leadStage = (lead as any).stage || metadata?.stage
                
                if (leadStage && columns[leadStage]) {
                    console.log(`Agregando lead a columna ${leadStage} basado en su stage`)
                    
                    // Agregar el lead a la columna correspondiente
                    const updatedColumns = {
                        ...columns,
                        [leadStage]: [...(columns[leadStage] || []), lead]
                    }
                    
                    // Si el ID cambió, actualizar también selectedLeadId
                    if (lead.id !== selectedLeadId) {
                        set({ 
                            columns: updatedColumns,
                            selectedLeadId: lead.id
                        })
                    } else {
                        set({ columns: updatedColumns })
                    }
                    
                    console.log(`Lead agregado exitosamente a columna ${leadStage}`)
                    return
                }
                
                // Si tampoco podemos determinar la columna por stage
                console.error('No se pudo determinar la columna para el lead. Datos del lead:', {
                    id: lead.id,
                    stage: lead.stage,
                    metadata: lead.metadata
                })
                
                // Como último recurso, intentar recuperar datos guardados localmente
                try {
                    const storedData = getStoredLeadData(lead.id, 'structured')
                    if (storedData && storedData.stage) {
                        console.log('Datos recuperados del almacenamiento local, stage:', storedData.stage)
                        
                        // Usar el stage almacenado
                        const stageToUse = storedData.stage
                        if (columns[stageToUse]) {
                            const updatedColumns = {
                                ...columns,
                                [stageToUse]: [...(columns[stageToUse] || []), { ...lead, stage: stageToUse }]
                            }
                            
                            set({ 
                                columns: updatedColumns,
                                selectedLeadId: lead.id
                            })
                            
                            console.log(`Lead agregado a columna ${stageToUse} usando datos almacenados`)
                            return
                        }
                    }
                } catch (error) {
                    console.error('Error recuperando datos almacenados:', error)
                }
                
                // Si todo falla, simplemente actualizar el selectedLeadId si cambió
                if (lead.id !== selectedLeadId) {
                    console.log('Actualizando solo selectedLeadId')
                    set({ selectedLeadId: lead.id })
                }
                
                return
            }
            
            // Actualizar el lead en su columna
            console.log(`Actualizando lead ${foundLeadId} en columna ${columnKey}`)
            
            const updatedLeads = columns[columnKey].map((item) => {
                // Comparar con todos los posibles IDs
                if (possibleIds.includes(item.id)) {
                    console.log('Lead actualizado:', { 
                        oldId: item.id, 
                        newId: lead.id,
                        hasMetadata: !!lead.metadata
                    })
                    
                    // Mantener el stage correcto
                    return { 
                        ...lead, 
                        id: lead.id,
                        stage: columnKey // Asegurar que el stage esté sincronizado con la columna
                    }
                }
                return item
            })
            
            // Actualizar las columnas
            const updatedColumns = {
                ...columns,
                [columnKey]: updatedLeads
            }
            
            // Si el ID cambió, actualizar también selectedLeadId
            if (lead.id !== selectedLeadId && lead.id !== foundLeadId) {
                console.log(`Actualizando selectedLeadId de ${selectedLeadId} a ${lead.id}`)
                set({ 
                    columns: updatedColumns,
                    selectedLeadId: lead.id
                })
            } else {
                set({ columns: updatedColumns })
            }
            
            console.log('Lead actualizado exitosamente en el store')
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
                            
                            // Primero intentar con el endpoint normal
                            let useSimulation = false;
                            const realLeadId = getRealLeadId(sourceLead); // Usar el ID real del lead
                            
                            try {
                                const response = await fetch('/api/leads/update-stage', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        leadId: realLeadId,
                                        newStage: destinationStage
                                    }),
                                });
                                
                                // Si el primer intento falla con 404 o 500, usar simulación
                                if (!response.ok && (response.status === 404 || response.status === 500)) {
                                    console.log(`Error ${response.status} en API update-stage, intentando con simulación`);
                                    useSimulation = true;
                                } else {
                                    const responseData = await response.json();
                                    
                                    if (!responseData.success) {
                                        console.log(`Error en API update-stage: ${responseData.error}, intentando con simulación`);
                                        useSimulation = true;
                                    } else {
                                        console.log('Respuesta del servidor:', responseData);
                                        
                                        // Remover de operaciones pendientes
                                        const updatedOperations = new Map(get().pendingOperations);
                                        updatedOperations.delete(leadId);
                                        set({ pendingOperations: updatedOperations });
                                    }
                                }
                            } catch (error) {
                                console.error('Error al llamar API update-stage:', error);
                                console.log('Error en la conexión, intentando con simulación');
                                useSimulation = true;
                            }
                            
                            // Si hay que usar simulación, hacer la llamada al endpoint de simulación
                            if (useSimulation) {
                                try {
                                    console.log('Usando endpoint de simulación para actualizar etapa');
                                    const simResponse = await fetch('/api/leads/simulate-stage-update', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            leadId: realLeadId,
                                            newStage: destinationStage,
                                            fromChatbot: false
                                        }),
                                    });
                                    
                                    const simData = await simResponse.json();
                                    
                                    if (!simResponse.ok || !simData.success) {
                                        console.error('Error incluso en simulación:', simData.error || 'Error desconocido');
                                    } else {
                                        console.log('Simulación exitosa:', simData);
                                    }
                                    
                                    // Remover de operaciones pendientes independientemente del resultado
                                    const updatedOperations = new Map(get().pendingOperations);
                                    updatedOperations.delete(leadId);
                                    set({ pendingOperations: updatedOperations });
                                } catch (simError) {
                                    console.error('Error en simulación:', simError);
                                    
                                    // Remover de operaciones pendientes
                                    const updatedOperations = new Map(get().pendingOperations);
                                    updatedOperations.delete(leadId);
                                    set({ pendingOperations: updatedOperations });
                                }
                            }
                        } catch (error) {
                            console.error('Error al enviar actualización de etapa:', error);
                            console.error('Error en la conexión con el servidor');
                            
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
            console.log('salesFunnelStore: scheduleAppointment iniciado');
            const { columns, selectedLeadId } = get()
            
            if (!selectedLeadId) {
                console.log('salesFunnelStore: No hay selectedLeadId, saliendo');
                return
            }
            
            // Cerrar el diálogo inmediatamente
            console.log('salesFunnelStore: Cerrando diálogo inmediatamente');
            set({ appointmentDialogOpen: false })
            
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
            
            if (!columnKey || !leadToUpdate) {
                console.log('salesFunnelStore: No se encontró el lead, saliendo');
                return
            }
            
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
                                console.error('Error al confirmar el lead');
                            } else {
                                console.log('Etapa actualizada exitosamente a confirmed');
                                
                                // Enviar la cita al servidor para que se refleje en el calendario
                                try {
                                    console.log('Creando cita en el servidor para lead:', selectedLeadId);
                                    console.log('Datos de appointment recibidos:', appointment);
                                    // Validar que los campos necesarios estén presentes
                                    if (!appointment.agentId) {
                                        throw new Error('Agent ID es requerido');
                                    }
                                    if (!appointment.date || !appointment.time) {
                                        throw new Error('Fecha y hora son requeridas');
                                    }
                                    
                                    // Log para debug
                                    console.log('Preparando datos de cita:', {
                                        appointmentLeadId: appointment.leadId,
                                        selectedLeadId: selectedLeadId,
                                        leadIdFinal: appointment.leadId || selectedLeadId
                                    });
                                    
                                    // Convertir el appointment a formato esperado por la API
                                    const appointmentData = {
                                        lead_id: appointment.leadId || selectedLeadId,
                                        agent_id: appointment.agentId,
                                        appointment_date: appointment.date,
                                        appointment_time: appointment.time,
                                        location: appointment.location || '',
                                        property_type: appointment.propertyType || 'Casa',
                                        status: 'scheduled',
                                        notes: appointment.notes || '',
                                        property_ids: appointment.propertyIds || []
                                    };
                                    
                                    console.log('Datos a enviar a la API:', appointmentData);
                                    
                                    // Llamar a la API de citas
                                    const appointmentResponse = await fetch('/api/appointments/create', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(appointmentData),
                                    });
                                    
                                    console.log('Respuesta del servidor - status:', appointmentResponse.status);
                                    
                                    if (!appointmentResponse.ok) {
                                        const errorData = await appointmentResponse.json();
                                        console.error('Error al crear cita en el servidor - respuesta completa:', errorData);
                                        console.error('Error al crear cita:', errorData.error || 'Error desconocido');
                                    } else {
                                        const result = await appointmentResponse.json();
                                        console.log('Cita creada exitosamente en el servidor:', result);
                                        console.log('Cita programada y guardada correctamente');
                                        
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
                                    console.error('Error al enviar cita al servidor - detalles:', appointmentError);
                                    console.error('Mensaje del error:', appointmentError.message);
                                    console.error('Stack del error:', appointmentError.stack);
                                }
                            }
                        } catch (error) {
                            console.error('Error al enviar actualización a confirmed:', error);
                            console.error('Error de conexión con el servidor');
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
                                        console.error('Error al actualizar cita:', errorData.error || 'Error desconocido');
                            } else {
                                const result = await appointmentResponse.json();
                                console.log('Cita actualizada exitosamente en el servidor:', result);
                                console.log('Cita actualizada correctamente');
                                
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
            
            console.log('salesFunnelStore: Actualizando columnas');
            // Actualizar las columnas sin cerrar el diálogo (ya se cerró al inicio)
            set({ 
                columns: updatedColumns,
                currentAppointment: null,
                isSchedulingAppointment: false,
                previousStage: null // Resetear la etapa anterior
            })
            console.log('salesFunnelStore: scheduleAppointment completado')
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
        },
        setLeadAnimation: (lead, fromPos, toPos) => 
            set({ 
                animatingLead: lead,
                animationFromPosition: fromPos,
                animationToPosition: toPos
            }),
        clearLeadAnimation: () => 
            set({ 
                animatingLead: null,
                animationFromPosition: null,
                animationToPosition: null
            })
    }),
)
