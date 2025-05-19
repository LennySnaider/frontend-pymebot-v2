/**
 * Store global para notificaciones de actualización de leads
 * Permite comunicación entre el chat y el sales funnel
 */

type LeadUpdateListener = (leadId: string, newStage: string) => void;

class LeadUpdateStore {
    private listeners: Set<LeadUpdateListener> = new Set();
    
    // Suscribirse a actualizaciones
    subscribe(listener: LeadUpdateListener): () => void {
        this.listeners.add(listener);
        console.log('LeadUpdateStore: Listener agregado. Total listeners:', this.listeners.size);
        
        // Retornar función de desuscripción
        return () => {
            this.listeners.delete(listener);
            console.log('LeadUpdateStore: Listener removido. Total listeners:', this.listeners.size);
        };
    }
    
    // Notificar a todos los listeners
    notifyUpdate(leadId: string, newStage: string): void {
        console.log('LeadUpdateStore: Notificando actualización a', this.listeners.size, 'listeners');
        console.log('LeadUpdateStore: Datos de actualización:', { leadId, newStage });
        
        if (this.listeners.size === 0) {
            console.warn('LeadUpdateStore: No hay listeners registrados!');
        }
        
        this.listeners.forEach((listener, index) => {
            try {
                console.log(`LeadUpdateStore: Llamando listener ${index + 1}/${this.listeners.size}`);
                listener(leadId, newStage);
            } catch (error) {
                console.error('Error en listener de actualización:', error);
            }
        });
    }
}

// Singleton
export const leadUpdateStore = new LeadUpdateStore();