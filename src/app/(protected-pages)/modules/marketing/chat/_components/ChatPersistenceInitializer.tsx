'use client'

import { useEffect, useRef } from 'react'
import { initializeChatSyncPersistence, forceChatSync } from '@/utils/chatSyncPersistence'

/**
 * Componente que inicializa y mantiene el sistema de persistencia del chat
 * Debe montarse junto con el ChatProvider para asegurar sincronización constante
 */
export default function ChatPersistenceInitializer() {
    const isInitializedRef = useRef(false)
    const timeoutsRef = useRef<{ initial?: NodeJS.Timeout; periodic?: NodeJS.Timeout }>({})

    useEffect(() => {
        // Evitar doble inicialización
        if (isInitializedRef.current) {
            console.log('[ChatPersistenceInitializer] Ya inicializado, omitiendo...')
            return
        }

        // Asegurar que estamos en el cliente
        if (typeof window === 'undefined') {
            console.warn('[ChatPersistenceInitializer] No se puede inicializar en el servidor')
            return
        }

        console.log('[ChatPersistenceInitializer] Inicializando sistema de persistencia...')
        
        try {
            // Inicializar el sistema explícitamente
            const instance = initializeChatSyncPersistence()
            
            if (!instance) {
                console.error('[ChatPersistenceInitializer] No se pudo inicializar el sistema de persistencia')
                return
            }

            isInitializedRef.current = true
            
            // Forzar sincronización inicial después de un breve delay
            timeoutsRef.current.initial = setTimeout(() => {
                if (typeof forceChatSync === 'function') {
                    forceChatSync()
                        .then(() => console.log('[ChatPersistenceInitializer] Sincronización inicial completada'))
                        .catch(err => console.error('[ChatPersistenceInitializer] Error en sincronización inicial:', err))
                }
            }, 1500) // Aumentado a 1.5s para dar más tiempo a la inicialización
            
            // Configurar sincronización periódica cada 30 segundos
            timeoutsRef.current.periodic = setInterval(() => {
                if (typeof forceChatSync === 'function') {
                    forceChatSync()
                        .then(() => console.log('[ChatPersistenceInitializer] Sincronización periódica completada'))
                        .catch(err => console.error('[ChatPersistenceInitializer] Error en sincronización periódica:', err))
                }
            }, 30000)
        } catch (error) {
            console.error('[ChatPersistenceInitializer] Error durante la inicialización:', error)
        }
        
        // Cleanup
        return () => {
            if (timeoutsRef.current.initial) {
                clearTimeout(timeoutsRef.current.initial)
            }
            if (timeoutsRef.current.periodic) {
                clearInterval(timeoutsRef.current.periodic)
            }
            isInitializedRef.current = false
            console.log('[ChatPersistenceInitializer] Sistema de persistencia detenido')
        }
    }, [])
    
    // Componente invisible
    return null
}
