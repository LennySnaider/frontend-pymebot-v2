/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadContent.tsx
 * Componente para mostrar y editar el contenido detallado de un lead inmobiliario.
 * Parte del módulo de Sales Funnel para agentes inmobiliarios.
 *
 * @version 3.1.2
 * @updated 2025-04-12
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { showSuccess, showError } from '@/utils/notifications'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import LeadView from './LeadView'
import LeadEditFormPersistent from './LeadEditFormPersistent'
import { Lead, Property } from './types'
import { getRealLeadId } from '@/utils/leadIdResolver'
import { getStoredLeadData, storeLeadData, storeLeadFormState, getLeadFormState } from '@/utils/leadPropertyStorage'
import { broadcastLeadUpdate } from '@/utils/broadcastLeadUpdate'
import { leadUpdateStore } from '@/stores/leadUpdateStore'
import { simpleLeadUpdateStore } from '@/stores/simpleLeadUpdateStore'
import { registerLeadName } from '@/utils/directSyncLeadNames'
import { publishLeadNameChange } from '@/utils/globalSyncEvent'

// Declaración del caché global para TypeScript
declare global {
    interface Window {
        __globalLeadCache?: {
            updateLeadData: (leadId: string, data: any) => void;
        };
    }
}

interface LeadContentProps {
    onLeadClose?: () => void
}

const LeadContent = ({ onLeadClose }: LeadContentProps) => {
    const dialogOpen = useSalesFunnelStore((state) => state.dialogOpen)
    const dialogView = useSalesFunnelStore((state) => state.dialogView)
    const selectedLeadId = useSalesFunnelStore((state) => state.selectedLeadId)
    const closeDialog = useSalesFunnelStore((state) => state.closeDialog)
    const updateLead = useSalesFunnelStore((state) => state.updateLead)
    const setSelectedLeadId = useSalesFunnelStore((state) => state.setSelectedLeadId)

    const [mode, setMode] = useState<'view' | 'edit'>('view')
    const [leadData, setLeadData] = useState<Lead | null>(null)
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
    const [isLoadingProperties, setIsLoadingProperties] = useState(false)

    useEffect(() => {
        console.log('Effect triggered - selectedLeadId:', selectedLeadId)
        if (!selectedLeadId) {
            console.log('No selectedLeadId, skipping lead fetch')
            return
        }

        const findSelectedLead = () => {
            console.log('Finding lead with ID:', selectedLeadId)
            const { columns } = useSalesFunnelStore.getState()
            console.log('Current columns in store:', Object.keys(columns))
            console.log('Total leads across all columns:', Object.values(columns).reduce((acc, col) => acc + col.length, 0))

            let foundLead = null
            let foundInColumn = ''
            for (const columnKey in columns) {
                console.log(
                    `Searching in column "${columnKey}" (${columns[columnKey]?.length || 0} leads)`,
                )
                const lead = columns[columnKey]?.find(
                    (lead) => lead.id === selectedLeadId,
                )
                if (lead) {
                    foundLead = lead
                    foundInColumn = columnKey
                    console.log(
                        `Found lead in column "${columnKey}":`,
                        lead.name || lead.id,
                    )
                    break
                }
            }

            if (!foundLead) {
                // Si no encontramos el lead con el ID seleccionado, 
                // buscar por el ID original en metadata
                console.log('Lead not found with selected ID, searching with metadata original_lead_id')
                
                for (const columnKey in columns) {
                    const lead = columns[columnKey]?.find(
                        (lead) => lead.metadata && 'original_lead_id' in lead.metadata && (lead.metadata as any).original_lead_id === selectedLeadId
                    )
                    if (lead) {
                        foundLead = lead
                        foundInColumn = columnKey
                        console.log(
                            `Found lead with original_lead_id in column "${columnKey}":`,
                            lead.name || lead.id,
                        )
                        // Actualizar el selectedLeadId al ID real
                        setSelectedLeadId(lead.id)
                        break
                    }
                }
            }
            
            if (!foundLead) {
                console.warn(
                    `Lead with ID "${selectedLeadId}" not found in any column`,
                )
            } else {
                console.log(`Lead found in column "${foundInColumn}"`)
                console.log('Lead details:', {
                    id: foundLead.id,
                    name: foundLead.name,
                    metadata: foundLead.metadata
                })
            }
            return foundLead
        }

        const selected = findSelectedLead()
        if (selected) {
            console.log('Setting lead data:', selected)
            
            // Normalizar los datos antes de guardarlos para asegurar compatibilidad
            let normalizedLead = {
                ...selected,
                // Asegurar que campos importantes estén disponibles tanto en el objeto principal como en metadata
                agentId: selected.agentId || selected.metadata?.agentId || selected.agent_id,
                description: selected.description || selected.notes || selected.metadata?.description || '',
                metadata: {
                    ...selected.metadata,
                    // Copiar campos importantes a metadata si solo existen en el objeto principal
                    agentId: selected.metadata?.agentId || selected.agentId || selected.agent_id,
                    email: selected.metadata?.email || selected.email,
                    phone: selected.metadata?.phone || selected.phone,
                    source: selected.metadata?.source || selected.source || 'web',
                    interest: selected.metadata?.interest || selected.interest_level || selected.interest || 'medio',
                    agentNotes: selected.metadata?.agentNotes || selected.agent_notes || '',
                    nextContactDate: selected.metadata?.nextContactDate || selected.next_contact_date || '',
                    propertyType: selected.metadata?.propertyType || selected.property_type,
                    bedroomsNeeded: selected.metadata?.bedroomsNeeded !== undefined ? selected.metadata?.bedroomsNeeded : selected.bedrooms_needed,
                    bathroomsNeeded: selected.metadata?.bathroomsNeeded !== undefined ? selected.metadata?.bathroomsNeeded : selected.bathrooms_needed
                }
            }
            
            // Intentar recuperar datos adicionales del almacenamiento local
            try {
                // Obtener los datos almacenados en formato estructurado para el lead
                const storedData = getStoredLeadData(selected.id, 'structured');
                
                if (storedData) {
                    console.log('Se encontraron datos guardados para lead:', storedData);
                    
                    // Combinar con los datos actuales, priorizando los datos de la API
                    normalizedLead = {
                        ...storedData,              // Primero los datos almacenados como base
                        ...normalizedLead,          // Sobrescribir con datos de la API
                        // Combinar metadata de manera especial
                        metadata: {
                            ...storedData.metadata,  // Datos almacenados en metadata
                            ...normalizedLead.metadata, // Sobrescribir con los datos de la API
                            // Asegurar que campos críticos estén disponibles
                            propertyType: normalizedLead.metadata?.propertyType || storedData.metadata?.propertyType || normalizedLead.property_type,
                            bedroomsNeeded: normalizedLead.metadata?.bedroomsNeeded !== undefined 
                                ? normalizedLead.metadata?.bedroomsNeeded 
                                : (storedData.metadata?.bedroomsNeeded !== undefined 
                                    ? storedData.metadata?.bedroomsNeeded 
                                    : normalizedLead.bedrooms_needed),
                            bathroomsNeeded: normalizedLead.metadata?.bathroomsNeeded !== undefined 
                                ? normalizedLead.metadata?.bathroomsNeeded 
                                : (storedData.metadata?.bathroomsNeeded !== undefined 
                                    ? storedData.metadata?.bathroomsNeeded 
                                    : normalizedLead.bathrooms_needed),
                            agentId: normalizedLead.metadata?.agentId || normalizedLead.agentId || storedData.metadata?.agentId || storedData.agentId,
                            source: normalizedLead.metadata?.source || normalizedLead.source || storedData.metadata?.source || storedData.source || 'web',
                            interest: normalizedLead.metadata?.interest || normalizedLead.interest_level || storedData.metadata?.interest || storedData.interest || 'medio',
                            agentNotes: normalizedLead.metadata?.agentNotes || normalizedLead.agent_notes || storedData.metadata?.agentNotes || storedData.agentNotes || '',
                            nextContactDate: normalizedLead.metadata?.nextContactDate || normalizedLead.next_contact_date || storedData.metadata?.nextContactDate || storedData.nextContactDate || ''
                        },
                        // Asegurar que description esté disponible
                        description: normalizedLead.description || normalizedLead.notes || storedData.description || storedData.notes || ''
                    }
                    
                    console.log('Lead normalizado con datos almacenados:', normalizedLead);
                }
            } catch (error) {
                console.error('Error recuperando datos guardados:', error);
            }
            
            setLeadData(normalizedLead)
            
            // Recuperar el modo guardado si existe
            const savedFormState = getLeadFormState(selected.id)
            if (savedFormState && savedFormState.lastEditMode) {
                setMode(savedFormState.lastEditMode)
            } else {
                setMode('view')
            }
        } else {
            console.warn('No lead found with ID:', selectedLeadId)
        }
    }, [selectedLeadId, setSelectedLeadId])

    useEffect(() => {
        if (dialogOpen && dialogView === 'LEAD') {
            // Diálogo abierto
        } else {
            setFilteredProperties([])
            setIsLoadingProperties(false)
        }
    }, [dialogOpen, dialogView])

    useEffect(() => {
        if (leadData?.metadata) {
            const needsUpdate = [
                typeof leadData.metadata.propertyType === 'object',
                typeof leadData.metadata.source === 'object',
                typeof leadData.metadata.interest === 'object',
                typeof leadData.metadata.selectedProperty === 'object',
                // Comprobar si hay valores importantes faltantes que podrían estar en la metadata o en el objeto principal
                leadData.metadata.propertyType === undefined && 'property_type' in leadData && (leadData as any).property_type !== undefined,
                leadData.metadata.bathroomsNeeded === undefined && 'bathrooms_needed' in leadData && (leadData as any).bathrooms_needed !== undefined, 
                leadData.metadata.bedroomsNeeded === undefined && 'bedrooms_needed' in leadData && (leadData as any).bedrooms_needed !== undefined
            ].some(Boolean)

            if (needsUpdate) {
                console.log('Normalizando valores de metadatos')
                setLeadData((prevState) => {
                    if (!prevState) return prevState
                    return {
                        ...prevState,
                        metadata: {
                            ...prevState.metadata,
                            // Usar valores del objeto principal si existen en la metadata pero como objetos
                            propertyType:
                                typeof prevState.metadata?.propertyType === 'object'
                                    ? (prevState.metadata.propertyType as any)?.value || ''
                                    : prevState.metadata?.propertyType || ('property_type' in prevState ? (prevState as any).property_type : '') || '',
                            source:
                                typeof prevState.metadata?.source === 'object'
                                    ? (prevState.metadata.source as any)?.value || ''
                                    : prevState.metadata?.source || '',
                            interest:
                                typeof prevState.metadata?.interest === 'object'
                                    ? (prevState.metadata.interest as any)?.value || 'medio'
                                    : prevState.metadata?.interest || 'medio',
                            selectedProperty:
                                typeof prevState.metadata?.selectedProperty === 'object'
                                    ? (prevState.metadata.selectedProperty as any)?.value || ''
                                    : prevState.metadata?.selectedProperty || '',
                            // Asegurarse de que bedroomsNeeded y bathroomsNeeded estén en metadata
                            bedroomsNeeded: prevState.metadata?.bedroomsNeeded !== undefined 
                                ? prevState.metadata.bedroomsNeeded 
                                : ('bedrooms_needed' in prevState ? (prevState as any).bedrooms_needed : undefined),
                            bathroomsNeeded: prevState.metadata?.bathroomsNeeded !== undefined 
                                ? prevState.metadata.bathroomsNeeded 
                                : ('bathrooms_needed' in prevState ? (prevState as any).bathrooms_needed : undefined),
                            // También asegurarse de que agentId esté sincronizado
                            agentId: ('agentId' in (prevState.metadata || {}) ? (prevState.metadata as any).agentId : undefined) || (prevState as any).agentId
                        },
                        // Sincronizar en ambas direcciones
                        agentId: (prevState as any).agentId || ('agentId' in (prevState.metadata || {}) ? (prevState.metadata as any).agentId : undefined)
                    }
                })
            }
        }
    }, [leadData])

    const resetFormValues = () => {
        setMode('view')
        setFilteredProperties([])
        setIsLoadingProperties(false)
        
        // Guardar el modo actual en el estado del formulario
        if (leadData?.id) {
            storeLeadFormState(leadData.id, { lastEditMode: 'view' })
        }
    }

    const handleLeadClose = () => {
        console.log('handleLeadClose called')
        resetFormValues()
        console.log('Calling closeDialog from store')
        closeDialog()
        if (onLeadClose) {
            console.log('Calling onLeadClose callback')
            onLeadClose()
        }
        console.log('Dialog should be closed now')
    }

    const handleSave = async () => {
        if (leadData) {
            try {
                const name = leadData.name || 'Cliente sin nombre'
                const leadDataToSave = {
                    id: leadData.id,
                    full_name: name,
                    email: leadData.email || leadData.metadata?.email || '',
                    phone: leadData.phone || leadData.metadata?.phone || '',
                    notes: leadData.description || '',
                    property_type: leadData.metadata?.propertyType || 'Casa',
                    budget_min: leadData.metadata?.budget || 0,
                    budget_max: leadData.metadata?.budgetMax || 0,
                    bedrooms_needed: leadData.metadata?.bedroomsNeeded || 0,
                    bathrooms_needed: leadData.metadata?.bathroomsNeeded || 0,
                    features_needed: leadData.metadata?.featuresNeeded || '',
                    preferred_zones: leadData.metadata?.preferredZones || [],
                    agent_notes: leadData.metadata?.agentNotes || '',
                    source: leadData.metadata?.source || 'Sitio web',
                    interest_level: leadData.metadata?.interest || 'medio',
                    next_contact_date:
                        leadData.metadata?.nextContactDate || null,
                    contact_count: leadData.contactCount || 0,
                    description: leadData.description || '',
                    selected_property_id:
                        leadData.metadata?.selectedProperty || null,
                    stage: (leadData as any).stage, // Asegurar que el stage se incluya
                    metadata: {
                        ...leadData.metadata,
                        original_lead_id: leadData.id,
                    },
                    tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322',
                }

                console.log('Guardando datos del prospecto:', leadDataToSave)

                const isEditingExistingLead =
                    leadData.id && leadData.id.length > 10
                const url = isEditingExistingLead
                    ? `/api/leads/update/${leadData.id}`
                    : '/api/leads/create'
                const method = isEditingExistingLead ? 'PUT' : 'POST'

                console.log(
                    `${isEditingExistingLead ? 'Actualizando' : 'Creando'} lead en la base de datos...`,
                )

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(leadDataToSave),
                })

                if (!response.ok) {
                    throw new Error(
                        `No se pudo ${
                            isEditingExistingLead ? 'actualizar' : 'crear'
                        } el lead en la base de datos`,
                    )
                }

                const result = await response.json()
                console.log(
                    `Lead ${
                        isEditingExistingLead ? 'actualizado' : 'creado'
                    } exitosamente:`,
                    result,
                )

                if (result.data) {
                    // Preparar los datos actualizados del lead
                    const updatedLeadData = {
                        ...leadData,
                        ...result.data, // Incluir todos los datos de la respuesta
                        id: result.data.id || leadData.id,
                        stage: (result.data as any).stage || (leadData as any).stage || (leadDataToSave as any).stage,
                        metadata: {
                            ...leadData.metadata,
                            ...result.data.metadata,
                            original_lead_id: leadData.id, // Guardar el ID temporal original
                            db_id: result.data.id, // Guardar el ID de la base de datos
                        }
                    }
                    
                    console.log('Lead actualizado con datos de la respuesta:', {
                        oldId: leadData.id,
                        newId: updatedLeadData.id,
                        stage: updatedLeadData.stage
                    })
                    
                    // Guardar datos completos en almacenamiento local para persistencia
                    try {
                        // Guardar con todos los posibles IDs para mayor seguridad
                        const idsToStore = new Set([
                            updatedLeadData.id,
                            leadData.id,
                            result.data.id,
                            updatedLeadData.metadata?.db_id,
                            updatedLeadData.metadata?.original_lead_id
                        ].filter(Boolean))
                        
                        // Guardar datos completos para cada ID
                        idsToStore.forEach(id => {
                            storeLeadData(id, updatedLeadData)
                        })
                        
                        console.log('Datos completos del lead guardados en almacenamiento local para IDs:', Array.from(idsToStore))
                    } catch (error) {
                        console.error('Error guardando datos del lead:', error)
                    }
                    
                    setLeadData(updatedLeadData)
                    
                    // IMPORTANTE: Registrar el nombre del lead para sincronización en tiempo real
                    try {
                        // ACTUALIZAR INSTANTÁNEAMENTE EL NOMBRE EN EL CHAT
                        const leadIdForSync = updatedLeadData.id || result.data.id || leadData.id;
                        const normalizedId = leadIdForSync.startsWith('lead_') ? leadIdForSync.substring(5) : leadIdForSync;
                        const chatId = `lead_${normalizedId}`;
                        
                        console.log(`LeadContent: Actualización instantánea del nombre: ${normalizedId} -> "${name}"`);
                        
                        // 1. ACTUALIZAR DIRECTAMENTE EL CHATSTORE (instantáneo)
                        const chatStorePromise = import('@/app/(protected-pages)/modules/marketing/chat/_store/chatStore').then(({ useChatStore }) => {
                            const store = useChatStore.getState();
                            if (store && typeof store.updateChatName === 'function') {
                                console.log(`LeadContent: Actualizando ChatStore instantáneamente: ${chatId} -> "${name}"`);
                                
                                // Actualizar nombre en la lista
                                store.updateChatName(chatId, name);
                                
                                // Si es el chat seleccionado, actualizar también el selectedChat
                                if (store.selectedChat && store.selectedChat.id === chatId) {
                                    console.log(`LeadContent: Actualizando selectedChat instantáneamente`);
                                    store.setSelectedChat({
                                        ...store.selectedChat,
                                        name: name,
                                        user: store.selectedChat.user ? {
                                            ...store.selectedChat.user,
                                            name: name
                                        } : undefined
                                    });
                                }
                                
                                // También actualizar metadata si está disponible
                                if (typeof store.updateChatMetadata === 'function') {
                                    store.updateChatMetadata(chatId, {
                                        stage: updatedLeadData.stage,
                                        email: updatedLeadData.email || updatedLeadData.metadata?.email,
                                        phone: updatedLeadData.phone || updatedLeadData.metadata?.phone,
                                        lastUpdate: Date.now()
                                    });
                                }
                                
                                // Forzar trigger de actualización múltiples veces para garantizar
                                store.setTriggerUpdate(Date.now());
                                setTimeout(() => store.setTriggerUpdate(Date.now()), 50);
                                setTimeout(() => store.setTriggerUpdate(Date.now()), 100);
                                setTimeout(() => store.setTriggerUpdate(Date.now()), 200);
                            }
                        }).catch(err => {
                            console.error('Error actualizando ChatStore directamente:', err);
                        });
                        
                        // Esperar un momento y luego forzar una actualización completa
                        setTimeout(async () => {
                            try {
                                const { useChatStore } = await import('@/app/(protected-pages)/modules/marketing/chat/_store/chatStore');
                                const store = useChatStore.getState();
                                if (store.refreshChatList) {
                                    console.log('LeadContent: Forzando refresh completo del chat');
                                    store.refreshChatList();
                                }
                            } catch (e) {
                                console.error('Error forzando refresh:', e);
                            }
                        }, 500);
                        
                        // 2. Registrar en el sistema de sincronización directa
                        registerLeadName(normalizedId, name);
                        registerLeadName(leadIdForSync, name);
                        
                        // 4. Publicar en el sistema de eventos globales
                        publishLeadNameChange(normalizedId, name);
                        
                        // 3. ACTUALIZAR EL CACHÉ GLOBAL DEL CHAT
                        if (window.__globalLeadCache) {
                            console.log('LeadContent: Actualizando globalLeadCache');
                            // Actualizar con todos los datos relevantes
                            window.__globalLeadCache.updateLeadData(normalizedId, {
                                name: name,
                                email: updatedLeadData.email || updatedLeadData.metadata?.email,
                                phone: updatedLeadData.phone || updatedLeadData.metadata?.phone,
                                stage: updatedLeadData.stage,
                                metadata: updatedLeadData.metadata
                            });
                            
                            // También actualizar con el ID completo si es diferente
                            if (leadIdForSync !== normalizedId) {
                                window.__globalLeadCache.updateLeadData(leadIdForSync, {
                                    name: name,
                                    email: updatedLeadData.email || updatedLeadData.metadata?.email,
                                    phone: updatedLeadData.phone || updatedLeadData.metadata?.phone,
                                    stage: updatedLeadData.stage,
                                    metadata: updatedLeadData.metadata
                                });
                            }
                            
                            // FORZAR EVENTOS DE ACTUALIZACIÓN DIRECTA
                            console.log('LeadContent: Disparando eventos de actualización instantánea');
                            
                            // Evento de refresh forzado
                            const refreshEvent = new CustomEvent('force-chat-refresh', {
                                detail: { 
                                    leadId: normalizedId,
                                    name: name
                                }
                            });
                            window.dispatchEvent(refreshEvent);
                            
                            // También disparar evento específico de sincronización de nombres
                            const syncEvent = new CustomEvent('lead-name-sync', {
                                detail: {
                                    leadId: normalizedId,
                                    name: name
                                }
                            });
                            window.dispatchEvent(syncEvent);
                            
                            console.log('LeadContent: Nombre actualizado instantáneamente en todos los sistemas');
                        }
                        
                        console.log('LeadContent: Nombre registrado en todos los sistemas de sincronización');
                    } catch (syncError) {
                        console.error('Error registrando nombre para sincronización:', syncError);
                    }
                    
                    // Solo intentar actualizar en el store si sabemos que el lead está ahí
                    // Verificar primero si el lead existe en alguna columna
                    const { columns } = useSalesFunnelStore.getState()
                    let leadExistsInStore = false
                    
                    Object.values(columns).forEach(columnLeads => {
                        if (columnLeads.some(lead => lead.id === leadData.id || lead.id === result.data.id)) {
                            leadExistsInStore = true
                        }
                    })
                    
                    // Actualizar el store con el lead actualizado
                    // Esto ahora manejará correctamente los casos donde el lead no está en el store
                    updateLead(updatedLeadData)
                    
                    // Si el ID cambió, actualizar el selectedLeadId
                    if (result.data.id && result.data.id !== leadData.id) {
                        setSelectedLeadId(result.data.id)
                    }
                    
                    // Emitir evento de actualización para sincronizar con el chat
                    if (typeof window !== 'undefined') {
                        console.log('LeadContent: Emitiendo evento de actualización de lead')
                        
                        // Si es una edición, emitir evento de actualización de datos
                        if (isEditingExistingLead) {
                            broadcastLeadUpdate('update-data', updatedLeadData.id, {
                                newStage: updatedLeadData.stage,
                                rawStage: updatedLeadData.stage,
                                newName: updatedLeadData.name,
                                metadata: updatedLeadData.metadata
                            } as any)
                        } else {
                            // Si es un lead nuevo, emitir evento de creación
                            broadcastLeadUpdate('create', updatedLeadData.id, {
                                newStage: updatedLeadData.stage,
                                rawStage: updatedLeadData.stage
                            } as any)
                        }
                        
                        // Actualizar leadUpdateStore
                        if (leadUpdateStore && typeof (leadUpdateStore as any).addUpdate === 'function') {
                            (leadUpdateStore as any).addUpdate({
                                type: isEditingExistingLead ? 'update-data' : 'create',
                                leadId: updatedLeadData.id,
                                data: {
                                    newName: updatedLeadData.name,
                                    metadata: updatedLeadData.metadata
                                },
                                time: Date.now()
                            })
                        }
                        
                        // Marcar cambio en simpleLeadUpdateStore
                        if (simpleLeadUpdateStore && typeof simpleLeadUpdateStore.getState === 'function') {
                            simpleLeadUpdateStore.getState().setChanged(true)
                        }
                    }
                    
                    // Si es un lead nuevo que no estaba en el store, agregarlo a la columna correcta
                    if (!isEditingExistingLead && updatedLeadData.stage) {
                        const { columns } = useSalesFunnelStore.getState()
                        
                        // Verificar si el lead ya está en alguna columna
                        let leadAlreadyAdded = false
                        Object.values(columns).forEach(columnLeads => {
                            if (columnLeads.some(lead => lead.id === updatedLeadData.id || lead.id === leadData.id)) {
                                leadAlreadyAdded = true
                            }
                        })
                        
                        // Si no existe, agregarlo manualmente a la columna correspondiente
                        if (!leadAlreadyAdded && columns[updatedLeadData.stage]) {
                            console.log(`Agregando nuevo lead a columna ${updatedLeadData.stage}`)
                            const updatedColumns = {
                                ...columns,
                                [updatedLeadData.stage]: [...columns[updatedLeadData.stage], updatedLeadData]
                            }
                            useSalesFunnelStore.setState({ columns: updatedColumns })
                        }
                    }
                }

                showSuccess(
                    `El prospecto ha sido ${
                        isEditingExistingLead ? 'actualizado' : 'guardado'
                    } correctamente.`,
                    'Lead guardado',
                )

                resetFormValues()
                closeDialog()
            } catch (error) {
                console.error('Error al guardar el prospecto:', error)
                showError(
                    `Error al guardar el prospecto: ${
                        error instanceof Error
                            ? error.message
                            : 'Error desconocido'
                    }`,
                    'Error',
                )
            }
        }
    }

    // Registrar las peticiones pendientes para no repetirlas
    const pendingPropertyRequests = useRef<Record<string, Promise<void>>>({});
    
    // Función optimizada para cargar propiedades de un tipo específico usando useCallback
    // para evitar recreaciones innecesarias y funcionar bien con useEffect
    const loadPropertiesByType = useCallback(async (propertyType: string) => {
        if (!leadData?.id) return
        if (!propertyType || propertyType === '') return
        
        // Verificar si ya hay una petición en curso para este tipo
        const cacheKey = `property_type_${propertyType}`;
        if (pendingPropertyRequests.current[cacheKey]) {
            console.log(`Ya existe una petición en curso para tipo: ${propertyType}, esperando...`);
            try {
                await pendingPropertyRequests.current[cacheKey];
                return; // La petición anterior ya actualizó el estado
            } catch (err) {
                // La petición anterior falló, permitir un nuevo intento
                console.warn(`Petición anterior para ${propertyType} falló:`, err);
                delete pendingPropertyRequests.current[cacheKey];
            }
        }
        
        // Indicar carga y crear una promesa para esta petición
        setIsLoadingProperties(true);
        setFilteredProperties([]);
        
        // Crear una promesa para esta petición y almacenarla
        const requestPromise = (async () => {
            try {
                console.log(`Iniciando carga de propiedades tipo: ${propertyType}`);
                
                // URL simple con un solo intento (evitar múltiples mapeos)
                const url = `/api/properties/filter?type=${encodeURIComponent(propertyType)}`;
                
                // Timeout de seguridad aumentado a 30 segundos
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.warn(`Timeout alcanzado para carga de propiedades tipo: ${propertyType}`);
                    controller.abort();
                }, 30000); // 30 segundos en lugar de 5
                
                try {
                    const response = await fetch(url, {
                        signal: controller.signal,
                        headers: {
                            Accept: 'application/json',
                            'Cache-Control': 'no-cache',
                        },
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`Error HTTP: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (!Array.isArray(data)) {
                        setFilteredProperties([]);
                        return;
                    }
                    
                    // Simplificar el procesamiento
                    const processedData = data
                        .filter(property => !!property.id)
                        .map(property => ({
                            id: property.id,
                            name: property.name || property.title || property.code || `Propiedad ${property.id.slice(0, 6)}`,
                            location: property.location || 
                                     (property.colony && property.city ? `${property.colony}, ${property.city}` : 
                                     (property.address || 'Sin ubicación')),
                            price: typeof property.price === 'string' 
                                 ? parseFloat(property.price.replace(/[^\d.-]/g, '')) || 0 
                                 : (property.price || 0),
                            currency: property.currency || 'MXN',
                            propertyType: property.propertyType || property.property_type,
                            bedrooms: property.bedrooms,
                            bathrooms: property.bathrooms,
                            area: property.area,
                            areaUnit: property.areaUnit || property.area_unit || 'm²',
                            description: property.description,
                            status: property.status || 'available',
                        }));
                    
                    setFilteredProperties(processedData);
                    console.log(`Cargadas ${processedData.length} propiedades de tipo ${propertyType}`);
                    
                } catch (error) {
                    clearTimeout(timeoutId);
                    
                    // Si es un error de abort, manejarlo específicamente
                    if (error instanceof Error && error.name === 'AbortError') {
                        console.warn(`Carga de propiedades cancelada por timeout (30s) para tipo: ${propertyType}`);
                        setFilteredProperties([]);
                        // No re-lanzar el error de abort para evitar mensajes alarmantes
                        return;
                    }
                    
                    console.warn(`Error cargando propiedades tipo ${propertyType}:`, error);
                    // En caso de error, simplemente dejar la lista vacía
                    setFilteredProperties([]);
                    throw error; // Re-lanzar para que la promesa se rechace
                }
                
            } finally {
                setIsLoadingProperties(false);
                // Eliminar esta petición de las pendientes una vez finalizada (éxito o error)
                delete pendingPropertyRequests.current[cacheKey];
            }
        })();
        
        // Almacenar la promesa y retornarla
        pendingPropertyRequests.current[cacheKey] = requestPromise;
        return requestPromise;
    }, [leadData?.id, setIsLoadingProperties, setFilteredProperties]);

    // Usamos una ref para evitar múltiples cargas del mismo tipo de propiedad
    const loadedPropertyTypes = useRef<Set<string>>(new Set());
    
    useEffect(() => {
        if (mode === 'edit' && leadData?.metadata?.propertyType) {
            const propertyType =
                typeof leadData.metadata.propertyType === 'object'
                    ? (leadData.metadata.propertyType as any)?.value || ''
                    : leadData.metadata.propertyType

            // Verificar que el tipo de propiedad no se haya cargado ya
            if (propertyType && 
                typeof propertyType === 'string' && 
                !isLoadingProperties && 
                !loadedPropertyTypes.current.has(propertyType)) {
                
                console.log(
                    'Cargando propiedades iniciales para tipo (primera vez):',
                    propertyType,
                )
                
                // Marcar este tipo como ya cargado para evitar bucles
                loadedPropertyTypes.current.add(propertyType);
                
                // Ejecutar la carga real
                loadPropertiesByType(propertyType);
            }
        }
    }, [mode, leadData?.metadata?.propertyType, isLoadingProperties, loadPropertiesByType])

    useEffect(() => {
        console.log('LeadContent Dialog - dialogOpen:', dialogOpen)
        console.log('LeadContent Dialog - dialogView:', dialogView)
        console.log('LeadContent Dialog - selectedLeadId:', selectedLeadId)
        console.log('LeadContent Dialog - leadData:', leadData)
    }, [dialogOpen, dialogView, selectedLeadId, leadData])

    if (!leadData) {
        console.log('LeadContent - No lead data, returning null')
        return null
    }

    const isDialogOpen = dialogOpen && dialogView === 'LEAD'
    console.log('LeadContent - isDialogOpen:', isDialogOpen)

    return (
        <>
            {mode === 'view' ? (
                <LeadView
                    leadData={leadData}
                    onEdit={() => {
                        setMode('edit')
                        // Guardar el modo actual en el estado del formulario
                        if (leadData?.id) {
                            storeLeadFormState(leadData.id, { lastEditMode: 'edit' })
                        }
                    }}
                    updateLead={updateLead as any}
                />
            ) : (
                <LeadEditFormPersistent
                    leadData={leadData}
                    setLeadData={setLeadData}
                    filteredProperties={filteredProperties}
                    isLoadingProperties={isLoadingProperties}
                    onSave={handleSave}
                    loadPropertiesByType={loadPropertiesByType}
                />
            )}
        </>
    )
}

export default LeadContent
