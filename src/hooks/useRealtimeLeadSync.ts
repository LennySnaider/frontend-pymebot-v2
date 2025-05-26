/**
 * Hook para sincronización en tiempo real de leads usando Supabase Realtime
 * Reemplaza el polling agresivo con suscripciones a cambios en la base de datos
 */

import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { useChatStore } from '@/app/(protected-pages)/modules/marketing/chat/_store/chatStore'

export function useRealtimeLeadSync() {
    const channelRef = useRef<RealtimeChannel | null>(null)
    const lastKnownNames = useRef<Map<string, string>>(new Map())
    
    useEffect(() => {
        const supabase = getSupabaseClient()
        
        if (!supabase) {
            console.error('[RealtimeSync] No se pudo obtener el cliente de Supabase')
            return
        }
        
        // Obtener tenant_id
        const tenantId = localStorage.getItem('current_tenant_id') || 'afa60b0a-3046-4607-9c48-266af6e1d322'
        
        // Función para manejar cambios en leads
        const handleLeadChange = (payload: any) => {
            try {
                const { eventType, new: newLead, old: oldLead } = payload
                
                console.log('[RealtimeSync] Cambio detectado:', eventType, {
                    id: newLead?.id,
                    oldName: oldLead?.full_name,
                    newName: newLead?.full_name
                })
                
                if (!newLead) return
                
                const chatId = `lead_${newLead.id}`
                const currentName = newLead.full_name || 'Sin nombre'
                const lastKnownName = lastKnownNames.current.get(newLead.id)
                
                // Si el nombre cambió o es la primera vez que lo vemos
                if (!lastKnownName || lastKnownName !== currentName) {
                    console.log(`[RealtimeSync] Actualizando nombre: "${lastKnownName || 'N/A'}" -> "${currentName}"`)
                    
                    // Obtener el store actual
                    const store = useChatStore.getState()
                    const selectedChat = store.selectedChat
                    
                    // Actualizar instantáneamente en el store
                    store.updateChatName(chatId, currentName)
                    
                    // Si es el chat seleccionado, actualizar también el selectedChat
                    if (selectedChat.id === chatId) {
                        console.log('[RealtimeSync] Actualizando header del chat instantáneamente')
                        store.setSelectedChat({
                            ...selectedChat,
                            name: currentName,
                            user: selectedChat.user ? {
                                ...selectedChat.user,
                                name: currentName
                            } : undefined
                        })
                    }
                    
                    // Actualizar otros campos si cambiaron
                    if (newLead.phone !== oldLead?.phone || newLead.email !== oldLead?.email) {
                        const currentChats = store.chats
                        const chatToUpdate = currentChats.find(chat => chat.id === chatId)
                        
                        if (chatToUpdate) {
                            store.updateChat(chatId, {
                                ...chatToUpdate,
                                user: {
                                    ...chatToUpdate.user,
                                    name: currentName,
                                    phone: newLead.phone,
                                    email: newLead.email
                                }
                            })
                        }
                    }
                    
                    // Forzar trigger de actualización
                    store.setTriggerUpdate(Date.now())
                    
                    // Actualizar el nombre conocido
                    lastKnownNames.current.set(newLead.id, currentName)
                }
                
                // Manejar cambios de stage si es necesario
                if (newLead.stage !== oldLead?.stage) {
                    console.log('[RealtimeSync] Stage cambió:', oldLead?.stage, '->', newLead.stage)
                    // Aquí podrías actualizar el stage en el UI si es necesario
                }
                
            } catch (error) {
                console.error('[RealtimeSync] Error procesando cambio:', error)
            }
        }
        
        // Función para cargar nombres iniciales
        const loadInitialNames = async () => {
            try {
                const { data: leads, error } = await supabase
                    .from('leads')
                    .select('id, full_name')
                    .eq('tenant_id', tenantId)
                    .eq('is_active', true)
                
                if (!error && leads) {
                    leads.forEach(lead => {
                        lastKnownNames.current.set(lead.id, lead.full_name || 'Sin nombre')
                    })
                    console.log('[RealtimeSync] Nombres iniciales cargados:', leads.length)
                }
            } catch (error) {
                console.error('[RealtimeSync] Error cargando nombres iniciales:', error)
            }
        }
        
        // Configurar canal de Realtime
        const setupRealtimeSubscription = () => {
            console.log('[RealtimeSync] Configurando suscripción Realtime para tenant:', tenantId)
            
            // Crear canal con nombre único
            const channel = supabase
                .channel(`leads_sync_${tenantId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Escuchar INSERT, UPDATE y DELETE
                        schema: 'public',
                        table: 'leads',
                        filter: `tenant_id=eq.${tenantId}`
                    },
                    handleLeadChange
                )
                .subscribe((status) => {
                    console.log('[RealtimeSync] Estado de suscripción:', status)
                    
                    if (status === 'SUBSCRIBED') {
                        console.log('[RealtimeSync] ✅ Suscripción activa')
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('[RealtimeSync] ❌ Error en el canal')
                    } else if (status === 'TIMED_OUT') {
                        console.error('[RealtimeSync] ⏱️ Timeout en la suscripción')
                    }
                })
            
            channelRef.current = channel
        }
        
        // Inicializar
        loadInitialNames().then(() => {
            setupRealtimeSubscription()
        })
        
        // Cleanup al desmontar
        return () => {
            if (channelRef.current) {
                console.log('[RealtimeSync] Limpiando suscripción')
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
            lastKnownNames.current.clear()
        }
    }, [])
    
    // Retornar función para forzar sincronización manual si es necesario
    return {
        forceSync: async () => {
            const supabase = getSupabaseClient()
            if (!supabase) {
                console.error('[RealtimeSync] No se pudo obtener el cliente de Supabase para forceSync')
                return
            }
            const tenantId = localStorage.getItem('current_tenant_id') || 'afa60b0a-3046-4607-9c48-266af6e1d322'
            
            try {
                const { data: leads } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .eq('is_active', true)
                
                if (leads) {
                    // Procesar cada lead manualmente aquí ya que handleLeadChange está en otro scope
                    const store = useChatStore.getState()
                    
                    leads.forEach(lead => {
                        const chatId = `lead_${lead.id}`
                        const currentName = lead.full_name || 'Sin nombre'
                        
                        // Actualizar en el store
                        store.updateChatName(chatId, currentName)
                        
                        // Si es el chat seleccionado, actualizar también
                        if (store.selectedChat.id === chatId) {
                            store.setSelectedChat({
                                ...store.selectedChat,
                                name: currentName,
                                user: store.selectedChat.user ? {
                                    ...store.selectedChat.user,
                                    name: currentName
                                } : undefined
                            })
                        }
                        
                        // Forzar actualización
                        store.setTriggerUpdate(Date.now())
                    })
                }
            } catch (error) {
                console.error('[RealtimeSync] Error en sincronización manual:', error)
            }
        }
    }
}