/**
 * Store global para notificaciones de actualización de leads
 * Permite comunicación entre el chat y el sales funnel
 */

import { create } from 'zustand';

type LeadUpdateListener = (leadId: string, newStage: string) => void;

interface UpdateData {
    [key: string]: any;
}

interface Update {
    type: string;
    leadId: string;
    data: UpdateData;
    time: number;
}

interface LeadUpdateState {
    listeners: Set<LeadUpdateListener>;
    updates: Update[];
    subscribe: (listener: LeadUpdateListener) => () => void;
    notifyUpdate: (leadId: string, newStage: string) => void;
    addUpdate: (update: Update) => void;
    getUpdates: () => Update[];
}

// Crear store con Zustand para compatibilidad con getState() y mayor facilidad de uso
export const leadUpdateStore = create<LeadUpdateState>((set, get) => ({
    listeners: new Set<LeadUpdateListener>(),
    updates: [],
    
    // Suscribirse a actualizaciones
    subscribe: (listener: LeadUpdateListener) => {
        const state = get();
        state.listeners.add(listener);
        console.log('LeadUpdateStore: Listener agregado. Total listeners:', state.listeners.size);
        
        // Retornar función de desuscripción
        return () => {
            const currentState = get();
            currentState.listeners.delete(listener);
            console.log('LeadUpdateStore: Listener removido. Total listeners:', currentState.listeners.size);
        };
    },
    
    // Notificar a todos los listeners
    notifyUpdate: (leadId: string, newStage: string) => {
        const state = get();
        console.log('LeadUpdateStore: Notificando actualización a', state.listeners.size, 'listeners');
        console.log('LeadUpdateStore: Datos de actualización:', { leadId, newStage });
        
        if (state.listeners.size === 0) {
            console.warn('LeadUpdateStore: No hay listeners registrados!');
        }
        
        let index = 0;
        state.listeners.forEach((listener) => {
            try {
                console.log(`LeadUpdateStore: Llamando listener ${index + 1}/${state.listeners.size}`);
                listener(leadId, newStage);
                index++;
            } catch (error) {
                console.error('Error en listener de actualización:', error);
            }
        });
        
        // Agregar a la lista de actualizaciones
        set((state) => ({
            updates: [...state.updates, {
                type: 'update-stage',
                leadId,
                data: { newStage },
                time: Date.now()
            }]
        }));
    },
    
    // Agregar una actualización al historial
    addUpdate: (update: Update) => {
        set((state) => ({
            updates: [...state.updates, update]
        }));
        
        // Si es una actualización de etapa, notificar a los listeners
        if (update.type === 'update-stage' && update.data.newStage) {
            const state = get();
            state.listeners.forEach(listener => {
                try {
                    listener(update.leadId, update.data.newStage);
                } catch (error) {
                    console.error('Error en listener durante addUpdate:', error);
                }
            });
        }
    },
    
    // Obtener todas las actualizaciones
    getUpdates: () => {
        return get().updates;
    }
}));