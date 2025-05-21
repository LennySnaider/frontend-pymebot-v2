/**
 * Utilidad de emergencia para sincronización directa entre SalesFunnel y ChatList
 * 
 * Esta solución usa un enfoque de polling continuo para garantizar la sincronización
 * incluso cuando otros mecanismos fallan.
 */

// Almacén global para nombres de leads
const globalLeadNames = new Map();

// Función para registrar un nombre de lead
export function registerLeadName(leadId, name) {
  // Normalizar ID (quitar prefijo lead_ si existe)
  const normalizedId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
  
  // Guardar en el almacén global
  globalLeadNames.set(normalizedId, name);
  console.log(`[DIRECT SYNC] Registrado nombre para lead ${normalizedId}: "${name}"`);
  
  // Forzar la sincronización inmediata
  syncLeadNames();
}

// Función para obtener el nombre de un lead
export function getLeadName(leadId) {
  // Normalizar ID
  const normalizedId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
  
  // Obtener del almacén global
  return globalLeadNames.get(normalizedId);
}

// Función para sincronizar nombres de leads entre componentes
function syncLeadNames() {
  if (typeof window === 'undefined') return;
  
  try {
    // Intentar importar el chatStore directamente (solo en cliente)
    import('@/app/(protected-pages)/modules/marketing/chat/_store/chatStore')
      .then(({ useChatStore }) => {
        if (useChatStore && typeof useChatStore.getState === 'function') {
          const chatStore = useChatStore.getState();
          
          // Verificar si chats está disponible
          if (chatStore && chatStore.chats && Array.isArray(chatStore.chats)) {
            let hasUpdates = false;
            
            // Actualizar todos los nombres que conocemos
            chatStore.chats.forEach(chat => {
              // Solo procesar si es un lead
              if (chat.id && chat.id.startsWith('lead_')) {
                const normalizedId = chat.id.substring(5);
                const knownName = globalLeadNames.get(normalizedId);
                
                // Si tenemos un nombre nuevo para este lead, actualizarlo
                if (knownName && chat.name !== knownName) {
                  console.log(`[DIRECT SYNC] Actualizando ${chat.id} de "${chat.name}" a "${knownName}"`);
                  
                  if (typeof chatStore.updateChatName === 'function') {
                    chatStore.updateChatName(chat.id, knownName);
                    hasUpdates = true;
                  }
                }
              }
            });
            
            // Si hubo actualizaciones, forzar un refresh
            if (hasUpdates && typeof chatStore.refreshChatList === 'function') {
              setTimeout(() => {
                chatStore.refreshChatList()
                  .catch(error => console.error('[DIRECT SYNC] Error en refresh:', error));
              }, 100);
            }
          }
        }
      })
      .catch(error => console.error('[DIRECT SYNC] Error importando chatStore:', error));
  } catch (error) {
    console.error('[DIRECT SYNC] Error en syncLeadNames:', error);
  }
}

// Iniciar sincronización periódica (cada 2 segundos)
let intervalId = null;

export function startPollingSync() {
  if (typeof window === 'undefined') return;
  
  // Detener intervalo existente si hay uno
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  // Iniciar nuevo intervalo
  intervalId = setInterval(syncLeadNames, 2000);
  console.log('[DIRECT SYNC] Iniciado polling de sincronización cada 2 segundos');
  
  // Sincronizar inmediatamente al iniciar
  syncLeadNames();
}

export function stopPollingSync() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[DIRECT SYNC] Detenido polling de sincronización');
  }
}

// Iniciar sincronización automáticamente en el cliente
if (typeof window !== 'undefined') {
  startPollingSync();
}