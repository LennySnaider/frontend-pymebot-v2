'use client'

import { useEffect, useRef } from 'react'
import { useChatStore } from '../_store/chatStore'
import { conversationPersistence } from '@/utils/conversationPersistence'

interface ConversationPersistenceProviderProps {
    children: React.ReactNode
}

/**
 * Componente que maneja la persistencia de conversaciones por lead y plantilla
 * Se encarga de:
 * - Cargar el estado de conversación cuando cambia el lead o plantilla
 * - Guardar automáticamente el progreso
 * - Sincronizar datos entre pestañas
 */
export default function ConversationPersistenceProvider({ children }: ConversationPersistenceProviderProps) {
    const selectedChat = useChatStore((state) => state.selectedChat)
    const activeTemplateId = useChatStore((state) => state.activeTemplateId)
    const loadConversationState = useChatStore((state) => state.loadConversationState)
    const updateLeadTemplateProgress = useChatStore((state) => state.updateLeadTemplateProgress)
    
    const previousLeadRef = useRef<string>()
    const previousTemplateRef = useRef<string>()
    
    // Cargar estado de conversación cuando cambia el lead o la plantilla
    useEffect(() => {
        if (!selectedChat.id || !activeTemplateId) return
        
        // Extraer leadId del chatId
        const leadId = selectedChat.id.replace('lead_', '')
        
        // Verificar si cambió el lead o la plantilla
        const leadChanged = leadId !== previousLeadRef.current
        const templateChanged = activeTemplateId !== previousTemplateRef.current
        
        if (leadChanged || templateChanged) {
            console.log('[ConversationPersistenceProvider] Cargando estado de conversación:', {
                leadId,
                templateId: activeTemplateId,
                leadChanged,
                templateChanged
            })
            
            // Cargar estado de la conversación
            loadConversationState(leadId, activeTemplateId)
            
            // Actualizar progreso del lead en todas las plantillas
            updateLeadTemplateProgress(leadId)
            
            // Actualizar referencias
            previousLeadRef.current = leadId
            previousTemplateRef.current = activeTemplateId
        }
    }, [selectedChat.id, activeTemplateId, loadConversationState, updateLeadTemplateProgress])
    
    // Escuchar eventos de sincronización entre pestañas
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'chatbot_conversations' && event.newValue) {
                // Si cambiaron las conversaciones en otra pestaña, recargar estado actual
                if (selectedChat.id && activeTemplateId) {
                    const leadId = selectedChat.id.replace('lead_', '')
                    loadConversationState(leadId, activeTemplateId)
                    updateLeadTemplateProgress(leadId)
                }
            }
        }
        
        window.addEventListener('storage', handleStorageChange)
        
        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [selectedChat.id, activeTemplateId, loadConversationState, updateLeadTemplateProgress])
    
    // Limpiar conversaciones antiguas periódicamente
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            conversationPersistence.cleanupOldConversations()
        }, 12 * 60 * 60 * 1000) // Cada 12 horas
        
        return () => {
            clearInterval(cleanupInterval)
        }
    }, [])
    
    return <>{children}</>
}
