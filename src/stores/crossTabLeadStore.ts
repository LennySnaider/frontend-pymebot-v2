/**
 * Store para sincronización de actualizaciones de leads entre pestañas/páginas
 * Usa BroadcastChannel API para comunicación entre pestañas
 */

type LeadUpdate = {
    leadId: string;
    newStage: string;
    timestamp: number;
}

class CrossTabLeadStore {
    private channel: BroadcastChannel | null = null;
    private listeners: Set<(update: LeadUpdate) => void> = new Set();
    private channelName = 'lead-stage-updates';
    
    constructor() {
        // Solo inicializar en el cliente
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            this.initChannel();
        } else {
            console.warn('BroadcastChannel no soportado, usando localStorage como fallback');
        }
    }
    
    private initChannel() {
        try {
            this.channel = new BroadcastChannel(this.channelName);
            
            // Escuchar mensajes de otras pestañas
            this.channel.onmessage = (event) => {
                console.log('CrossTabLeadStore: Mensaje recibido de otra pestaña:', event.data);
                this.notifyListeners(event.data);
            };
            
            console.log('CrossTabLeadStore: Canal iniciado correctamente');
        } catch (error) {
            console.error('Error iniciando BroadcastChannel:', error);
        }
    }
    
    // Enviar actualización a todas las pestañas
    broadcastUpdate(leadId: string, newStage: string) {
        const update: LeadUpdate = {
            leadId,
            newStage,
            timestamp: Date.now()
        };
        
        console.log('CrossTabLeadStore: Enviando actualización a todas las pestañas:', update);
        
        if (this.channel) {
            this.channel.postMessage(update);
        } else {
            // Fallback usando localStorage + storage event
            this.localStorageFallback(update);
        }
        
        // También notificar a listeners locales
        this.notifyListeners(update);
    }
    
    // Fallback para navegadores sin BroadcastChannel
    private localStorageFallback(update: LeadUpdate) {
        try {
            const key = `lead-update-${Date.now()}`;
            localStorage.setItem(key, JSON.stringify(update));
            
            // Limpiar después de 1 segundo
            setTimeout(() => {
                localStorage.removeItem(key);
            }, 1000);
        } catch (error) {
            console.error('Error en localStorage fallback:', error);
        }
    }
    
    // Suscribirse a actualizaciones
    subscribe(callback: (update: LeadUpdate) => void): () => void {
        this.listeners.add(callback);
        console.log('CrossTabLeadStore: Listener agregado. Total:', this.listeners.size);
        
        // Si no hay BroadcastChannel, escuchar eventos de storage
        if (!this.channel && typeof window !== 'undefined') {
            const storageHandler = (e: StorageEvent) => {
                if (e.key && e.key.startsWith('lead-update-') && e.newValue) {
                    try {
                        const update = JSON.parse(e.newValue);
                        console.log('CrossTabLeadStore: Actualización recibida vía storage:', update);
                        callback(update);
                    } catch (error) {
                        console.error('Error procesando evento storage:', error);
                    }
                }
            };
            
            window.addEventListener('storage', storageHandler);
            
            // Retornar función de limpieza mejorada
            return () => {
                this.listeners.delete(callback);
                window.removeEventListener('storage', storageHandler);
                console.log('CrossTabLeadStore: Listener removido. Total:', this.listeners.size);
            };
        }
        
        // Retornar función de limpieza normal
        return () => {
            this.listeners.delete(callback);
            console.log('CrossTabLeadStore: Listener removido. Total:', this.listeners.size);
        };
    }
    
    // Notificar a todos los listeners locales
    private notifyListeners(update: LeadUpdate) {
        this.listeners.forEach(listener => {
            try {
                listener(update);
            } catch (error) {
                console.error('Error en listener:', error);
            }
        });
    }
    
    // Limpiar recursos
    cleanup() {
        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
        this.listeners.clear();
    }
}

// Singleton
export const crossTabLeadStore = new CrossTabLeadStore();