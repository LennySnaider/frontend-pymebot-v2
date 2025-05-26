/**
 * Sistema de persistencia de conversaciones por lead y plantilla
 * Almacena el estado de cada conversación incluyendo:
 * - Nodos visitados
 * - Datos recolectados
 * - Estado actual del flujo
 * - Historial de mensajes
 */

import { ChatTemplate } from '@/app/(protected-pages)/modules/marketing/chat/_components/TemplateSelector'

export interface ConversationState {
    leadId: string
    templateId: string
    currentNodeId?: string
    visitedNodes: string[]
    collectedData: Record<string, any>
    messages: ConversationMessage[]
    metadata: {
        startedAt: number
        lastInteraction: number
        completed: boolean
        stage?: string
    }
}

export interface ConversationMessage {
    id: string
    nodeId?: string
    content: string
    timestamp: number
    type: 'user' | 'bot'
    buttons?: Array<{ text: string; value: string }>
    selectedButton?: string
}

export interface TemplateProgress {
    templateId: string
    progress: number // 0-100
    completedNodes: number
    totalNodes: number
}

class ConversationPersistence {
    private static instance: ConversationPersistence
    private conversations: Map<string, ConversationState> = new Map()
    private storageKey = 'chatbot_conversations'
    private dataStorageKey = 'chatbot_collected_data'
    
    private constructor() {
        this.loadFromStorage()
    }
    
    static getInstance(): ConversationPersistence {
        if (!ConversationPersistence.instance) {
            ConversationPersistence.instance = new ConversationPersistence()
        }
        return ConversationPersistence.instance
    }
    
    /**
     * Carga las conversaciones desde localStorage
     */
    private loadFromStorage() {
        if (typeof window === 'undefined') return
        
        try {
            const stored = localStorage.getItem(this.storageKey)
            if (stored) {
                const data = JSON.parse(stored)
                this.conversations = new Map(Object.entries(data))
                console.log('[ConversationPersistence] Cargadas', this.conversations.size, 'conversaciones')
            }
        } catch (error) {
            console.error('[ConversationPersistence] Error cargando desde storage:', error)
        }
    }
    
    /**
     * Guarda las conversaciones en localStorage
     */
    private saveToStorage() {
        if (typeof window === 'undefined') return
        
        try {
            const data = Object.fromEntries(this.conversations)
            localStorage.setItem(this.storageKey, JSON.stringify(data))
        } catch (error) {
            console.error('[ConversationPersistence] Error guardando en storage:', error)
        }
    }
    
    /**
     * Obtiene el ID único para una conversación
     */
    private getConversationId(leadId: string, templateId: string): string {
        return `${leadId}_${templateId}`
    }
    
    /**
     * Obtiene o crea el estado de una conversación
     */
    getConversation(leadId: string, templateId: string): ConversationState {
        const id = this.getConversationId(leadId, templateId)
        
        if (!this.conversations.has(id)) {
            const newConversation: ConversationState = {
                leadId,
                templateId,
                visitedNodes: [],
                collectedData: {},
                messages: [],
                metadata: {
                    startedAt: Date.now(),
                    lastInteraction: Date.now(),
                    completed: false
                }
            }
            this.conversations.set(id, newConversation)
            this.saveToStorage()
        }
        
        return this.conversations.get(id)!
    }
    
    /**
     * Actualiza el nodo actual de la conversación
     */
    updateCurrentNode(leadId: string, templateId: string, nodeId: string) {
        const conversation = this.getConversation(leadId, templateId)
        conversation.currentNodeId = nodeId
        
        if (!conversation.visitedNodes.includes(nodeId)) {
            conversation.visitedNodes.push(nodeId)
        }
        
        conversation.metadata.lastInteraction = Date.now()
        this.saveToStorage()
        
        console.log(`[ConversationPersistence] Nodo actualizado: ${nodeId} para lead ${leadId}`)
    }
    
    /**
     * Agrega un mensaje a la conversación
     */
    addMessage(
        leadId: string, 
        templateId: string, 
        message: Omit<ConversationMessage, 'id' | 'timestamp'>
    ) {
        const conversation = this.getConversation(leadId, templateId)
        
        const newMessage: ConversationMessage = {
            ...message,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        }
        
        conversation.messages.push(newMessage)
        conversation.metadata.lastInteraction = Date.now()
        this.saveToStorage()
        
        return newMessage
    }
    
    /**
     * Guarda datos recolectados de la conversación
     */
    saveCollectedData(
        leadId: string, 
        templateId: string, 
        key: string, 
        value: any
    ) {
        const conversation = this.getConversation(leadId, templateId)
        conversation.collectedData[key] = value
        conversation.metadata.lastInteraction = Date.now()
        
        // También guardar en un storage separado para fácil acceso global
        this.saveGlobalCollectedData(leadId, key, value)
        
        this.saveToStorage()
        
        console.log(`[ConversationPersistence] Dato guardado: ${key} = ${value} para lead ${leadId}`)
    }
    
    /**
     * Guarda datos recolectados globalmente (accesibles desde cualquier plantilla)
     */
    private saveGlobalCollectedData(leadId: string, key: string, value: any) {
        try {
            const stored = localStorage.getItem(this.dataStorageKey) || '{}'
            const data = JSON.parse(stored)
            
            if (!data[leadId]) {
                data[leadId] = {}
            }
            
            data[leadId][key] = value
            data[leadId].lastUpdated = Date.now()
            
            localStorage.setItem(this.dataStorageKey, JSON.stringify(data))
        } catch (error) {
            console.error('[ConversationPersistence] Error guardando datos globales:', error)
        }
    }
    
    /**
     * Obtiene todos los datos recolectados de un lead
     */
    getLeadCollectedData(leadId: string): Record<string, any> {
        try {
            const stored = localStorage.getItem(this.dataStorageKey) || '{}'
            const data = JSON.parse(stored)
            return data[leadId] || {}
        } catch (error) {
            console.error('[ConversationPersistence] Error obteniendo datos del lead:', error)
            return {}
        }
    }
    
    /**
     * Marca una conversación como completada
     */
    markAsCompleted(leadId: string, templateId: string) {
        const conversation = this.getConversation(leadId, templateId)
        conversation.metadata.completed = true
        conversation.metadata.lastInteraction = Date.now()
        this.saveToStorage()
    }
    
    /**
     * Obtiene el progreso de un lead en todas las plantillas
     */
    getLeadProgress(leadId: string, templates: ChatTemplate[]): TemplateProgress[] {
        return templates.map(template => {
            const conversation = this.conversations.get(
                this.getConversationId(leadId, template.id)
            )
            
            if (!conversation) {
                return {
                    templateId: template.id,
                    progress: 0,
                    completedNodes: 0,
                    totalNodes: template.flow?.nodes?.length || 0
                }
            }
            
            const totalNodes = template.flow?.nodes?.length || 0
            const completedNodes = conversation.visitedNodes.length
            const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0
            
            return {
                templateId: template.id,
                progress: Math.min(progress, 100),
                completedNodes,
                totalNodes
            }
        })
    }
    
    /**
     * Reinicia una conversación específica
     */
    resetConversation(leadId: string, templateId: string) {
        const id = this.getConversationId(leadId, templateId)
        this.conversations.delete(id)
        this.saveToStorage()
        
        console.log(`[ConversationPersistence] Conversación reiniciada para lead ${leadId}, plantilla ${templateId}`)
    }
    
    /**
     * Obtiene todas las conversaciones de un lead
     */
    getLeadConversations(leadId: string): ConversationState[] {
        const conversations: ConversationState[] = []
        
        this.conversations.forEach((conversation, id) => {
            if (conversation.leadId === leadId) {
                conversations.push(conversation)
            }
        })
        
        return conversations
    }
    
    /**
     * Exporta todas las conversaciones (para backup o análisis)
     */
    exportConversations(): Record<string, ConversationState> {
        return Object.fromEntries(this.conversations)
    }
    
    /**
     * Importa conversaciones (restaurar backup)
     */
    importConversations(data: Record<string, ConversationState>) {
        this.conversations = new Map(Object.entries(data))
        this.saveToStorage()
    }
    
    /**
     * Limpia conversaciones antiguas (más de 30 días sin actividad)
     */
    cleanupOldConversations(daysToKeep: number = 30) {
        const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
        let removed = 0
        
        this.conversations.forEach((conversation, id) => {
            if (conversation.metadata.lastInteraction < cutoffTime) {
                this.conversations.delete(id)
                removed++
            }
        })
        
        if (removed > 0) {
            this.saveToStorage()
            console.log(`[ConversationPersistence] Eliminadas ${removed} conversaciones antiguas`)
        }
    }
}

// Exportar instancia única
export const conversationPersistence = ConversationPersistence.getInstance()

// Funciones helper
export function getConversationState(leadId: string, templateId: string): ConversationState {
    return conversationPersistence.getConversation(leadId, templateId)
}

export function saveConversationData(
    leadId: string, 
    templateId: string, 
    key: string, 
    value: any
) {
    conversationPersistence.saveCollectedData(leadId, templateId, key, value)
}

export function getLeadData(leadId: string): Record<string, any> {
    return conversationPersistence.getLeadCollectedData(leadId)
}

export function addConversationMessage(
    leadId: string,
    templateId: string,
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
) {
    return conversationPersistence.addMessage(leadId, templateId, message)
}

export function updateConversationNode(
    leadId: string,
    templateId: string,
    nodeId: string
) {
    conversationPersistence.updateCurrentNode(leadId, templateId, nodeId)
}

export function markConversationCompleted(leadId: string, templateId: string) {
    conversationPersistence.markAsCompleted(leadId, templateId)
}

export function getLeadTemplateProgress(leadId: string, templates: ChatTemplate[]): TemplateProgress[] {
    return conversationPersistence.getLeadProgress(leadId, templates)
}

export function clearConversation(leadId: string, templateId: string) {
    // Obtener la conversación actual
    const conversation = conversationPersistence.getConversation(leadId, templateId)
    
    // Limpiar los mensajes pero preservar datos recolectados
    if (conversation) {
        conversation.messages = []
        conversation.currentNodeId = null
        conversation.metadata.lastInteraction = Date.now()
        
        // Forzar guardado usando el método privado a través de la instancia
        ;(conversationPersistence as any).saveToStorage()
    }
    
    console.log(`[ConversationPersistence] Conversación limpiada para lead ${leadId}, template ${templateId}`)
}

// Inicializar limpieza automática
if (typeof window !== 'undefined') {
    // Limpiar conversaciones antiguas al cargar
    setTimeout(() => {
        conversationPersistence.cleanupOldConversations()
    }, 5000)
    
    // Limpiar cada 24 horas
    setInterval(() => {
        conversationPersistence.cleanupOldConversations()
    }, 24 * 60 * 60 * 1000)
}
