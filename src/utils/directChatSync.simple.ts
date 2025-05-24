// Versión simplificada temporalmente para evitar errores de chunks
export async function updateChatLeadName(leadId: string, name: string): Promise<void> {
    console.log(`[DirectChatSync] Función temporalmente deshabilitada - lead ${leadId}: "${name}"`);
    
    // Solo actualizar el caché global por ahora
    if (typeof window !== 'undefined') {
        try {
            const { default: globalLeadCache } = await import('@/stores/globalLeadCache');
            const normalizedId = leadId.startsWith('lead_') ? leadId.substring(5) : leadId;
            globalLeadCache.updateLeadData(normalizedId, { name });
        } catch (error) {
            console.error('[DirectChatSync] Error actualizando caché:', error);
        }
    }
}

export function getPendingUpdates() {
    return new Map();
}

export function cleanOldPendingUpdates() {
    // No-op
}

export async function flushPendingUpdates() {
    // No-op
}
