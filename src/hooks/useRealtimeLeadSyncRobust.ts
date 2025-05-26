/**
 * Hook para sincronización en tiempo real de leads usando Supabase Realtime
 * Versión robusta con fallback a polling si Realtime falla
 */

import { useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/utils/supabaseClient'
import { useChatStore } from '@/app/(protected-pages)/modules/marketing/chat/_store/chatStore'

export function useRealtimeLeadSyncRobust() {
    const channelRef = useRef<RealtimeChannel | null>(null)
    const lastKnownNames = useRef<Map<string, string>>(new Map())
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'fallback'>('connecting')
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const retryCount = useRef(0)
    const maxRetries = 3
    
    // Función para actualizar un lead en el chat
    const updateLeadInChat = (lead: any, oldLead?: any) => {
        try {
            const chatId = `lead_${lead.id}`
            const currentName = lead.full_name || 'Sin nombre'
            const lastKnownName = lastKnownNames.current.get(lead.id)
            
            // Si el nombre cambió
            if (!lastKnownName || lastKnownName !== currentName) {
                console.log(`[RealtimeSync] Actualizando nombre: "${lastKnownName || 'N/A'}" -> "${currentName}"`)
                
                const store = useChatStore.getState()
                
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
                
                // Actualizar el nombre conocido
                lastKnownNames.current.set(lead.id, currentName)
            }
        } catch (error) {
            console.error('[RealtimeSync] Error actualizando lead en chat:', error)
        }
    }
    
    // Función de polling como fallback
    const startPollingFallback = () => {
        console.log('[RealtimeSync] 🔄 Iniciando polling fallback cada 10 segundos')
        setConnectionStatus('fallback')
        
        const poll = async () => {
            try {
                const supabase = getSupabaseClient()
                if (!supabase) return
                
                const tenantId = localStorage.getItem('current_tenant_id') || 'afa60b0a-3046-4607-9c48-266af6e1d322'
                
                const { data: leads, error } = await supabase
                    .from('leads')
                    .select('id, full_name, stage, phone, email')
                    .eq('tenant_id', tenantId)
                    .eq('is_active', true)
                
                if (!error && leads) {
                    leads.forEach(lead => updateLeadInChat(lead))
                }
            } catch (error) {
                console.error('[RealtimeSync] Error en polling fallback:', error)
            }
        }
        
        // Ejecutar inmediatamente y luego cada 10 segundos
        poll()
        pollIntervalRef.current = setInterval(poll, 10000)
    }
    
    // Función para configurar Realtime
    const setupRealtimeConnection = () => {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('[RealtimeSync] No se pudo obtener el cliente de Supabase')
            startPollingFallback()
            return
        }
        
        const tenantId = localStorage.getItem('current_tenant_id') || 'afa60b0a-3046-4607-9c48-266af6e1d322'
        
        console.log('[RealtimeSync] 🔌 Intentando conexión Realtime para tenant:', tenantId)
        
        // Crear canal con nombre único
        const channel = supabase
            .channel(`leads_sync_${tenantId}_${Date.now()}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: `tenant_id=eq.${tenantId}`
                },
                (payload) => {
                    console.log('[RealtimeSync] 📡 Cambio detectado:', payload.eventType, payload.new?.id)
                    if (payload.new) {
                        updateLeadInChat(payload.new, payload.old)
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('[RealtimeSync] Estado de suscripción:', status, err)
                
                if (status === 'SUBSCRIBED') {
                    console.log('[RealtimeSync] ✅ Realtime conectado exitosamente')
                    setConnectionStatus('connected')
                    retryCount.current = 0
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[RealtimeSync] ❌ Error en el canal Realtime:', err)
                    setConnectionStatus('error')
                    
                    // Intentar reconectar o usar fallback
                    if (retryCount.current < maxRetries) {
                        retryCount.current++
                        console.log(`[RealtimeSync] 🔄 Reintentando conexión (${retryCount.current}/${maxRetries})`)
                        
                        retryTimeoutRef.current = setTimeout(() => {
                            setupRealtimeConnection()
                        }, 5000 * retryCount.current) // Delay creciente
                    } else {
                        console.log('[RealtimeSync] 🚨 Máximo de reintentos alcanzado, usando polling fallback')
                        startPollingFallback()
                    }
                } else if (status === 'TIMED_OUT') {
                    console.error('[RealtimeSync] ⏱️ Timeout en la suscripción')
                    setConnectionStatus('error')
                    startPollingFallback()
                } else if (status === 'CLOSED') {
                    console.log('[RealtimeSync] 🔒 Conexión cerrada')
                    setConnectionStatus('error')
                }
            })
        
        channelRef.current = channel
    }
    
    // Cargar nombres iniciales
    const loadInitialNames = async () => {
        try {
            const supabase = getSupabaseClient()
            if (!supabase) return
            
            const tenantId = localStorage.getItem('current_tenant_id') || 'afa60b0a-3046-4607-9c48-266af6e1d322'
            
            const { data: leads, error } = await supabase
                .from('leads')
                .select('id, full_name')
                .eq('tenant_id', tenantId)
                .eq('is_active', true)
            
            if (!error && leads) {
                leads.forEach(lead => {
                    lastKnownNames.current.set(lead.id, lead.full_name || 'Sin nombre')
                })
                console.log('[RealtimeSync] 📚 Nombres iniciales cargados:', leads.length)
            }
        } catch (error) {
            console.error('[RealtimeSync] Error cargando nombres iniciales:', error)
        }
    }
    
    useEffect(() => {
        console.log('[RealtimeSync] 🚀 Inicializando sincronización de leads')
        
        // Cargar nombres iniciales primero
        loadInitialNames().then(() => {
            // Intentar Realtime primero
            setupRealtimeConnection()
        })
        
        // Cleanup al desmontar
        return () => {
            console.log('[RealtimeSync] 🧹 Limpiando recursos')
            
            // Limpiar canal Realtime
            if (channelRef.current) {
                const supabase = getSupabaseClient()
                if (supabase) {
                    supabase.removeChannel(channelRef.current)
                }
                channelRef.current = null
            }
            
            // Limpiar polling
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
            }
            
            // Limpiar retry timeout
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current)
                retryTimeoutRef.current = null
            }
            
            lastKnownNames.current.clear()
        }
    }, [])
    
    return {
        connectionStatus,
        forceSync: async () => {
            console.log('[RealtimeSync] 🔄 Forzando sincronización manual')
            await loadInitialNames()
        },
        isRealtime: connectionStatus === 'connected',
        isFallback: connectionStatus === 'fallback'
    }
}