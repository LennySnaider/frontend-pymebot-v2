/**
 * Configuración global para el sistema de sincronización del chat
 * Controla el comportamiento para prevenir loops infinitos
 */

export interface ChatSyncConfig {
    // Habilitar/deshabilitar sincronización automática
    enableAutoSync: boolean
    
    // Tiempo mínimo entre actualizaciones del mismo lead (ms)
    minUpdateInterval: number
    
    // Tiempo de debounce para eventos (ms)
    eventDebounceTime: number
    
    // Habilitar refresh automático de la lista
    enableAutoRefresh: boolean
    
    // Intervalo de refresh automático (ms)
    autoRefreshInterval: number
    
    // Habilitar logs detallados
    enableVerboseLogging: boolean
    
    // Máximo número de actualizaciones por segundo
    maxUpdatesPerSecond: number
    
    // Habilitar propagación de eventos
    enableEventPropagation: boolean
}

// Configuración por defecto (modo seguro anti-loop)
const defaultConfig: ChatSyncConfig = {
    enableAutoSync: true,
    minUpdateInterval: 1000, // 1 segundo entre actualizaciones del mismo lead
    eventDebounceTime: 300, // 300ms de debounce
    enableAutoRefresh: false, // Deshabilitado por defecto para evitar loops
    autoRefreshInterval: 30000, // 30 segundos
    enableVerboseLogging: process.env.NODE_ENV === 'development',
    maxUpdatesPerSecond: 10,
    enableEventPropagation: false // Deshabilitado por defecto para evitar loops
}

// Singleton de configuración
class ChatSyncConfigManager {
    private config: ChatSyncConfig = { ...defaultConfig }
    private updateCounter = new Map<string, number[]>()
    
    getConfig(): ChatSyncConfig {
        return { ...this.config }
    }
    
    updateConfig(updates: Partial<ChatSyncConfig>): void {
        this.config = { ...this.config, ...updates }
        console.log('[ChatSyncConfig] Configuración actualizada:', this.config)
    }
    
    // Verificar si se puede procesar una actualización
    canProcessUpdate(leadId: string): boolean {
        if (!this.config.enableAutoSync) {
            return false
        }
        
        const now = Date.now()
        const updateTimes = this.updateCounter.get(leadId) || []
        
        // Limpiar timestamps antiguos (más de 1 segundo)
        const recentUpdates = updateTimes.filter(time => now - time < 1000)
        
        // Verificar límite de actualizaciones por segundo
        if (recentUpdates.length >= this.config.maxUpdatesPerSecond) {
            console.warn(`[ChatSyncConfig] Límite de actualizaciones alcanzado para ${leadId}`)
            return false
        }
        
        // Verificar intervalo mínimo
        if (recentUpdates.length > 0) {
            const lastUpdate = recentUpdates[recentUpdates.length - 1]
            if (now - lastUpdate < this.config.minUpdateInterval) {
                if (this.config.enableVerboseLogging) {
                    console.log(`[ChatSyncConfig] Actualización muy reciente para ${leadId}, esperando...`)
                }
                return false
            }
        }
        
        // Registrar esta actualización
        recentUpdates.push(now)
        this.updateCounter.set(leadId, recentUpdates)
        
        return true
    }
    
    // Limpiar contadores antiguos
    cleanup(): void {
        const now = Date.now()
        for (const [leadId, times] of this.updateCounter.entries()) {
            const recentTimes = times.filter(time => now - time < 5000)
            if (recentTimes.length === 0) {
                this.updateCounter.delete(leadId)
            } else {
                this.updateCounter.set(leadId, recentTimes)
            }
        }
    }
    
    // Reset completo
    reset(): void {
        this.updateCounter.clear()
        this.config = { ...defaultConfig }
        console.log('[ChatSyncConfig] Configuración reseteada')
    }
}

// Exportar instancia singleton
export const chatSyncConfig = new ChatSyncConfigManager()

// Exponer en window para depuración
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).__chatSyncConfig = chatSyncConfig
    
    // Limpiar contadores cada 10 segundos
    setInterval(() => {
        chatSyncConfig.cleanup()
    }, 10000)
}

// Función helper para verificar si se debe procesar una actualización
export function shouldProcessUpdate(leadId: string): boolean {
    return chatSyncConfig.canProcessUpdate(leadId)
}

// Función helper para obtener la configuración actual
export function getSyncConfig(): ChatSyncConfig {
    return chatSyncConfig.getConfig()
}

// Función para actualizar la configuración
export function updateSyncConfig(updates: Partial<ChatSyncConfig>): void {
    chatSyncConfig.updateConfig(updates)
}
