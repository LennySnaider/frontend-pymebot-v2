/**
 * Sistema mejorado de broadcast para sincronización de datos de leads
 * Incluye cambios de nombre, etapa y otros datos relevantes
 */

export interface LeadDataUpdateMessage {
    type: 'lead-data-update' | 'lead-name-update' | 'lead-stage-update' | 'lead-full-update'
    leadId: string
    data: {
        name?: string
        full_name?: string
        stage?: string
        email?: string
        phone?: string
        metadata?: Record<string, any>
        timestamp: number
    }
}

/**
 * Enviar actualización de datos de lead a todas las pestañas y componentes
 */
export function broadcastLeadDataUpdate(
    leadId: string,
    data: Partial<LeadDataUpdateMessage['data']>,
    type: LeadDataUpdateMessage['type'] = 'lead-data-update'
): void {
    // Asegurarse de que leadId sea string
    const normalizedLeadId = String(leadId).replace(/^lead_/, '')
    
    const message: LeadDataUpdateMessage = {
        type,
        leadId: normalizedLeadId,
        data: {
            ...data,
            timestamp: Date.now()
        }
    }

    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return

    try {
        // 1. Emitir evento personalizado para comunicación inmediata dentro de la misma pestaña
        const customEvent = new CustomEvent('lead-data-updated', {
            detail: message,
            bubbles: true,
            cancelable: false
        })
        window.dispatchEvent(customEvent)
        console.log('[LeadDataBroadcast] Evento emitido:', customEvent.type, message)

        // 2. Emitir evento específico de nombre si aplica
        if (data.name || data.full_name) {
            const nameEvent = new CustomEvent('lead-name-updated', {
                detail: {
                    ...message,
                    type: 'lead-name-update'
                },
                bubbles: true,
                cancelable: false
            })
            window.dispatchEvent(nameEvent)
            console.log('[LeadDataBroadcast] Evento de nombre emitido:', nameEvent.type)
        }

        // 3. Emitir evento del sales funnel para compatibilidad
        if (data.stage || data.name || data.full_name) {
            const salesFunnelEvent = new CustomEvent('salesfunnel-lead-updated', {
                detail: {
                    ...message,
                    leadId: normalizedLeadId,
                    data: {
                        ...data,
                        full_name: data.full_name || data.name
                    }
                },
                bubbles: true,
                cancelable: false
            })
            window.dispatchEvent(salesFunnelEvent)
            console.log('[LeadDataBroadcast] Evento salesfunnel emitido:', salesFunnelEvent.type)
        }

        // 4. Usar localStorage para comunicación entre pestañas
        const storageKey = 'lead-data-updates-v3'
        const updates = getStoredUpdates(storageKey)
        updates.push(message)

        // Mantener solo las últimas 100 actualizaciones
        if (updates.length > 100) {
            updates.splice(0, updates.length - 100)
        }

        localStorage.setItem(storageKey, JSON.stringify(updates))

        // 5. Disparar evento storage para notificar a otras pestañas
        window.dispatchEvent(
            new StorageEvent('storage', {
                key: storageKey,
                newValue: JSON.stringify(updates),
                url: window.location.href
            })
        )

        // 6. También emitir evento syncLeadNames para máxima compatibilidad
        const syncEvent = new CustomEvent('syncLeadNames', {
            detail: {
                leadId: normalizedLeadId,
                data: {
                    full_name: data.full_name || data.name,
                    ...data
                }
            },
            bubbles: true,
            cancelable: false
        })
        window.dispatchEvent(syncEvent)

        console.log('[LeadDataBroadcast] Actualización completa enviada para lead:', normalizedLeadId, data)

    } catch (error) {
        console.error('[LeadDataBroadcast] Error al enviar actualización:', error)
    }
}

/**
 * Suscribirse a actualizaciones de datos de leads
 */
export function subscribeToLeadDataUpdates(
    callback: (message: LeadDataUpdateMessage) => void,
    filter?: { types?: LeadDataUpdateMessage['type'][] }
): () => void {
    if (typeof window === 'undefined') {
        return () => {}
    }

    const handlers: Array<{ event: string; handler: EventListener }> = []

    // 1. Suscribirse a eventos personalizados
    const customEventHandler = (event: Event) => {
        const customEvent = event as CustomEvent<LeadDataUpdateMessage>
        if (!filter?.types || filter.types.includes(customEvent.detail.type)) {
            callback(customEvent.detail)
        }
    }

    // Registrar múltiples eventos
    const eventNames = [
        'lead-data-updated',
        'lead-name-updated',
        'salesfunnel-lead-updated',
        'syncLeadNames'
    ]

    eventNames.forEach(eventName => {
        window.addEventListener(eventName, customEventHandler)
        handlers.push({ event: eventName, handler: customEventHandler })
    })

    // 2. Suscribirse a eventos de storage para comunicación entre pestañas
    const storageHandler = (event: StorageEvent) => {
        if (event.key === 'lead-data-updates-v3' && event.newValue) {
            try {
                const updates = JSON.parse(event.newValue)
                const recentUpdates = updates.filter((update: LeadDataUpdateMessage) => 
                    Date.now() - update.data.timestamp < 10000 // Últimos 10 segundos
                )

                recentUpdates.forEach((update: LeadDataUpdateMessage) => {
                    if (!filter?.types || filter.types.includes(update.type)) {
                        callback(update)
                    }
                })
            } catch (error) {
                console.error('[LeadDataBroadcast] Error parsing storage update:', error)
            }
        }
    }

    window.addEventListener('storage', storageHandler)
    handlers.push({ event: 'storage', handler: storageHandler })

    // Retornar función de limpieza
    return () => {
        handlers.forEach(({ event, handler }) => {
            window.removeEventListener(event, handler)
        })
    }
}

/**
 * Obtener actualizaciones almacenadas
 */
function getStoredUpdates(key: string): LeadDataUpdateMessage[] {
    if (typeof window === 'undefined') return []

    try {
        const data = localStorage.getItem(key)
        if (!data) return []

        const updates = JSON.parse(data)
        const now = Date.now()

        // Filtrar actualizaciones muy antiguas (más de 10 minutos)
        return updates.filter(
            (update: LeadDataUpdateMessage) => now - update.data.timestamp < 600000
        )
    } catch (error) {
        console.error('[LeadDataBroadcast] Error reading stored updates:', error)
        return []
    }
}

/**
 * Obtener actualizaciones recientes de un lead específico
 */
export function getRecentLeadUpdates(
    leadId: string,
    maxAgeMs: number = 5000
): LeadDataUpdateMessage[] {
    if (typeof window === 'undefined') return []

    const normalizedLeadId = String(leadId).replace(/^lead_/, '')
    const updates = getStoredUpdates('lead-data-updates-v3')
    const now = Date.now()

    return updates.filter(update => 
        update.leadId === normalizedLeadId && 
        now - update.data.timestamp < maxAgeMs
    )
}

/**
 * Limpiar actualizaciones antiguas del storage
 */
export function cleanupOldUpdates(): void {
    if (typeof window === 'undefined') return

    try {
        const key = 'lead-data-updates-v3'
        const updates = getStoredUpdates(key)
        
        if (updates.length > 0) {
            localStorage.setItem(key, JSON.stringify(updates))
            console.log('[LeadDataBroadcast] Limpieza completada, actualizaciones válidas:', updates.length)
        }
    } catch (error) {
        console.error('[LeadDataBroadcast] Error en limpieza:', error)
    }
}

// Ejecutar limpieza periódica si estamos en el navegador
if (typeof window !== 'undefined') {
    // Limpiar cada 5 minutos
    setInterval(cleanupOldUpdates, 5 * 60 * 1000)
    
    // Limpiar al cargar la página
    cleanupOldUpdates()
}
