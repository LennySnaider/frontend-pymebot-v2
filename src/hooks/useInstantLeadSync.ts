/**
 * Hook para sincronización instantánea entre SalesFunnel y Chat
 * Usa polling agresivo y actualización directa del store
 */

import { useEffect, useRef } from 'react'
import { useChatStore } from '@/app/(protected-pages)/modules/marketing/chat/_store/chatStore'

export function useInstantLeadSync() {
    const lastKnownNames = useRef<Map<string, string>>(new Map())
    const pollInterval = useRef<NodeJS.Timeout | null>(null)
    
    useEffect(() => {
        // Función para verificar cambios en los leads
        const checkForUpdates = async () => {
            try {
                // Obtener tenant_id
                const tenantId = localStorage.getItem('current_tenant_id') || 'afa60b0a-3046-4607-9c48-266af6e1d322'
                
                // Usar endpoint optimizado para instant sync
                const response = await fetch(`/api/leads/instant-sync?tenant_id=${tenantId}`, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                })
                
                if (!response.ok) return
                
                const data = await response.json()
                const leads = data.leads || []
                
                // Obtener el store actual
                const store = useChatStore.getState()
                const currentChats = store.chats
                const selectedChat = store.selectedChat
                
                // Verificar cada lead
                leads.forEach((lead: any) => {
                    const chatId = `lead_${lead.id}`
                    const currentName = lead.full_name || 'Sin nombre'
                    const lastKnownName = lastKnownNames.current.get(lead.id)
                    
                    // Si el nombre cambió
                    if (lastKnownName && lastKnownName !== currentName) {
                        console.log(`[InstantSync] Detectado cambio de nombre: "${lastKnownName}" -> "${currentName}"`)
                        
                        // Actualizar instantáneamente en el store
                        store.updateChatName(chatId, currentName)
                        
                        // Si es el chat seleccionado, actualizar también el selectedChat
                        if (selectedChat.id === chatId) {
                            console.log('[InstantSync] Actualizando header del chat instantáneamente')
                            store.setSelectedChat({
                                ...selectedChat,
                                name: currentName,
                                user: selectedChat.user ? {
                                    ...selectedChat.user,
                                    name: currentName
                                } : undefined
                            })
                        }
                        
                        // Forzar trigger de actualización múltiples veces
                        store.setTriggerUpdate(Date.now())
                        setTimeout(() => store.setTriggerUpdate(Date.now()), 100)
                        setTimeout(() => store.setTriggerUpdate(Date.now()), 300)
                    }
                    
                    // Actualizar el nombre conocido
                    lastKnownNames.current.set(lead.id, currentName)
                })
                
            } catch (error) {
                console.error('[InstantSync] Error verificando actualizaciones:', error)
            }
        }
        
        // Ejecutar inmediatamente
        checkForUpdates()
        
        // Configurar polling cada 1 segundo (muy agresivo)
        pollInterval.current = setInterval(checkForUpdates, 1000)
        
        // Limpiar al desmontar
        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current)
            }
        }
    }, [])
}
