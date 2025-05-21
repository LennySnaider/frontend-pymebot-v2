/**
 * Store simple para actualizaciones de leads usando localStorage y Zustand
 * Comunicación entre pestañas sin complejidad
 * @version 2.0.0
 * @updated 2025-05-21
 */

import { create } from 'zustand';

interface Update {
    leadId: string;
    newStage: string;
    timestamp: number;
}

interface LeadUpdateState {
    changed: boolean;
    setChanged: (value: boolean) => void;
    clearChanged: () => void;
    getRecentUpdates: (maxAge?: number) => Update[];
}

// Estado global con Zustand
export const simpleLeadUpdateStore = create<LeadUpdateState>((set, get) => ({
    changed: false,
    setChanged: (value) => set({ changed: value }),
    clearChanged: () => set({ changed: false }),
    
    // Añadimos la función getRecentUpdates que estaba faltando
    getRecentUpdates: (maxAge: number = 5000): Update[] => {
        try {
            const data = localStorage.getItem('lead-stage-updates');
            const updates: Update[] = data ? JSON.parse(data) : [];
            const now = Date.now();
            
            // Filtrar actualizaciones recientes según el maxAge proporcionado
            return updates.filter(u => (now - u.timestamp) < maxAge);
        } catch (error) {
            console.error('Error obteniendo actualizaciones recientes:', error);
            return [];
        }
    }
}));

// Funciones de utilidad para localStorage
export const leadUpdateUtils = {
    // Guardar actualización en localStorage
    saveUpdate(leadId: string, newStage: string) {
        try {
            const updates = this.getUpdates();
            updates.push({
                leadId,
                newStage,
                timestamp: Date.now()
            });
            
            // Mantener solo las últimas 50 actualizaciones
            if (updates.length > 50) {
                updates.shift();
            }
            
            localStorage.setItem('lead-stage-updates', JSON.stringify(updates));
            console.log('Actualización guardada:', { leadId, newStage });
            
            // Actualizar el estado global
            if (simpleLeadUpdateStore && typeof simpleLeadUpdateStore.getState === 'function') {
                simpleLeadUpdateStore.getState().setChanged(true);
            } else {
                console.warn('simpleLeadUpdateStore.getState no es una función');
            }
        } catch (error) {
            console.error('Error guardando actualización:', error);
        }
    },
    
    // Obtener actualizaciones desde localStorage
    getUpdates(): Array<Update> {
        try {
            const data = localStorage.getItem('lead-stage-updates');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error obteniendo actualizaciones:', error);
            return [];
        }
    },
    
    // Obtener y limpiar actualizaciones recientes
    getRecentUpdates(maxAge: number = 5000): Array<Update> {
        const now = Date.now();
        const updates = this.getUpdates();
        
        // Filtrar actualizaciones recientes
        const recent = updates.filter(u => (now - u.timestamp) < maxAge);
        
        // Limpiar actualizaciones antiguas
        const remaining = updates.filter(u => (now - u.timestamp) < maxAge);
        localStorage.setItem('lead-stage-updates', JSON.stringify(remaining));
        
        return recent;
    }
};