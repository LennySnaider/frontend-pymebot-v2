'use client'

/**
 * Componente mejorado para escuchar cambios de nombres de leads
 * VERSIÓN ANTI-LOOP - Previene loops infinitos con deduplicación robusta
 */

import { useEffect, useRef } from 'react'
import { registerSyncListener } from '@/utils/globalSyncEvent'
import { useChatStore } from '../_store/chatStore'
import { syncLeadToChat } from '@/utils/chatSyncPersistence'

// Tipos para mayor claridad
interface UpdateData {
  name: string
  timestamp: number
  hash: string
}

// Función para crear un hash simple del contenido
function createUpdateHash(leadId: string, name: string): string {
  return `${leadId}:${name}:${Math.floor(Date.now() / 1000)}` // Precision de 1 segundo
}

export default function LeadNameSyncListener() {
  // Referencia para almacenar cambios pendientes
  const pendingUpdates = useRef<Map<string, UpdateData>>(new Map())
  
  // Referencia para evitar actualizaciones duplicadas (con hash)
  const processedHashes = useRef<Set<string>>(new Set())
  
  // Referencia para el último valor procesado por lead
  const lastProcessedValues = useRef<Map<string, string>>(new Map())
  
  // Flag para evitar procesamiento durante actualizaciones masivas
  const isProcessingBatch = useRef(false)
  
  useEffect(() => {
    const { updateChatName, refreshChatList, chats, updateChatMetadata } = useChatStore.getState()
    
    // Limpiar hashes antiguos cada 30 segundos
    const hashCleanupInterval = setInterval(() => {
      const now = Date.now()
      const oldHashes = Array.from(processedHashes.current).filter(hash => {
        const timestamp = parseInt(hash.split(':')[2]) * 1000
        return now - timestamp > 30000 // Más de 30 segundos
      })
      
      oldHashes.forEach(hash => processedHashes.current.delete(hash))
      
      if (oldHashes.length > 0) {
        console.log(`[LeadNameSyncListener] Limpiados ${oldHashes.length} hashes antiguos`)
      }
    }, 30000)
    
    // Función para aplicar actualizaciones pendientes después de un refresh
    const applyPendingUpdates = () => {
      if (isProcessingBatch.current) {
        console.log('[LeadNameSyncListener] Saltando aplicación de pendientes - procesamiento en lote activo')
        return
      }
      
      const currentPendingUpdates = pendingUpdates.current
      if (currentPendingUpdates.size > 0) {
        console.log('[LeadNameSyncListener] Aplicando actualizaciones pendientes:', currentPendingUpdates.size)
        
        isProcessingBatch.current = true
        
        currentPendingUpdates.forEach(({ name, timestamp, hash }, chatId) => {
          // Verificar que no sea una actualización ya procesada
          if (!processedHashes.current.has(hash)) {
            updateChatName(chatId, name)
            updateChatMetadata(chatId, {
              lastUpdate: timestamp,
              syncedName: name
            })
            processedHashes.current.add(hash)
            lastProcessedValues.current.set(chatId, name)
            console.log(`[LeadNameSyncListener] Aplicada actualización pendiente: ${chatId} -> "${name}"`)
          }
        })
        
        // Limpiar pendientes después de aplicar
        currentPendingUpdates.clear()
        
        // Esperar un momento antes de permitir más procesamiento
        setTimeout(() => {
          isProcessingBatch.current = false
        }, 500)
      }
    }
    
    // Función helper para procesar actualización de lead con deduplicación mejorada
    const processLeadUpdate = (leadId: string, name: string, additionalData?: any) => {
      // Validar leadId
      if (!leadId || typeof leadId !== 'string' || leadId.includes('[object')) {
        console.error('[LeadNameSyncListener] ID de lead inválido:', leadId)
        return
      }
      
      // Validar nombre
      if (!name || typeof name !== 'string' || name === 'undefined' || name === 'null') {
        console.warn('[LeadNameSyncListener] Nombre inválido:', name)
        return
      }
      
      // Normalizar leadId
      const normalizedId = leadId.replace(/^lead_/, '')
      const chatId = `lead_${normalizedId}`
      
      // DEDUPLICACIÓN 1: Verificar si el valor es el mismo que el último procesado
      const lastValue = lastProcessedValues.current.get(chatId)
      if (lastValue === name) {
        console.log(`[LeadNameSyncListener] Ignorando - mismo valor: ${chatId} = "${name}"`)
        return
      }
      
      // DEDUPLICACIÓN 2: Crear hash y verificar si ya fue procesado
      const updateHash = createUpdateHash(chatId, name)
      if (processedHashes.current.has(updateHash)) {
        console.log(`[LeadNameSyncListener] Ignorando - actualización duplicada (hash): ${chatId}`)
        return
      }
      
      // DEDUPLICACIÓN 3: Si estamos procesando en lote, agregar a pendientes
      if (isProcessingBatch.current) {
        console.log(`[LeadNameSyncListener] Agregando a pendientes (procesamiento en lote activo): ${chatId}`)
        pendingUpdates.current.set(chatId, {
          name,
          timestamp: Date.now(),
          hash: updateHash
        })
        return
      }
      
      const timestamp = Date.now()
      
      // Marcar como procesado
      processedHashes.current.add(updateHash)
      lastProcessedValues.current.set(chatId, name)
      
      // Actualizar usando el sistema de persistencia mejorado
      // IMPORTANTE: No disparar más eventos desde aquí
      try {
        syncLeadToChat(normalizedId, name, {
          ...additionalData,
          timestamp,
          skipBroadcast: true // Flag para evitar propagación de eventos
        })
      } catch (error) {
        console.error('[LeadNameSyncListener] Error al sincronizar con persistencia:', error)
      }
      
      // Actualizar el chat inmediatamente si existe
      const chatExists = chats.some(chat => chat.id === chatId)
      
      if (chatExists) {
        updateChatName(chatId, name)
        updateChatMetadata(chatId, {
          lastUpdate: timestamp,
          syncedName: name,
          nameUpdatePending: false
        })
        
        console.log(`[LeadNameSyncListener] Chat ${chatId} actualizado con nombre: "${name}"`)
      } else {
        // Guardar en pendientes para aplicar después del próximo refresh
        pendingUpdates.current.set(chatId, {
          name,
          timestamp,
          hash: updateHash
        })
        console.log(`[LeadNameSyncListener] Chat ${chatId} no encontrado, guardado en pendientes`)
      }
    }
    
    // Escuchar cambios de nombres de leads vía sistema global
    const unsubscribe = registerSyncListener('lead-names', (data) => {
      if (data && data.leadId && data.name) {
        console.log('[LeadNameSyncListener] Recibido cambio de nombre vía sync global:', data)
        processLeadUpdate(data.leadId, data.name, data)
      }
    })
    
    // Handler mejorado para eventos DOM con debounce
    const eventDebounce = new Map<string, NodeJS.Timeout>()
    
    const handleDOMEvent = (event: CustomEvent) => {
      if (!event.detail) return
      
      const detail = event.detail
      let leadId = detail.leadId || detail.id
      let name = detail.data?.full_name || detail.data?.name || detail.name || detail.full_name
      
      // Validación estricta
      if (!leadId || typeof leadId !== 'string') {
        console.warn('[LeadNameSyncListener] Evento con leadId inválido:', detail)
        return
      }
      
      if (!name || typeof name !== 'string') {
        console.warn('[LeadNameSyncListener] Evento con nombre inválido:', detail)
        return
      }
      
      // Normalizar leadId para el debounce
      const normalizedId = leadId.replace(/^lead_/, '')
      const debounceKey = `${normalizedId}:${name}`
      
      // Cancelar timeout anterior si existe
      const existingTimeout = eventDebounce.get(debounceKey)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }
      
      // Configurar nuevo timeout con debounce
      const timeout = setTimeout(() => {
        console.log('[LeadNameSyncListener] Procesando evento (post-debounce):', event.type, { leadId, name })
        processLeadUpdate(leadId, name, detail.data || detail)
        eventDebounce.delete(debounceKey)
      }, 300) // 300ms de debounce
      
      eventDebounce.set(debounceKey, timeout)
    }
    
    // Registrar múltiples tipos de eventos para máxima compatibilidad
    const eventHandlers = [
      { event: 'salesfunnel-lead-updated', handler: handleDOMEvent },
      { event: 'syncLeadNames', handler: handleDOMEvent },
      { event: 'lead-update', handler: handleDOMEvent },
      { event: 'lead-name-updated', handler: handleDOMEvent },
      { event: 'lead-data-updated', handler: handleDOMEvent }
    ]
    
    eventHandlers.forEach(({ event, handler }) => {
      window.addEventListener(event as any, handler)
    })
    
    // Interceptar refreshChatList para aplicar cambios pendientes después
    const originalRefreshChatList = useChatStore.getState().refreshChatList
    const wrappedRefreshChatList = async () => {
      console.log('[LeadNameSyncListener] Interceptando refreshChatList')
      
      try {
        const result = await originalRefreshChatList()
        
        // Aplicar cambios pendientes después del refresh
        setTimeout(applyPendingUpdates, 100)
        
        return result
      } catch (error) {
        console.error('[LeadNameSyncListener] Error en refreshChatList:', error)
        throw error
      }
    }
    
    // Reemplazar temporalmente la función
    useChatStore.setState({ refreshChatList: wrappedRefreshChatList })
    
    // Aplicar actualizaciones pendientes cada 10 segundos como respaldo
    const backupInterval = setInterval(() => {
      if (pendingUpdates.current.size > 0 && !isProcessingBatch.current) {
        console.log('[LeadNameSyncListener] Aplicando actualizaciones pendientes (respaldo)')
        applyPendingUpdates()
      }
    }, 10000)
    
    console.log('[LeadNameSyncListener] Listener de sincronización de nombres iniciado (versión anti-loop)')
    
    // Cleanup
    return () => {
      unsubscribe()
      
      // Limpiar todos los debounce timeouts
      eventDebounce.forEach(timeout => clearTimeout(timeout))
      eventDebounce.clear()
      
      eventHandlers.forEach(({ event, handler }) => {
        window.removeEventListener(event as any, handler)
      })
      
      // Restaurar la función original
      useChatStore.setState({ refreshChatList: originalRefreshChatList })
      
      // Limpiar intervals
      clearInterval(backupInterval)
      clearInterval(hashCleanupInterval)
      
      // Limpiar referencias
      pendingUpdates.current.clear()
      processedHashes.current.clear()
      lastProcessedValues.current.clear()
      
      console.log('[LeadNameSyncListener] Listener de sincronización de nombres detenido')
    }
  }, [])
  
  // Componente invisible - solo para escuchar eventos
  return null
}
