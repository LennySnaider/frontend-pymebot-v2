/**
 * Utilidad para comunicación instantánea entre pestañas usando BroadcastChannel
 * Con fallback a localStorage para navegadores que no soportan BroadcastChannel
 */

export interface LeadUpdateMessage {
  type: 'lead-stage-update';
  leadId: string;
  newStage: string;
  timestamp: number;
}

// Verificar si BroadcastChannel está disponible
const isBroadcastChannelSupported = typeof window !== 'undefined' && 'BroadcastChannel' in window;

// Crear canal de comunicación si es soportado
let channel: BroadcastChannel | null = null;
if (isBroadcastChannelSupported) {
  channel = new BroadcastChannel('lead-updates-channel');
}

/**
 * Enviar actualización de lead a todas las pestañas
 */
export function broadcastLeadUpdate(leadId: string, newStage: string): void {
  const message: LeadUpdateMessage = {
    type: 'lead-stage-update',
    leadId,
    newStage,
    timestamp: Date.now()
  };

  // Usar BroadcastChannel si está disponible (más rápido)
  if (channel) {
    channel.postMessage(message);
    console.log('Lead update broadcasted via BroadcastChannel:', message);
  }
  
  // También usar localStorage como fallback
  try {
    const updates = getStoredUpdates();
    updates.push(message);
    
    // Mantener solo las últimas 50 actualizaciones
    if (updates.length > 50) {
      updates.shift();
    }
    
    localStorage.setItem('lead-stage-updates-v2', JSON.stringify(updates));
    // Disparar evento storage para notificar a otras pestañas
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'lead-stage-updates-v2',
      newValue: JSON.stringify(updates),
      url: window.location.href
    }));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Suscribirse a actualizaciones de leads
 */
export function subscribeToLeadUpdates(callback: (message: LeadUpdateMessage) => void): () => void {
  // Suscribirse a BroadcastChannel si está disponible
  let channelHandler: ((event: MessageEvent) => void) | null = null;
  
  if (channel) {
    channelHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'lead-stage-update') {
        callback(event.data);
      }
    };
    channel.addEventListener('message', channelHandler);
  }
  
  // También suscribirse a storage events como fallback
  const storageHandler = (event: StorageEvent) => {
    if (event.key === 'lead-stage-updates-v2' && event.newValue) {
      try {
        const updates = JSON.parse(event.newValue);
        const latestUpdate = updates[updates.length - 1];
        if (latestUpdate && (Date.now() - latestUpdate.timestamp) < 5000) {
          callback(latestUpdate);
        }
      } catch (error) {
        console.error('Error parsing storage update:', error);
      }
    }
  };
  
  window.addEventListener('storage', storageHandler);
  
  // Retornar función de limpieza
  return () => {
    if (channel && channelHandler) {
      channel.removeEventListener('message', channelHandler);
    }
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Obtener actualizaciones almacenadas
 */
function getStoredUpdates(): LeadUpdateMessage[] {
  try {
    const data = localStorage.getItem('lead-stage-updates-v2');
    if (!data) return [];
    
    const updates = JSON.parse(data);
    const now = Date.now();
    
    // Filtrar actualizaciones muy antiguas (más de 5 minutos)
    return updates.filter((update: LeadUpdateMessage) => 
      now - update.timestamp < 300000
    );
  } catch (error) {
    console.error('Error reading stored updates:', error);
    return [];
  }
}

/**
 * Obtener actualizaciones recientes
 */
export function getRecentUpdates(maxAgeMs: number = 5000): LeadUpdateMessage[] {
  const updates = getStoredUpdates();
  const now = Date.now();
  return updates.filter(update => now - update.timestamp < maxAgeMs);
}