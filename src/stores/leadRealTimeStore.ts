/**
 * Store para monitoreo de cambios en leads en tiempo real
 * Detecta creación, actualización y eliminación de leads
 */

import { create } from 'zustand'

export type LeadEvent = {
    type: 'create' | 'update' | 'delete'
    leadId: string
    data?: any // Datos adicionales dependiendo del tipo de evento
    timestamp: number
}

type LeadRealTimeState = {
    events: LeadEvent[]
    lastEvent: LeadEvent | null
    isListening: boolean
    channelName: string
    channel: BroadcastChannel | null
}

type LeadRealTimeActions = {
    startListening: () => void
    stopListening: () => void
    broadcastEvent: (event: Omit<LeadEvent, 'timestamp'>) => void
    clearEvents: () => void
    processEvent: (event: LeadEvent) => void
}

// Crear una función auxiliar para crear eventos de lead
export const createLeadEvent = (
    type: 'create' | 'update' | 'delete',
    leadId: string,
    data?: any
): LeadEvent => ({
    type,
    leadId,
    data,
    timestamp: Date.now()
})

export const useLeadRealTimeStore = create<LeadRealTimeState & LeadRealTimeActions>((set, get) => ({
    events: [],
    lastEvent: null,
    isListening: false,
    channelName: 'lead-realtime-events',
    channel: null,

    startListening: () => {
        if (typeof window === 'undefined' || get().isListening) {
            return
        }

        try {
            let channel = null;
            
            // Solo intentar usar BroadcastChannel en el cliente con un try-catch 
            // para proteger contra entornos que no lo soporten
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                try {
                    // Usar dynamic import o runtime check para evitar error en compilación
                    channel = new window.BroadcastChannel(get().channelName);
                    
                    // Configurar evento para recibir mensajes
                    channel.onmessage = (event) => {
                        if (event.data && (
                            event.data.type === 'create' ||
                            event.data.type === 'update' ||
                            event.data.type === 'delete'
                        )) {
                            get().processEvent(event.data)
                        }
                    };
                } catch (broadcastError) {
                    console.warn('Error usando BroadcastChannel, usando fallback:', broadcastError);
                    channel = null;
                }
            }

            // Escuchar evento storage como fallback o principal si BroadcastChannel no está disponible
            const storageHandler = (e: StorageEvent) => {
                if (e.key && e.key.startsWith('lead-event-') && e.newValue) {
                    try {
                        const event = JSON.parse(e.newValue)
                        get().processEvent(event)
                    } catch (error) {
                        console.error('Error procesando evento storage lead:', error)
                    }
                }
            }

            window.addEventListener('storage', storageHandler)

            // También escuchar eventos personalizados del DOM para comunicación intra-página
            const customEventHandler = (e: CustomEvent) => {
                if (e.detail) {
                    get().processEvent(e.detail)
                }
            }

            window.addEventListener('lead-realtime-event' as any, customEventHandler)
            
            // Escuchar eventos del SalesFunnel
            const salesFunnelHandler = (e: CustomEvent) => {
                if (e.detail && e.detail.leadId) {
                    console.log('leadRealTimeStore: Interceptando evento de SalesFunnel:', e.detail);
                    
                    // Convertir el evento de SalesFunnel a formato de evento de lead
                    const leadEvent: LeadEvent = {
                        type: 'update',
                        leadId: e.detail.leadId, // Mantener el ID tal como viene del evento
                        data: {
                            ...e.detail.data,
                            source: 'salesfunnel',
                            // Si hay una nueva etapa, incluirla en los datos
                            ...(e.detail.data?.newStage ? { stage: e.detail.data.newStage } : {})
                        },
                        timestamp: Date.now()
                    };
                    
                    // Imprimir información de depuración ampliada
                    console.log('leadRealTimeStore: Generando evento de lead desde SalesFunnel:', {
                        originalEvent: e.detail,
                        transformedEvent: leadEvent
                    });
                    
                    get().processEvent(leadEvent);
                }
            }
            
            window.addEventListener('salesfunnel-lead-updated' as any, salesFunnelHandler);

            // Guardar handlers para limpieza y marcar como escuchando
            set({
                channel,
                isListening: true,
                // Guardar referencias para limpieza posteriormente
                // @ts-ignore - Agregamos propiedades temporales
                storageHandler,
                // @ts-ignore
                customEventHandler,
                // @ts-ignore
                salesFunnelHandler
            })

            console.log('LeadRealTimeStore: Escucha de eventos iniciada')
        } catch (error) {
            console.error('Error iniciando escucha de eventos lead:', error)
        }
    },

    stopListening: () => {
        const state = get()
        if (!state.isListening) {
            return
        }

        // Cerrar el canal de broadcast
        if (state.channel) {
            state.channel.close()
        }

        // Eliminar event listeners
        if (typeof window !== 'undefined') {
            // @ts-ignore - Accedemos a propiedades temporales
            if (state.storageHandler) {
                // @ts-ignore
                window.removeEventListener('storage', state.storageHandler)
            }
            
            // @ts-ignore
            if (state.customEventHandler) {
                window.removeEventListener(
                    'lead-realtime-event' as any, 
                    // @ts-ignore
                    state.customEventHandler
                )
            }
            
            // @ts-ignore
            if (state.salesFunnelHandler) {
                window.removeEventListener(
                    'salesfunnel-lead-updated' as any,
                    // @ts-ignore
                    state.salesFunnelHandler
                )
            }
        }

        set({
            channel: null,
            isListening: false,
            // @ts-ignore
            storageHandler: undefined,
            // @ts-ignore
            customEventHandler: undefined,
            // @ts-ignore
            salesFunnelHandler: undefined
        })

        console.log('LeadRealTimeStore: Escucha de eventos detenida')
    },

    broadcastEvent: (eventData) => {
        // Solo ejecutar en el cliente
        if (typeof window === 'undefined') {
            return;
        }
        
        const event: LeadEvent = {
            ...eventData,
            timestamp: Date.now()
        }

        // Usar BroadcastChannel si está disponible y funcional
        const { channel } = get()
        if (channel) {
            try {
                channel.postMessage(event)
            } catch (error) {
                console.warn('Error enviando mensaje a través de BroadcastChannel:', error)
            }
        }

        // Usar localStorage como mecanismo primario o de fallback
        try {
            // Usar un ID único basado en timestamp para evitar colisiones
            const key = `lead-event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            localStorage.setItem(key, JSON.stringify(event))
            
            // Limpiar después de un tiempo para no llenar el localStorage
            setTimeout(() => {
                localStorage.removeItem(key)
            }, 5000)

            // Disparar evento DOM para comunicación intra-página
            window.dispatchEvent(new CustomEvent('lead-realtime-event', {
                detail: event,
                bubbles: true
            }))
        } catch (error) {
            console.error('Error guardando evento lead en localStorage:', error)
        }

        // Procesar el evento localmente también
        get().processEvent(event)
    },

    processEvent: (event) => {
        console.log(`LeadRealTimeStore: Procesando evento ${event.type} para lead ${event.leadId}`);
        
        // Verificar que el evento no sea repetido (por timestamp) - SOLO PARA EVENTOS QUE NO SON DE SALESFUNNEL
        // Para los eventos de salesfunnel siempre los procesamos por si acaso
        const events = get().events
        if (!event.data?.source?.includes('salesfunnel') && 
            events.some(e => 
                e.leadId === event.leadId && 
                e.type === event.type && 
                Math.abs(e.timestamp - event.timestamp) < 500
            )
        ) {
            console.log(`LeadRealTimeStore: Ignorando evento duplicado ${event.type} para lead ${event.leadId}`);
            return // Evento duplicado, ignorar
        }

        // Añadir evento a la lista y actualizar lastEvent
        set((state) => ({
            events: [...state.events.slice(-99), event], // Mantener solo los últimos 100 eventos
            lastEvent: event
        }))

        console.log(`LeadRealTimeStore: Procesado evento ${event.type} para lead ${event.leadId}`, event.data)
        
        // Si es un evento de SalesFunnel, también disparar el evento específico de sincronización
        if (event.data?.source === 'salesfunnel') {
            console.log('LeadRealTimeStore: Propagando evento de SalesFunnel para sincronización de nombres');
            
            // Disparar un evento específico para que el sistema de chat sepa 
            // que debe sincronizar los nombres de los leads
            if (typeof window !== 'undefined') {
                // Asegurar formato correcto del ID (sin prefijo 'lead_')
                const normalizedLeadId = event.leadId.startsWith('lead_') ? event.leadId.substring(5) : event.leadId;
                window.dispatchEvent(new CustomEvent('syncLeadNames', {
                    detail: {
                        leadId: normalizedLeadId,
                        data: event.data
                    },
                    bubbles: true
                }));
                console.log(`leadRealTimeStore: Emitido evento syncLeadNames con ID normalizado: ${normalizedLeadId}`);
            }
        }
    },

    clearEvents: () => {
        set({ events: [], lastEvent: null })
    }
}))

// Exportar funciones de utilidad para facilitar su uso
export const startLeadRealTimeListener = () => {
    useLeadRealTimeStore.getState().startListening()
}

export const stopLeadRealTimeListener = () => {
    useLeadRealTimeStore.getState().stopListening()
}

export const broadcastLeadCreated = (leadId: string, data?: any) => {
    useLeadRealTimeStore.getState().broadcastEvent({
        type: 'create',
        leadId,
        data
    })
}

export const broadcastLeadUpdated = (leadId: string, data?: any) => {
    useLeadRealTimeStore.getState().broadcastEvent({
        type: 'update',
        leadId,
        data
    })
}

export const broadcastLeadDeleted = (leadId: string, data?: any) => {
    useLeadRealTimeStore.getState().broadcastEvent({
        type: 'delete',
        leadId,
        data
    })
}