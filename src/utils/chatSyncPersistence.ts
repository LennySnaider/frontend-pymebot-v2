/**
 * Sistema mejorado de sincronización Chat-SalesFunnel
 * Soluciona problemas de persistencia y sincronización en tiempo real
 */

import { useChatStore } from '@/app/(protected-pages)/modules/marketing/chat/_store/chatStore'
import globalLeadCache from '@/stores/globalLeadCache'
import { broadcastLeadDataUpdate } from '@/utils/leadSync'
import { 
    isValidLeadId, 
    normalizeLeadId, 
    getChatIdFromLeadId,
    extractLeadIdFromEvent,
    extractNameFromEvent 
} from '@/utils/leadIdValidator'

// Variable para controlar si el sistema está inicializado
let isInitialized = false

/**
 * Interfaz para datos de sincronización
 */
interface SyncData {
    leadId: string
    name: string
    email?: string
    phone?: string
    stage?: string
    timestamp?: number
}

/**
 * Sistema de persistencia mejorado
 */
class ChatSyncPersistence {
    private static instance: ChatSyncPersistence
    private pendingUpdates: Map<string, SyncData> = new Map()
    private syncInterval: NodeJS.Timeout | null = null
    
    private constructor() {
        this.initializeSyncSystem()
    }
    
    static getInstance(): ChatSyncPersistence {
        if (!ChatSyncPersistence.instance) {
            ChatSyncPersistence.instance = new ChatSyncPersistence()
        }
        return ChatSyncPersistence.instance
    }
    
    /**
     * Inicializa el sistema de sincronización
     */
    private initializeSyncSystem() {
        if (typeof window === 'undefined') return
        
        // Iniciar sincronización periódica cada 2 segundos
        this.syncInterval = setInterval(() => {
            this.processPendingUpdates()
        }, 2000)
        
        // Escuchar eventos de actualización
        this.setupEventListeners()
        
        console.log('[ChatSyncPersistence] Sistema inicializado')
    }
    
    /**
     * Configura listeners de eventos
     */
    private setupEventListeners() {
        // Escuchar evento de actualización desde sales funnel
        window.addEventListener('salesfunnel-lead-updated', this.handleSalesFunnelUpdate)
        window.addEventListener('lead-data-updated', this.handleLeadDataUpdate)
        window.addEventListener('force-chat-refresh', this.handleForceRefresh)
        
        // Escuchar cambios en localStorage para sincronización entre pestañas
        window.addEventListener('storage', this.handleStorageChange)
    }
    
    /**
     * Maneja actualizaciones desde el sales funnel
     */
    private handleSalesFunnelUpdate = (event: CustomEvent) => {
        // Usar las utilidades de extracción segura
        const leadId = extractLeadIdFromEvent(event)
        const name = extractNameFromEvent(event) || event.detail?.name || ''
        
        if (!leadId) {
            console.warn('[ChatSyncPersistence] No se pudo extraer leadId válido del evento:', event)
            return
        }
        
        const data: SyncData = {
            leadId: leadId,
            name: name,
            email: event.detail?.data?.email || event.detail?.email,
            phone: event.detail?.data?.phone || event.detail?.phone,
            stage: event.detail?.data?.stage || event.detail?.stage,
            timestamp: Date.now()
        }
        
        this.addPendingUpdate(data)
    }
    
    /**
     * Maneja actualizaciones de datos de lead
     */
    private handleLeadDataUpdate = (event: CustomEvent) => {
        // Usar las utilidades de extracción segura
        const leadId = extractLeadIdFromEvent(event)
        const name = extractNameFromEvent(event) || ''
        
        if (!leadId) {
            console.warn('[ChatSyncPersistence] No se pudo extraer leadId válido del evento:', event)
            return
        }
        
        const data: SyncData = {
            leadId: leadId,
            name: name,
            email: event.detail?.data?.email || event.detail?.email,
            phone: event.detail?.data?.phone || event.detail?.phone,
            stage: event.detail?.data?.stage || event.detail?.stage,
            timestamp: event.detail?.data?.timestamp || Date.now()
        }
        
        this.addPendingUpdate(data)
    }
    
    /**
     * Maneja refresh forzado
     */
    private handleForceRefresh = async () => {
        console.log('[ChatSyncPersistence] Refresh forzado solicitado')
        await this.forceCompleteSync()
    }
    
    /**
     * Maneja cambios en localStorage (sincronización entre pestañas)
     */
    private handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'lead-sync-updates' && event.newValue) {
            try {
                const updates = JSON.parse(event.newValue)
                if (Array.isArray(updates)) {
                    updates.forEach(update => this.addPendingUpdate(update))
                }
            } catch (error) {
                console.error('[ChatSyncPersistence] Error parsing storage update:', error)
            }
        }
    }
    
    /**
     * Agrega una actualización pendiente
     */
    addPendingUpdate(data: SyncData) {
        // Validar datos básicos
        if (!data.leadId || !data.name) {
            console.warn('[ChatSyncPersistence] Datos incompletos para actualización:', data)
            return
        }
        
        // Validar y normalizar leadId
        const normalizedId = normalizeLeadId(data.leadId)
        if (!normalizedId) {
            console.error('[ChatSyncPersistence] leadId inválido:', data.leadId)
            return
        }
        
        // Verificar si el valor ya existe y es el mismo
        const existingData = this.pendingUpdates.get(normalizedId)
        if (existingData && existingData.name === data.name) {
            console.log(`[ChatSyncPersistence] Ignorando actualización duplicada para ${normalizedId}`)
            return
        }
        
        // Guardar en pendientes
        this.pendingUpdates.set(normalizedId, data)
        
        // Actualizar caché global inmediatamente
        globalLeadCache.updateLeadData(normalizedId, {
            name: data.name,
            stage: data.stage
        })
        
        // Actualizar chat store inmediatamente si está disponible
        this.updateChatStore(normalizedId, data)
        
        // Guardar en localStorage para persistencia
        this.saveToLocalStorage()
        
        console.log(`[ChatSyncPersistence] Actualización agregada: ${normalizedId} -> "${data.name}"`)
    }
    
    /**
     * Procesa todas las actualizaciones pendientes
     */
    private processPendingUpdates() {
        if (this.pendingUpdates.size === 0) return
        
        console.log(`[ChatSyncPersistence] Procesando ${this.pendingUpdates.size} actualizaciones pendientes`)
        
        // Procesar cada actualización
        this.pendingUpdates.forEach((data, leadId) => {
            this.updateChatStore(leadId, data)
        })
        
        // Limpiar pendientes procesados
        this.pendingUpdates.clear()
        
        // Forzar refresh de la lista si es necesario
        this.refreshChatListIfNeeded()
    }
    
    /**
     * Actualiza el chat store con los datos
     */
    private updateChatStore(leadId: string, data: SyncData) {
        try {
            if (typeof useChatStore.getState !== 'function') return
            
            const store = useChatStore.getState()
            const chatId = getChatIdFromLeadId(leadId)
            
            if (!chatId) {
                console.error('[ChatSyncPersistence] No se pudo obtener chatId válido para:', leadId)
                return
            }
            
            // Actualizar nombre
            if (data.name && typeof store.updateChatName === 'function') {
                store.updateChatName(chatId, data.name)
            }
            
            // Actualizar metadata
            if (typeof store.updateChatMetadata === 'function') {
                const metadata: any = {
                    lastUpdate: data.timestamp || Date.now(),
                    syncedName: data.name
                }
                
                if (data.stage) metadata.stage = data.stage
                if (data.email) metadata.email = data.email
                if (data.phone) metadata.phone = data.phone
                
                store.updateChatMetadata(chatId, metadata)
            }
            
            // Forzar trigger de actualización
            if (typeof store.setTriggerUpdate === 'function') {
                store.setTriggerUpdate(Date.now())
            }
            
        } catch (error) {
            console.error('[ChatSyncPersistence] Error actualizando chat store:', error)
        }
    }
    
    /**
     * Refresca la lista de chats si es necesario
     */
    private async refreshChatListIfNeeded() {
        try {
            const store = useChatStore.getState()
            if (typeof store.refreshChatList === 'function') {
                // Solo refrescar si han pasado más de 5 segundos desde el último refresh
                const lastRefresh = (window as any).__lastChatRefresh || 0
                const now = Date.now()
                
                if (now - lastRefresh > 5000) {
                    (window as any).__lastChatRefresh = now
                    await store.refreshChatList()
                    console.log('[ChatSyncPersistence] Lista de chats refrescada')
                }
            }
        } catch (error) {
            console.error('[ChatSyncPersistence] Error refrescando lista:', error)
        }
    }
    
    /**
     * Fuerza sincronización completa
     */
    async forceCompleteSync() {
        try {
            // Obtener todos los datos del caché global
            const allLeadData = globalLeadCache.getAllLeadData()
            
            // Actualizar cada lead en el chat store
            Object.entries(allLeadData).forEach(([leadId, data]) => {
                this.updateChatStore(leadId, {
                    leadId,
                    name: data.name || '',
                    stage: data.stage,
                    timestamp: data.updatedAt
                })
            })
            
            // Forzar refresh completo
            await this.refreshChatListIfNeeded()
            
            console.log('[ChatSyncPersistence] Sincronización completa finalizada')
        } catch (error) {
            console.error('[ChatSyncPersistence] Error en sincronización completa:', error)
        }
    }
    
    /**
     * Guarda actualizaciones en localStorage
     */
    private saveToLocalStorage() {
        try {
            const updates = Array.from(this.pendingUpdates.values())
            localStorage.setItem('lead-sync-updates', JSON.stringify(updates))
        } catch (error) {
            console.error('[ChatSyncPersistence] Error guardando en localStorage:', error)
        }
    }
    
    /**
     * Limpia recursos
     */
    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
            this.syncInterval = null
        }
        
        window.removeEventListener('salesfunnel-lead-updated', this.handleSalesFunnelUpdate)
        window.removeEventListener('lead-data-updated', this.handleLeadDataUpdate)
        window.removeEventListener('force-chat-refresh', this.handleForceRefresh)
        window.removeEventListener('storage', this.handleStorageChange)
        
        this.pendingUpdates.clear()
        
        console.log('[ChatSyncPersistence] Sistema limpiado')
    }
}


// Exportar instancia única
export const chatSyncPersistence = ChatSyncPersistence.getInstance()

// Función helper para obtener la instancia de forma segura
export function getChatSyncPersistence() {
    if (!isInitialized) {
        console.warn('[ChatSyncPersistence] Sistema no inicializado, intentando inicializar...')
        return initializeChatSyncPersistence()
    }
    return chatSyncPersistence
}

// Función helper para actualizar un lead específico
export function syncLeadToChat(leadId: string | number | any, name: string, additionalData?: Partial<SyncData> & { skipBroadcast?: boolean }) {
    // Usar las utilidades de validación
    if (!isValidLeadId(leadId)) {
        console.warn('[syncLeadToChat] leadId inválido:', leadId)
        return
    }
    
    if (!name || typeof name !== 'string' || name === '' || name === 'undefined' || name === 'null') {
        console.warn('[syncLeadToChat] nombre inválido:', name)
        return
    }
    
    const normalizedId = normalizeLeadId(leadId)
    if (!normalizedId) {
        console.error('[syncLeadToChat] No se pudo normalizar el leadId:', leadId)
        return
    }
    
    // Obtener instancia de forma segura
    const instance = getChatSyncPersistence()
    if (!instance) {
        console.warn('[syncLeadToChat] No se pudo obtener instancia del sistema de persistencia')
        return
    }
    
    // Extraer skipBroadcast del additionalData
    const { skipBroadcast, ...syncData } = additionalData || {}
    
    instance.addPendingUpdate({
        leadId: normalizedId,
        name,
        ...syncData,
        timestamp: Date.now()
    })
    
    // Solo propagar eventos si no se especificó skipBroadcast
    if (!skipBroadcast) {
        // Disparar evento para otros componentes
        setTimeout(() => {
            broadcastLeadDataUpdate(normalizedId, { name, full_name: name }, 'lead-name-update')
        }, 50)
    }
}

// Función helper para forzar sincronización completa
export async function forceChatSync() {
    const instance = getChatSyncPersistence()
    if (!instance) {
        console.warn('[forceChatSync] No se pudo obtener instancia del sistema de persistencia')
        return
    }
    await instance.forceCompleteSync()
}

// Función para inicializar el sistema manualmente
export function initializeChatSyncPersistence() {
    if (typeof window === 'undefined') {
        console.log('[ChatSyncPersistence] No se puede inicializar en el servidor')
        return null
    }
    
    if (isInitialized) {
        console.log('[ChatSyncPersistence] Sistema ya inicializado')
        return chatSyncPersistence
    }
    
    try {
        // Obtener instancia (esto ejecuta el constructor si es la primera vez)
        const instance = ChatSyncPersistence.getInstance()
        isInitialized = true
        
        // Exponer funciones de debug en desarrollo
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            try {
                const win = window as any
                if (win && typeof win === 'object') {
                    win.__syncLeadToChat = syncLeadToChat
                    win.__forceChatSync = forceChatSync
                    win.__chatSyncPersistence = instance
                }
            } catch (error) {
                console.warn('[ChatSyncPersistence] No se pudieron establecer funciones de debug:', error)
            }
        }
        
        console.log('[ChatSyncPersistence] Sistema inicializado manualmente')
        return instance
    } catch (error) {
        console.error('[ChatSyncPersistence] Error durante inicialización:', error)
        return null
    }
}

// NO auto-inicializar para evitar errores durante la importación
// La inicialización debe hacerse explícitamente con initializeChatSyncPersistence()
