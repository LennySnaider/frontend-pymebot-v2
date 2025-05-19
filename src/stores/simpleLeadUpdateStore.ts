/**
 * Store simple para actualizaciones de leads usando localStorage
 * Comunicación entre pestañas sin complejidad
 */

export const simpleLeadUpdateStore = {
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
        } catch (error) {
            console.error('Error guardando actualización:', error);
        }
    },
    
    // Obtener actualizaciones desde localStorage
    getUpdates(): Array<{leadId: string, newStage: string, timestamp: number}> {
        try {
            const data = localStorage.getItem('lead-stage-updates');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error obteniendo actualizaciones:', error);
            return [];
        }
    },
    
    // Obtener y limpiar actualizaciones recientes
    getRecentUpdates(maxAge: number = 5000): Array<{leadId: string, newStage: string}> {
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