// Versión mínima y segura de sincronización
export function updateLeadNameInCache(leadId: string, name: string) {
    try {
        const normalizedId = leadId.replace('lead_', '');
        console.log(`Actualizando ${normalizedId} a "${name}"`);
        
        // Solo actualizar si el caché existe
        if (typeof window !== 'undefined' && (window as any).__globalLeadCache) {
            (window as any).__globalLeadCache.updateLeadData(normalizedId, { name });
        }
    } catch (e) {
        console.error('Error en actualización:', e);
    }
}
