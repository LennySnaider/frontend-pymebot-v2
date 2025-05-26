/**
 * Hook para integrar la persistencia de conversaciones con el chat
 * Maneja la carga y guardado de mensajes, progreso y datos recolectados
 */

import { useEffect, useCallback } from 'react'
import { useChatStore } from '../_store/chatStore'
import { Message } from '../types'
import { 
    saveConversationData,
    updateConversationNode,
    addConversationMessage
} from '@/utils/conversationPersistence'

interface UseChatPersistenceOptions {
    leadId?: string
    templateId?: string
}

export function useChatPersistence(options?: UseChatPersistenceOptions) {
    const selectedChat = useChatStore((state) => state.selectedChat)
    const activeTemplateId = useChatStore((state) => state.activeTemplateId)
    const addPersistedMessage = useChatStore((state) => state.addPersistedMessage)
    const saveConversationProgress = useChatStore((state) => state.saveConversationProgress)
    const loadConversationState = useChatStore((state) => state.loadConversationState)
    
    // Usar los valores proporcionados o los del store
    const leadId = options?.leadId || selectedChat.id?.replace('lead_', '')
    const templateId = options?.templateId || activeTemplateId
    
    /**
     * Persiste un mensaje en el sistema de almacenamiento
     */
    const persistMessage = useCallback((message: Message, nodeId?: string) => {
        if (!leadId || !templateId) {
            console.warn('[useChatPersistence] No se puede persistir mensaje sin lead o template')
            return
        }
        
        // Usar la acción del store que ya maneja todo
        addPersistedMessage(message, nodeId)
    }, [leadId, templateId, addPersistedMessage])
    
    /**
     * Guarda datos recolectados del flujo
     */
    const saveFlowData = useCallback((key: string, value: any, nodeId?: string) => {
        if (!leadId || !templateId) {
            console.warn('[useChatPersistence] No se puede guardar datos sin lead o template')
            return
        }
        
        // Guardar el dato
        saveConversationData(leadId, templateId, key, value)
        
        // Si hay un nodeId, actualizar el progreso
        if (nodeId) {
            saveConversationProgress(nodeId, { [key]: value })
        }
        
        console.log(`[useChatPersistence] Dato guardado: ${key} = ${value}`)
    }, [leadId, templateId, saveConversationProgress])
    
    /**
     * Actualiza el nodo actual del flujo
     */
    const updateCurrentNode = useCallback((nodeId: string) => {
        if (!leadId || !templateId) {
            console.warn('[useChatPersistence] No se puede actualizar nodo sin lead o template')
            return
        }
        
        updateConversationNode(leadId, templateId, nodeId)
        saveConversationProgress(nodeId)
        
        console.log(`[useChatPersistence] Nodo actualizado: ${nodeId}`)
    }, [leadId, templateId, saveConversationProgress])
    
    /**
     * Carga el estado de conversación al montar
     */
    useEffect(() => {
        if (leadId && templateId) {
            console.log(`[useChatPersistence] Cargando estado para lead ${leadId}, template ${templateId}`)
            loadConversationState(leadId, templateId)
        }
    }, [leadId, templateId, loadConversationState])
    
    /**
     * Procesa la respuesta del bot para extraer y persistir datos
     */
    const processAndPersistBotResponse = useCallback((response: any, message: Message) => {
        if (!leadId || !templateId) return
        
        // Extraer nodeId si viene en la respuesta
        const nodeId = response?.metadata?.nodeId || 
                      response?.data?.metadata?.nodeId || 
                      response?.nodeId
        
        // Persistir el mensaje con su nodeId
        persistMessage(message, nodeId)
        
        // Buscar datos recolectados en diferentes formatos
        const dataToExtract = [
            response?.extracted_data,
            response?.metadata?.collected_data,
            response?.data?.metadata?.collected_data,
            response?.collected_data,
            response?.flow_data
        ]
        
        // Guardar todos los datos encontrados
        for (const dataObj of dataToExtract) {
            if (dataObj && typeof dataObj === 'object') {
                Object.entries(dataObj).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        saveFlowData(key, value, nodeId)
                    }
                })
            }
        }
        
        // Si hay un nodeId, actualizar el progreso
        if (nodeId) {
            updateCurrentNode(nodeId)
        }
        
        // Detectar si la conversación se completó
        if (response?.metadata?.flowCompleted || 
            response?.data?.metadata?.flowCompleted ||
            response?.flowCompleted) {
            console.log('[useChatPersistence] Flujo completado, marcando conversación como completa')
            // Marcar como completada (esto se hace en el store)
            if (leadId && templateId) {
                import('@/utils/conversationPersistence').then(({ markConversationCompleted }) => {
                    markConversationCompleted(leadId, templateId)
                })
            }
        }
    }, [leadId, templateId, persistMessage, saveFlowData, updateCurrentNode])
    
    return {
        persistMessage,
        saveFlowData,
        updateCurrentNode,
        processAndPersistBotResponse,
        leadId,
        templateId
    }
}
