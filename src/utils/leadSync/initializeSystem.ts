/**
 * Configuración e inicialización del sistema de sincronización de leads
 * Se ejecuta al inicio de la aplicación para configurar listeners globales
 */

import { subscribeToLeadDataUpdates } from '@/utils/leadSync'
import { broadcastLeadDataUpdate } from '@/utils/leadSync'
import globalLeadCache from '@/stores/globalLeadCache'

let initialized = false

/**
 * Inicializar el sistema de sincronización global de leads
 */
export function initializeLeadSyncSystem() {
    // Evitar inicialización múltiple
    if (initialized || typeof window === 'undefined') {
        return
    }

    initialized = true
    console.log('[LeadSyncSystem] Inicializando sistema de sincronización global')

    // Suscribirse a todas las actualizaciones de datos de leads
    subscribeToLeadDataUpdates((message) => {
        console.log('[LeadSyncSystem] Actualización global recibida:', message)

        // Actualizar el caché global
        if (message.data.name || message.data.full_name) {
            const name = message.data.full_name || message.data.name || ''
            globalLeadCache.updateLeadData(message.leadId, {
                name,
                stage: message.data.stage
            })
        }

        // Emitir evento especial para forzar actualización de la UI del chat
        window.dispatchEvent(new CustomEvent('force-chat-refresh', {
            detail: {
                leadId: message.leadId,
                reason: 'lead-data-update'
            },
            bubbles: true
        }))
    })

    // Configurar listener para limpiar caché cuando sea necesario
    window.addEventListener('beforeunload', () => {
        console.log('[LeadSyncSystem] Limpiando sistema antes de cerrar')
        // Limpiar cualquier recurso si es necesario
    })

    // Exponer funciones útiles en desarrollo
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window) {
        try {
            (window as any).__leadSyncSystem = {
                getCache: () => {
                    try {
                        // Intentar usar el caché si está disponible globalmente
                        if (typeof globalLeadCache !== 'undefined' && globalLeadCache.getAllLeads) {
                            return globalLeadCache.getAllLeads()
                        }
                        console.warn('GlobalLeadCache no disponible')
                        return {}
                    } catch (error) {
                        console.error('Error al obtener cache:', error)
                        return {}
                    }
                },
                clearCache: () => {
                    try {
                        if (typeof globalLeadCache !== 'undefined' && globalLeadCache.clearCache) {
                            globalLeadCache.clearCache()
                        } else {
                            console.warn('GlobalLeadCache no disponible para limpiar')
                        }
                    } catch (error) {
                        console.error('Error al limpiar cache:', error)
                    }
                },
                forceSync: (leadId: string, name: string) => {
                    try {
                        // Usar broadcastLeadDataUpdate directamente si está disponible
                        broadcastLeadDataUpdate(leadId, { name, full_name: name }, 'lead-name-update')
                    } catch (error) {
                        console.error('Error al forzar sincronización:', error)
                    }
                },
                isInitialized: () => initialized
            }
        } catch (error) {
            console.warn('No se pudieron establecer herramientas de desarrollo:', error)
        }
    }

    console.log('[LeadSyncSystem] Sistema inicializado correctamente')
}

/**
 * Verificar si el sistema está inicializado
 */
export function isLeadSyncSystemInitialized() {
    return initialized
}
