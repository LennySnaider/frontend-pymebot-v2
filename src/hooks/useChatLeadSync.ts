/**
 * useChatLeadSync.ts
 * Hook personalizado para sincronizar cambios de leads entre Sales Funnel y Chat
 * Escucha cambios en tiempo real y actualiza el chat automáticamente
 */

import { useEffect, useRef } from 'react'
import { useChatStore } from '@/app/(protected-pages)/modules/marketing/chat/_store/chatStore'
import { subscribeToLeadUpdates } from '@/utils/broadcastLeadUpdate'
import { leadUpdateStore } from '@/stores/leadUpdateStore'
import { simpleLeadUpdateStore } from '@/stores/simpleLeadUpdateStore'
import type { LeadUpdateMessage } from '@/utils/broadcastLeadUpdate'

export interface LeadUpdateData {
    leadId: string
    type: 'update-stage' | 'update-data' | 'delete' | 'create'
    data?: {
        newStage?: string
        newName?: string
        metadata?: Record<string, any>
    }
}

/**
 * Hook para sincronizar actualizaciones de leads del Sales Funnel al Chat
 * @param autoRefresh Si debe actualizar automáticamente la lista de chats
 * @param refreshInterval Intervalo en ms para actualizar la lista (0 = deshabilitado)
 */
export function useChatLeadSync(autoRefresh = true, refreshInterval = 0) {
    const refreshChatList = useChatStore((state) => state.refreshChatList)
    const updateChatMetadata = useChatStore((state) => state.updateChatMetadata)
    const updateChatName = useChatStore((state) => state.updateChatName)
    const selectedChatType = useChatStore((state) => state.selectedChatType)
    
    // Referencias para evitar re-renderizados innecesarios
    const lastUpdateRef = useRef<number>(0)
    const pendingUpdatesRef = useRef<Set<string>>(new Set())
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
    
    useEffect(() => {
        // Solo activar si estamos viendo leads/prospects
        const isViewingLeads = selectedChatType === 'leads' || selectedChatType === 'prospects' || selectedChatType === 'personal'
        
        if (!isViewingLeads || !autoRefresh) {
            console.log('ChatLeadSync: No está viendo leads o autoRefresh deshabilitado')
            return
        }
        
        console.log('ChatLeadSync: Iniciando sincronización de leads')
        
        // Función para procesar actualizaciones acumuladas
        const processPendingUpdates = () => {
            if (pendingUpdatesRef.current.size === 0) return
            
            console.log(`ChatLeadSync: Procesando ${pendingUpdatesRef.current.size} actualizaciones pendientes`)
            
            // Limpiar las actualizaciones pendientes
            pendingUpdatesRef.current.clear()
            
            // Actualizar la lista completa
            refreshChatList().catch(error => {
                console.error('ChatLeadSync: Error al actualizar lista:', error)
            })
            
            lastUpdateRef.current = Date.now()
        }
        
        // Función para manejar actualizaciones individuales
        const handleLeadUpdate = (update: LeadUpdateMessage | LeadUpdateData) => {
            console.log('ChatLeadSync: Recibida actualización de lead:', update)
            
            const leadId = 'leadId' in update ? update.leadId : (update as any).id
            if (!leadId) return
            
            // Agregar a las actualizaciones pendientes
            pendingUpdatesRef.current.add(leadId)
            
            // Actualizar metadata inmediatamente si es un cambio de stage
            if ('newStage' in update || (update.type === 'update-stage' && update.data?.newStage)) {
                const newStage = 'newStage' in update ? update.newStage : update.data?.newStage
                const leadChatId = `lead_${leadId}`
                
                console.log(`ChatLeadSync: Actualizando stage de ${leadChatId} a ${newStage}`)
                updateChatMetadata(leadChatId, { stage: newStage })
            }
            
            // Si es una actualización de datos, actualizar metadata y nombre si corresponde
            if (update.type === 'update-data' && update.data) {
                const leadChatId = `lead_${leadId}`
                
                if (update.data.newName) {
                    console.log(`ChatLeadSync: Actualizando nombre de ${leadChatId} a ${update.data.newName}`)
                    updateChatName(leadChatId, update.data.newName)
                }
                
                if (update.data.metadata) {
                    console.log(`ChatLeadSync: Actualizando metadata de ${leadChatId}:`, update.data.metadata)
                    updateChatMetadata(leadChatId, update.data.metadata)
                }
            }
            
            // Cancelar timer anterior si existe
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current)
            }
            
            // Programar actualización batch después de 500ms de inactividad
            updateTimerRef.current = setTimeout(() => {
                processPendingUpdates()
            }, 500)
        }
        
        // Suscribirse a actualizaciones vía broadcast
        const unsubscribeBroadcast = subscribeToLeadUpdates((message) => {
            handleLeadUpdate(message)
        })
        
        // Suscribirse a leadUpdateStore si está disponible
        let unsubscribeLeadStore: (() => void) | null = null
        
        if (leadUpdateStore && typeof leadUpdateStore.subscribe === 'function') {
            console.log('ChatLeadSync: Suscribiéndose a leadUpdateStore')
            
            unsubscribeLeadStore = leadUpdateStore.subscribe(
                (state) => state.updates,
                (updates) => {
                    // Procesar solo actualizaciones nuevas
                    const newUpdates = updates.filter(u => u.time > lastUpdateRef.current)
                    
                    newUpdates.forEach(update => {
                        handleLeadUpdate({
                            leadId: update.leadId,
                            type: update.type as any,
                            data: update.data
                        })
                    })
                }
            )
        }
        
        // Suscribirse a simpleLeadUpdateStore para cambios generales
        let unsubscribeSimpleStore: (() => void) | null = null
        
        if (simpleLeadUpdateStore && typeof simpleLeadUpdateStore.subscribe === 'function') {
            console.log('ChatLeadSync: Suscribiéndose a simpleLeadUpdateStore')
            
            unsubscribeSimpleStore = simpleLeadUpdateStore.subscribe(
                (state) => state.hasChanged,
                (hasChanged) => {
                    if (hasChanged) {
                        console.log('ChatLeadSync: Detectado cambio en simpleLeadUpdateStore')
                        
                        // Agregar una actualización genérica
                        pendingUpdatesRef.current.add('_refresh_all_')
                        
                        // Cancelar timer anterior si existe
                        if (updateTimerRef.current) {
                            clearTimeout(updateTimerRef.current)
                        }
                        
                        // Programar actualización
                        updateTimerRef.current = setTimeout(() => {
                            processPendingUpdates()
                            // Resetear el flag después de procesar
                            simpleLeadUpdateStore.setState({ hasChanged: false })
                        }, 1000) // Esperar un poco más para cambios generales
                    }
                }
            )
        }
        
        // Configurar actualización periódica si está habilitada
        let intervalId: NodeJS.Timeout | null = null
        
        if (refreshInterval > 0) {
            console.log(`ChatLeadSync: Configurando actualización periódica cada ${refreshInterval}ms`)
            
            intervalId = setInterval(() => {
                console.log('ChatLeadSync: Actualización periódica')
                refreshChatList().catch(error => {
                    console.error('ChatLeadSync: Error en actualización periódica:', error)
                })
            }, refreshInterval)
        }
        
        // Limpieza al desmontar
        return () => {
            console.log('ChatLeadSync: Limpiando suscripciones')
            
            // Cancelar timer pendiente
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current)
            }
            
            // Cancelar intervalo
            if (intervalId) {
                clearInterval(intervalId)
            }
            
            // Desuscribirse de todo
            unsubscribeBroadcast()
            
            if (unsubscribeLeadStore) {
                unsubscribeLeadStore()
            }
            
            if (unsubscribeSimpleStore) {
                unsubscribeSimpleStore()
            }
        }
    }, [selectedChatType, autoRefresh, refreshInterval, refreshChatList, updateChatMetadata, updateChatName])
    
    // Función manual para forzar actualización
    const forceRefresh = () => {
        console.log('ChatLeadSync: Forzando actualización manual')
        refreshChatList().catch(error => {
            console.error('ChatLeadSync: Error en actualización manual:', error)
        })
    }
    
    return {
        forceRefresh,
        pendingUpdates: pendingUpdatesRef.current.size
    }
}