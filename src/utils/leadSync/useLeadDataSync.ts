/**
 * Hook mejorado para sincronización de datos de leads en tiempo real
 * Maneja cambios de nombre, etapa y otros datos con mayor robustez
 */

import { useEffect, useCallback, useRef } from 'react'
import { 
    broadcastLeadDataUpdate, 
    subscribeToLeadDataUpdates,
    LeadDataUpdateMessage 
} from './leadDataBroadcast'

interface UseLeadDataSyncOptions {
    onUpdate?: (leadId: string, data: LeadDataUpdateMessage['data']) => void
    onNameUpdate?: (leadId: string, name: string) => void
    onStageUpdate?: (leadId: string, stage: string) => void
    types?: LeadDataUpdateMessage['type'][]
    debug?: boolean
}

export function useLeadDataSync(options: UseLeadDataSyncOptions = {}) {
    const { 
        onUpdate, 
        onNameUpdate, 
        onStageUpdate, 
        types = ['lead-data-update', 'lead-name-update', 'lead-stage-update', 'lead-full-update'],
        debug = false 
    } = options

    // Usar ref para mantener referencias estables
    const updateQueue = useRef<Map<string, LeadDataUpdateMessage>>(new Map())
    const processingRef = useRef(false)

    // Procesar actualizaciones en lote para evitar múltiples renders
    const processUpdateQueue = useCallback(() => {
        if (processingRef.current || updateQueue.current.size === 0) return

        processingRef.current = true

        try {
            updateQueue.current.forEach((update, leadId) => {
                try {
                    if (debug) {
                        console.log('[useLeadDataSync] Procesando actualización:', leadId, update.data)
                    }

                    // Callback general
                    if (onUpdate) {
                        onUpdate(leadId, update.data)
                    }

                    // Callback específico de nombre
                    if (onNameUpdate && (update.data.name || update.data.full_name)) {
                        const name = update.data.full_name || update.data.name || ''
                        onNameUpdate(leadId, name)
                    }

                    // Callback específico de etapa
                    if (onStageUpdate && update.data.stage) {
                        onStageUpdate(leadId, update.data.stage)
                    }
                } catch (callbackError) {
                    console.error('[useLeadDataSync] Error procesando actualización para lead', leadId, ':', callbackError)
                }
            })

            // Limpiar la cola
            updateQueue.current.clear()
        } catch (error) {
            console.error('[useLeadDataSync] Error general procesando cola:', error)
        } finally {
            processingRef.current = false
        }
    }, [onUpdate, onNameUpdate, onStageUpdate, debug])

    // Manejar actualizaciones entrantes
    const handleUpdate = useCallback((message: LeadDataUpdateMessage) => {
        if (debug) {
            console.log('[useLeadDataSync] Actualización recibida:', message)
        }

        // Agregar a la cola (sobrescribe actualizaciones anteriores del mismo lead)
        updateQueue.current.set(message.leadId, message)

        // Procesar la cola en el siguiente ciclo para agrupar actualizaciones
        requestAnimationFrame(processUpdateQueue)
    }, [processUpdateQueue, debug])

    useEffect(() => {
        // Suscribirse a actualizaciones
        const unsubscribe = subscribeToLeadDataUpdates(handleUpdate, { types })

        if (debug) {
            console.log('[useLeadDataSync] Hook inicializado con tipos:', types)
        }

        return () => {
            unsubscribe()
            if (debug) {
                console.log('[useLeadDataSync] Hook desmontado')
            }
        }
    }, [handleUpdate, types, debug])

    // Función para emitir actualizaciones manualmente
    const emitUpdate = useCallback((
        leadId: string,
        data: Partial<LeadDataUpdateMessage['data']>,
        type?: LeadDataUpdateMessage['type']
    ) => {
        broadcastLeadDataUpdate(leadId, data, type)
    }, [])

    return {
        emitUpdate,
        // Exponer la cola actual para debugging
        pendingUpdates: updateQueue.current.size
    }
}

/**
 * Hook específico para sincronización de nombres de leads
 */
export function useLeadNameSync(
    onNameUpdate: (leadId: string, name: string) => void,
    debug = false
) {
    return useLeadDataSync({
        onNameUpdate,
        types: ['lead-name-update', 'lead-data-update', 'lead-full-update'],
        debug
    })
}

/**
 * Hook específico para sincronización de etapas de leads
 */
export function useLeadStageSync(
    onStageUpdate: (leadId: string, stage: string) => void,
    debug = false
) {
    return useLeadDataSync({
        onStageUpdate,
        types: ['lead-stage-update', 'lead-data-update', 'lead-full-update'],
        debug
    })
}
