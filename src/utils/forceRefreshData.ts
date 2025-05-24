/**
 * Utilidad para forzar la actualización completa de datos entre SalesFunnel y ChatList
 * 
 * Esta es una solución directa y pragmática para resolver problemas de sincronización
 * cuando los eventos y otras soluciones más elegantes fallan.
 */

import { useChatStore } from '@/app/(protected-pages)/modules/marketing/chat/_store/chatStore';
import { simpleLeadUpdateStore } from '@/stores/simpleLeadUpdateStore';
import { leadUpdateStore } from '@/stores/leadUpdateStore';
import globalLeadCache from '@/stores/globalLeadCache';
import { registerLeadName } from '@/utils/directSyncLeadNames';
import { publishLeadNameChange } from '@/utils/globalSyncEvent';

/**
 * Fuerza la actualización completa de la lista de chats desde cero
 * Usa múltiples estrategias para garantizar la sincronización
 */
export async function forceRefreshChatList() {
  console.log('🔄 forceRefreshData: Iniciando actualización forzada de chats');
  
  try {
    // 1. Primero refrescar chatStore directamente (si está disponible)
    if (useChatStore && typeof useChatStore.getState === 'function') {
      const store = useChatStore.getState();
      
      // Forzar que el estado se marque como no cargado para obligar la recarga
      if (typeof store.setChatsFetched === 'function') {
        store.setChatsFetched(false);
      }
      
      // Esperar un momento para que React procese el cambio de estado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Forzar el refresh de la lista
      if (typeof store.refreshChatList === 'function') {
        console.log('🔄 forceRefreshData: Ejecutando refreshChatList');
        await store.refreshChatList();
      }
    }
    
    // 2. Notificar a todos los stores de leads que hubo un cambio
    if (simpleLeadUpdateStore && typeof simpleLeadUpdateStore.getState === 'function') {
      simpleLeadUpdateStore.getState().setChanged(true);
      console.log('🔄 forceRefreshData: simpleLeadUpdateStore actualizado');
    }
    
    if (leadUpdateStore && typeof leadUpdateStore.addUpdate === 'function') {
      leadUpdateStore.addUpdate({
        type: 'force-refresh',
        leadId: 'all',
        data: { timestamp: Date.now() },
        time: Date.now()
      });
      console.log('🔄 forceRefreshData: leadUpdateStore actualizado');
    }
    
    // 3. Forzar actualización mediante eventos DOM
    if (typeof window !== 'undefined') {
      // Evento para actualizar lista de chats
      window.dispatchEvent(new CustomEvent('force-chat-refresh', {
        detail: { timestamp: Date.now() },
        bubbles: true
      }));
      
      // Evento para salesfunnel
      window.dispatchEvent(new CustomEvent('salesfunnel-refresh', {
        detail: { timestamp: Date.now() },
        bubbles: true
      }));
      
      console.log('🔄 forceRefreshData: Eventos DOM disparados');
    }
    
    // 4. Forzar recarga completa de datos si hay una API disponible
    try {
      // Intentar recargar los leads desde el servidor
      const response = await fetch('/api/leads/list?force=true', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`🔄 forceRefreshData: Datos de leads actualizados desde servidor (${data.length || 0} leads)`);
        
        // Actualizar el caché global con los datos frescos
        if (data && Array.isArray(data)) {
          data.forEach(lead => {
            const leadId = lead.id;
            const name = lead.full_name || lead.name || '';
            const stage = lead.stage || lead.metadata?.stage || lead.leadStatus;
            
            if (leadId && name) {
              console.log(`🔄 forceRefreshData: Actualizando caché para lead ${leadId}: "${name}" (${stage || 'sin etapa'})`);
              globalLeadCache.updateLeadData(leadId, { name, stage });
            }
          });
        }
      }
    } catch (apiError) {
      console.warn('🔄 forceRefreshData: Error al recargar datos del servidor', apiError);
    }
    
    console.log('🔄 forceRefreshData: Actualización forzada completada');
    return true;
  } catch (error) {
    console.error('🔄 forceRefreshData: Error en actualización forzada', error);
    return false;
  }
}

/**
 * Actualiza datos de un lead específico en todos los componentes
 */
export function forceSyncLead(leadId: string, name: string, stage?: string) {
  console.log(`🔄 forceRefreshData: Sincronizando lead ${leadId}: "${name}" (${stage || 'sin etapa'})`);
  
  try {
    // 1. Actualizar en caché global
    globalLeadCache.updateLeadData(leadId, { name, stage });
    
    // 2. Registrar nombre en el sistema de sincronización directa
    const normalizedId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
    registerLeadName(normalizedId, name);
    registerLeadName(leadId, name); // También con el ID original por si acaso
    
    // 3. Publicar cambio en el sistema de eventos globales
    publishLeadNameChange(normalizedId, name);
    
    // 4. Actualizar nombre en chatStore
    if (useChatStore && typeof useChatStore.getState === 'function') {
      const chatId = leadId.startsWith('lead_') ? leadId : `lead_${leadId}`;
      const store = useChatStore.getState();
      
      if (typeof store.updateChatName === 'function') {
        store.updateChatName(chatId, name);
      }
      
      if (stage && typeof store.updateChatMetadata === 'function') {
        store.updateChatMetadata(chatId, { stage, lastActivity: Date.now() });
      }
    }
    
    // 5. Crear evento DOM para otros componentes
    if (typeof window !== 'undefined') {
      const detail = {
        leadId: leadId,
        data: {
          full_name: name,
          stage: stage,
          _timestamp: Date.now(),
          _forceUpdate: true
        }
      };
      
      // Emitir varios eventos para asegurar que sea captado
      window.dispatchEvent(new CustomEvent('salesfunnel-lead-updated', {
        detail,
        bubbles: true
      }));
      
      window.dispatchEvent(new CustomEvent('syncLeadNames', {
        detail,
        bubbles: true
      }));
      
      console.log('🔄 forceRefreshData: Eventos de lead enviados', detail);
    }
    
    return true;
  } catch (error) {
    console.error('🔄 forceRefreshData: Error sincronizando lead', error);
    return false;
  }
}