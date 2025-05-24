/**
 * Utilidad simplificada para forzar la sincronización del nombre
 * Versión robusta que evita errores de propiedades undefined
 */

import globalLeadCache from '@/stores/globalLeadCache';
import { publishLeadNameChange } from '@/utils/globalSyncEvent';

/**
 * Versión segura de sincronización de nombres
 */
export async function safeForceNameSync(leadId: string, newName: string): Promise<void> {
    console.log(`[SafeForceNameSync] Iniciando para ${leadId}: "${newName}"`);
    
    if (!leadId || !newName) {
        console.warn('[SafeForceNameSync] ID o nombre inválido');
        return;
    }
    
    // Normalizar ID
    const normalizedId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
    
    try {
        // 1. Actualizar caché global (esto es seguro)
        globalLeadCache.updateLeadData(normalizedId, { name: newName });
        console.log('[SafeForceNameSync] Caché global actualizado');
        
        // 2. Publicar cambio (esto también es seguro)
        publishLeadNameChange(normalizedId, newName);
        console.log('[SafeForceNameSync] Cambio publicado');
        
        // 3. Emitir eventos DOM de forma segura
        if (typeof window !== 'undefined') {
            const eventData = {
                leadId: normalizedId,
                name: newName,
                timestamp: Date.now()
            };
            
            // Emitir evento simple
            try {
                window.dispatchEvent(new CustomEvent('lead-name-sync', {
                    detail: eventData,
                    bubbles: true
                }));
            } catch (e) {
                console.warn('[SafeForceNameSync] Error emitiendo evento:', e);
            }
        }
        
        console.log(`[SafeForceNameSync] Completado para ${leadId}`);
    } catch (error) {
        console.error('[SafeForceNameSync] Error:', error);
    }
}

// Exponer globalmente
if (typeof window !== 'undefined') {
    (window as any).__safeForceNameSync = safeForceNameSync;
}
