'use client'

import { useEffect } from 'react'
import { initializeLeadSyncSystem } from '@/utils/leadSync'
import { runDiagnostics } from '@/utils/leadSync/diagnostics'
import { leadSyncConfig } from '@/utils/leadSync/config'

/**
 * Componente cliente para inicializar el sistema de sincronización de leads
 * Se monta una vez al inicio de la aplicación
 */
export default function LeadSyncInitializer() {
    useEffect(() => {
        // Inicializar el sistema solo en el cliente
        if (typeof window !== 'undefined') {
            try {
                console.log('[LeadSyncInitializer] Inicializando sistema de sincronización')
                initializeLeadSyncSystem()
                
                // Ejecutar diagnósticos en desarrollo después de un delay (solo si está habilitado)
                if (process.env.NODE_ENV === 'development' && leadSyncConfig.enableAutoDiagnostics) {
                    setTimeout(() => {
                        try {
                            runDiagnostics()
                        } catch (diagError) {
                            console.error('[LeadSyncInitializer] Error en diagnósticos:', diagError)
                        }
                    }, leadSyncConfig.diagnosticsDelay || 5000)
                }
            } catch (error) {
                console.error('[LeadSyncInitializer] Error al inicializar sistema:', error)
            }
        }
    }, [])

    // Este componente no renderiza nada
    return null
}
