/**
 * Utilidad de sincronización global entre componentes desacoplados
 * 
 * Esta utilidad proporciona un mecanismo para que componentes que no tienen relación
 * directa puedan sincronizarse eficientemente, evitando problemas con eventos DOM,
 * stores y otras técnicas que podrían fallar en ciertas condiciones.
 */

type SyncCallback = (data: any) => void;

// Almacén de callbacks registrados
const syncCallbacks: Record<string, SyncCallback[]> = {};

// Datos en caché para cada canal
const syncDataCache: Record<string, any> = {};

/**
 * Registra un callback para un canal específico
 * @param channel Nombre del canal de sincronización
 * @param callback Función a ejecutar cuando hay datos nuevos
 * @returns Función para desuscribirse
 */
export function registerSyncListener(channel: string, callback: SyncCallback): () => void {
    if (!syncCallbacks[channel]) {
        syncCallbacks[channel] = [];
    }
    
    // Añadir el callback
    syncCallbacks[channel].push(callback);
    
    // Si hay datos en caché, ejecutar el callback inmediatamente
    if (syncDataCache[channel] !== undefined) {
        try {
            callback(syncDataCache[channel]);
        } catch (error) {
            console.error(`[GlobalSync] Error ejecutando callback inicial para ${channel}:`, error);
        }
    }
    
    // Retornar función para desuscribirse
    return () => {
        if (syncCallbacks[channel]) {
            const index = syncCallbacks[channel].indexOf(callback);
            if (index !== -1) {
                syncCallbacks[channel].splice(index, 1);
            }
        }
    };
}

/**
 * Envía datos a todos los suscriptores de un canal
 * @param channel Nombre del canal
 * @param data Datos a enviar
 */
export function broadcastSyncData(channel: string, data: any): void {
    // Guardar los datos en caché
    syncDataCache[channel] = data;
    
    // Si hay callbacks registrados, ejecutarlos
    if (syncCallbacks[channel]) {
        syncCallbacks[channel].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[GlobalSync] Error en callback para ${channel}:`, error);
            }
        });
    }
    
    // También emitir como evento DOM por compatibilidad
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(`global-sync-${channel}`, {
            detail: data,
            bubbles: true
        }));
    }
}

/**
 * Publica un cambio de nombre de lead
 * @param leadId ID del lead
 * @param name Nuevo nombre
 */
export function publishLeadNameChange(leadId: string, name: string): void {
    // Normalizar ID
    const normalizedLeadId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
    
    // Crear datos
    const data = {
        leadId: normalizedLeadId,
        name,
        timestamp: Date.now()
    };
    
    // Publicar en el canal específico de ese lead
    broadcastSyncData(`lead-name-${normalizedLeadId}`, data);
    
    // También publicar en el canal general
    broadcastSyncData('lead-names', data);
    
    console.log(`[GlobalSync] Publicado cambio de nombre: ${normalizedLeadId} -> "${name}"`);
}

/**
 * Limpia todos los datos y suscriptores
 * Útil en casos de logout o reinicio de la aplicación
 */
export function clearAllSyncData(): void {
    Object.keys(syncCallbacks).forEach(key => {
        delete syncCallbacks[key];
    });
    
    Object.keys(syncDataCache).forEach(key => {
        delete syncDataCache[key];
    });
}