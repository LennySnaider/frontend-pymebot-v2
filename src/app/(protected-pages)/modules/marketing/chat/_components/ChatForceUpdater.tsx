'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '../_store/chatStore'

/**
 * Componente que fuerza la actualización visual del chat
 * cuando detecta cambios en los nombres de leads
 */
export default function ChatForceUpdater() {
    const [updateCount, setUpdateCount] = useState(0)
    const triggerUpdate = useChatStore((state) => state.triggerUpdate)
    
    useEffect(() => {
        // Forzar actualización cuando cambia triggerUpdate
        setUpdateCount(prev => prev + 1)
    }, [triggerUpdate])
    
    useEffect(() => {
        // Función para forzar actualización del chat
        const forceUpdate = () => {
            console.log('[ChatForceUpdater] Forzando actualización del chat')
            setUpdateCount(prev => prev + 1)
            
            // También forzar actualización del store
            const { setTriggerUpdate } = useChatStore.getState()
            if (typeof setTriggerUpdate === 'function') {
                setTriggerUpdate(Date.now())
            }
        }
        
        // Exponer función globalmente
        if (typeof window !== 'undefined') {
            (window as any).__forceChatUpdate = forceUpdate
        }
        
        // Escuchar eventos de actualización
        const handleUpdate = () => forceUpdate()
        
        window.addEventListener('force-chat-update', handleUpdate)
        window.addEventListener('lead-name-updated', handleUpdate)
        
        return () => {
            window.removeEventListener('force-chat-update', handleUpdate)
            window.removeEventListener('lead-name-updated', handleUpdate)
            
            if (typeof window !== 'undefined') {
                delete (window as any).__forceChatUpdate
            }
        }
    }, [])
    
    // Componente invisible
    return <div data-update-count={updateCount} style={{ display: 'none' }} />
}
