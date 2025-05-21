/**
 * Utilidad para forzar la sincronización de nombres de leads entre SalesFunnel y Chat
 * 
 * VERSIÓN ULTRA-AGRESIVA con implementación redundante para garantizar sincronización
 */

import { publishLeadNameChange } from './globalSyncEvent';

// Función para forzar sincronización inmediata de un lead
export function forceSyncLeadName(leadId: string, name: string): void {
    if (typeof window === 'undefined') return;
    
    // Normalizar ID: asegurar que no tiene el prefijo lead_
    const normalizedLeadId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
    const chatId = `lead_${normalizedLeadId}`;
    
    console.log(`[SYNC] Forzando sincronización agresiva de nombre para lead: ${normalizedLeadId} -> "${name}"`);
    
    // 0. Usar el nuevo sistema de sincronización global (máxima prioridad y confiabilidad)
    publishLeadNameChange(normalizedLeadId, name);
    
    // 1. Intentar actualizar directamente el chatStore primero (alta prioridad)
    try {
        applyDirectChatStoreUpdate(chatId, name);
    } catch (error) {
        console.error('[SYNC] Error en actualización directa inicial:', error);
    }
    
    // 2. Disparar eventos custom para notificar a otros componentes
    dispatchSyncEvents(normalizedLeadId, name);
    
    // 3. Programar actualizaciones adicionales para asegurar que se aplique
    scheduleFollowUpUpdates(chatId, name);
}

// Función para aplicar actualización directa al chat store
function applyDirectChatStoreUpdate(chatId: string, name: string): void {
    import('@/app/(protected-pages)/modules/marketing/chat/_store/chatStore')
        .then(({ useChatStore }) => {
            if (useChatStore && typeof useChatStore.getState === 'function') {
                const chatStore = useChatStore.getState();
                
                if (chatStore) {
                    // Actualizar nombre directamente
                    if (typeof chatStore.updateChatName === 'function') {
                        console.log(`[SYNC] Actualización directa: ${chatId} -> "${name}"`);
                        chatStore.updateChatName(chatId, name);
                    }
                    
                    // También actualizar metadatos para forzar re-render
                    if (typeof chatStore.updateChatMetadata === 'function') {
                        console.log(`[SYNC] Actualizando metadata con timestamp`);
                        chatStore.updateChatMetadata(chatId, { 
                            _syncTimestamp: Date.now(),
                            forceUpdate: true
                        });
                    }
                    
                    // Después de actualizar localmente, forzar refresh para obtener datos actualizados
                    setTimeout(() => {
                        if (typeof chatStore.refreshChatList === 'function') {
                            console.log(`[SYNC] Refrescando lista después de actualización directa`);
                            chatStore.refreshChatList()
                                .catch(error => console.error('[SYNC] Error en refresh post-actualización:', error));
                        }
                    }, 100);
                }
            }
        })
        .catch(err => console.error('[SYNC] Error accediendo a chatStore:', err));
}

// Función para emitir eventos de sincronización
function dispatchSyncEvents(leadId: string, name: string): void {
    // Crear objeto de datos con timestamp único
    const eventData = {
        leadId,
        data: {
            full_name: name,
            source: 'aggressive_sync',
            timestamp: Date.now(),
            forceUpdate: true
        }
    };
    
    // Crear y disparar evento salesfunnel-lead-updated
    console.log('[SYNC] Disparando evento salesfunnel-lead-updated:', eventData);
    window.dispatchEvent(new CustomEvent('salesfunnel-lead-updated', {
        detail: eventData,
        bubbles: true
    }));
    
    // Crear y disparar evento syncLeadNames 
    // Asegurar formato correcto del ID
    const normalizedLeadId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
    console.log(`[SYNC] Disparando evento syncLeadNames con ID normalizado: ${normalizedLeadId}`);
    window.dispatchEvent(new CustomEvent('syncLeadNames', {
        detail: {
            leadId: normalizedLeadId,
            data: eventData.data
        },
        bubbles: true
    }));
    
    // También emitir como evento DOM más genérico
    console.log('[SYNC] Disparando evento lead-update genérico');
    window.dispatchEvent(new CustomEvent('lead-update', {
        detail: {
            type: 'name-update',
            leadId,
            name,
            timestamp: Date.now()
        },
        bubbles: true
    }));
}

// Función para programar actualizaciones adicionales para mayor fiabilidad
function scheduleFollowUpUpdates(chatId: string, name: string): void {
    // Serie de intentos espaciados para garantizar que los cambios se aplican
    const delays = [500, 1500, 3000]; // 0.5s, 1.5s, 3s
    
    delays.forEach(delay => {
        setTimeout(() => {
            try {
                console.log(`[SYNC] Intento de actualización programado a ${delay}ms para ${chatId}`);
                
                // Actualizar directamente
                applyDirectChatStoreUpdate(chatId, name);
                
                // También forzar un refresco completo
                if (delay === delays[delays.length - 1]) { // Solo en el último intento
                    forceRefreshChatList();
                }
            } catch (error) {
                console.error(`[SYNC] Error en intento programado a ${delay}ms:`, error);
            }
        }, delay);
    });
}

// Función para forzar un refresco completo de la lista
export function forceRefreshChatList(): void {
    if (typeof window === 'undefined') return;
    
    console.log('[SYNC] Forzando refresh completo de lista de chats');
    
    try {
        // Forzar un evento de DOM primero para notificar que debe refrescarse
        window.dispatchEvent(new CustomEvent('force-chat-refresh', {
            detail: { timestamp: Date.now() },
            bubbles: true
        }));
        
        // Luego intentar acceder directamente al store
        import('@/app/(protected-pages)/modules/marketing/chat/_store/chatStore')
            .then(({ useChatStore }) => {
                if (useChatStore && typeof useChatStore.getState === 'function') {
                    const chatStore = useChatStore.getState();
                    
                    if (chatStore && typeof chatStore.refreshChatList === 'function') {
                        // Intentar refrescar directamente
                        chatStore.refreshChatList()
                            .then(() => console.log('[SYNC] Refresh de lista completado exitosamente'))
                            .catch(error => {
                                console.error('[SYNC] Error en refresh principal:', error);
                                
                                // Si falla, intentar un segundo enfoque usando setState
                                setTimeout(() => {
                                    console.log('[SYNC] Intentando refrescar como fallback...');
                                    chatStore.setChatsFetched(false);
                                    setTimeout(() => {
                                        chatStore.refreshChatList()
                                            .catch(err => console.error('[SYNC] Error en refresh fallback:', err));
                                    }, 100);
                                }, 100);
                            });
                    }
                }
            })
            .catch(err => console.error('[SYNC] Error accediendo a chatStore:', err));
    } catch (error) {
        console.error('[SYNC] Error general forzando refresh de chats:', error);
    }
}