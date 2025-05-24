/**
 * Función simple para actualizar el caché cuando se guarda desde Sales Funnel
 */

import globalLeadCache from '@/stores/globalLeadCache'

export function updateLeadNameEverywhere(leadId: string, name: string) {
    console.log(`[UpdateLeadName] Actualizando ${leadId} a "${name}"`)

    // Normalizar ID - IMPORTANTE: quitar el prefijo lead_ si existe
    const cleanId = leadId.replace('lead_', '')

    // 1. Actualizar caché global (esto disparará los listeners)
    globalLeadCache.updateLeadData(cleanId, { name })

    // 2. Emitir evento simple
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('lead-name-sync', {
                detail: {
                    leadId: cleanId,
                    name: name,
                    timestamp: Date.now(),
                },
                bubbles: true,
            }),
        )
    }

    console.log(`[UpdateLeadName] Completado para ${cleanId}`)
}

// Exponer globalmente para debug
if (typeof window !== 'undefined') {
    ;(window as any).__updateLeadNameEverywhere = updateLeadNameEverywhere
}
