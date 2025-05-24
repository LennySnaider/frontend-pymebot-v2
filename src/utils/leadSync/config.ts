/**
 * Configuración del sistema de sincronización de leads
 * Permite ajustar comportamientos y deshabilitar funciones problemáticas
 */

export const leadSyncConfig = {
    // Habilitar/deshabilitar funciones de debug globales
    enableGlobalDebugFunctions: true,
    
    // Habilitar/deshabilitar diagnósticos automáticos
    enableAutoDiagnostics: false, // Deshabilitado por defecto para evitar errores
    
    // Habilitar/deshabilitar logs detallados
    enableVerboseLogging: false, // Reducir ruido en los logs
    
    // Tiempo de espera antes de inicializar (ms)
    initializationDelay: 100,
    
    // Tiempo de espera para diagnósticos (ms)
    diagnosticsDelay: 5000, // Aumentado para dar más tiempo a la inicialización
    
    // Número máximo de reintentos para operaciones fallidas
    maxRetries: 3,
    
    // Tiempo entre reintentos (ms)
    retryDelay: 500
}

// Función para actualizar la configuración en runtime
export function updateLeadSyncConfig(updates: Partial<typeof leadSyncConfig>) {
    Object.assign(leadSyncConfig, updates)
    
    if (leadSyncConfig.enableVerboseLogging) {
        console.log('[LeadSyncConfig] Configuración actualizada:', leadSyncConfig)
    }
}

// Exponer en window para debugging en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).__leadSyncConfig = {
        get: () => leadSyncConfig,
        update: updateLeadSyncConfig
    }
}
